import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getItem, setItem, removeItem } from '../utils/localStorage';
import { logger } from '../utils/logger';

/**
 * Configuration constants for API behavior
 */
const NO_OF_RETRY = 3;
const RETRY_DELAY = 1000; // Base delay in milliseconds
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_REFRESH_RETRIES = 3; // Maximum refresh token attempts
const AUTH_RETRY_DELAY = 2000; // Delay for auth retry attempts

/**
 * @class ApiHelper
 * @description Enhanced API client with tenant awareness, retry logic, and auth handling
 */
class ApiHelper {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Location': 'web', // Identifies requests from web client
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - inject auth and tenant headers
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication header if token exists
        const authData = getItem('authToken') as { authToken?: string } | null;
        if (authData?.authToken) {
          config.headers.Authentication = authData.authToken;
        }

        // Add tenant header if tenant is selected
        const currentTenantId = getItem('currentTenantId');
        if (currentTenantId) {
          config.headers['X-Tenant-Id'] = currentTenantId;
        }

        // Add request metadata for debugging
        (config as AxiosRequestConfig & { metadata?: { startTime: Date; retryCount: number; isRefreshRetry?: boolean } }).metadata = {
          startTime: new Date(),
          retryCount: 0
        };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle auth and retry logic
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time in development
        if (process.env.NODE_ENV === 'development') {
          const endTime = new Date();
          const startTime = (response.config as AxiosRequestConfig & { metadata?: { startTime: Date } }).metadata?.startTime;
          if (startTime) {
            const duration = endTime.getTime() - startTime.getTime();
            logger.api.response(response.config.method?.toUpperCase() || 'UNKNOWN', response.config.url || '', response.status, { duration: `${duration}ms` });
          }
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const retryCount = originalRequest.metadata?.retryCount || 0;

        // Handle 401 Unauthorized with refresh token logic (max 3 retries)
        if (error.response?.status === 401 && this.shouldRetryAuth(originalRequest)) {
          const refreshAttempts = (originalRequest._refreshAttempts || 0) + 1;
          originalRequest._refreshAttempts = refreshAttempts;
          
          if (refreshAttempts <= MAX_REFRESH_RETRIES) {
            try {
              const authData = getItem('authToken') as { refreshToken?: string } | null;
              if (authData?.refreshToken) {
                // Add delay before retry attempt  
                if (refreshAttempts > 1) {
                  const delay = AUTH_RETRY_DELAY * refreshAttempts;
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                // Attempt to refresh the token
                const refreshResponse = await this.refreshToken(authData.refreshToken);
                
                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.authToken}`;
                
                // Reset metadata for the retry
                originalRequest.metadata = { ...originalRequest.metadata, isRefreshRetry: true };
                
                // Retry the original request
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              // If we've exhausted retries or refresh fails, force logout
              if (refreshAttempts >= MAX_REFRESH_RETRIES) {
                this.handleAuthFailure();
                return Promise.reject(this.createUserFriendlyError(refreshError as Error, 'Authentication failed. Please log in again.'));
              }
              // Otherwise continue to retry
              originalRequest._refreshAttempts = refreshAttempts;
              return this.client(originalRequest);
            }
          } else {
            // Max retries exceeded, force logout
            this.handleAuthFailure();
            return Promise.reject(this.createUserFriendlyError(error, 'Authentication failed after multiple attempts. Please log in again.'));
          }
        }

        // Handle specific auth endpoint failures (force logout)
        if (this.isAuthEndpointFailure(error)) {
          this.handleAuthFailure();
          return Promise.reject(this.createUserFriendlyError(error, 'Authentication service error. Please log in again.'));
        }

        // Handle retryable network errors with exponential backoff
        if (this.shouldRetry(error) && retryCount < NO_OF_RETRY) {
          originalRequest.metadata = originalRequest.metadata || {};
          originalRequest.metadata.retryCount = retryCount + 1;
          
          // Exponential backoff delay with jitter
          const baseDelay = RETRY_DELAY * Math.pow(2, retryCount);
          const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
          const delay = baseDelay + jitter;
          
          logger.warn(`Retrying request (${retryCount + 1}/${NO_OF_RETRY}) after ${Math.round(delay)}ms: ${error.message}`, 'ApiHelper');
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.client(originalRequest);
        }

        // Return user-friendly error message
        return Promise.reject(this.createUserFriendlyError(error));
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(refreshToken: string): Promise<{ authToken: string }> {
    try {
      // Use a separate axios instance to avoid interceptor loops
      const refreshClient = axios.create({
        baseURL: this.client.defaults.baseURL,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const response = await refreshClient.put('/auth/refresh', {
        refreshToken
      });
      
      const { user, authToken: newToken } = response.data.data;
      
      // Update stored auth data
      const updatedAuthData = { 
        userId: user.id, 
        authToken: newToken, 
        refreshToken: newToken 
      };
      setItem('authToken', updatedAuthData);
      
      return { authToken: newToken };
    } catch (error) {
      // Remove invalid tokens on refresh failure
      removeItem('authToken');
      removeItem('currentTenantId');
      throw error;
    }
  }

  /**
   * Check if error is from auth endpoint and should force logout
   */
  private isAuthEndpointFailure(error: { config?: { url?: string }; response?: { status?: number } }): boolean {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isServerError = (error.response?.status ?? 0) >= 400;

    return Boolean(isAuthEndpoint && isServerError);
  }

  /**
   * Check if request should retry authentication
   */
  private shouldRetryAuth(request: { url?: string; metadata?: { isRefreshRetry?: boolean } }): boolean {
    // Don't retry if it's already an auth refresh request
    if (request.url?.includes('/auth/refresh')) {
      return false;
    }
    
    // Don't retry if already marked as a refresh retry to avoid loops
    if (request.metadata?.isRefreshRetry) {
      return false;
    }
    
    return true;
  }

  /**
   * Handle authentication failure - cleanup and redirect
   */
  private handleAuthFailure(): void {
    // Clear stored authentication data
    removeItem('authToken');
    removeItem('currentTenantId');
    
    // Emit auth logout event for app-wide handling
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
    // Redirect to login (or let app handle via event)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: { response?: { status?: number }; code?: string; message?: string }): boolean {
    // Don't retry client errors (4xx except 401)
    const status = error.response?.status ?? 0;
    if (status >= 400 && status < 500 && status !== 401) {
      return false;
    }

    // Retry on network errors, timeouts, or 5xx server errors
    return (
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.toLowerCase().includes('network error') ||
      error.message?.toLowerCase().includes('timeout') ||
      (status >= 500 && status <= 599)
    );
  }

  /**
   * Create user-friendly error messages
   */
  private createUserFriendlyError(error: { response?: { status: number; data?: { message?: string; code?: string } }; code?: string; message?: string }, customMessage?: string): Error {
    const friendlyError = new Error();
    
    if (customMessage) {
      friendlyError.message = customMessage;
    } else if (error.response?.data?.message) {
      // Use API-provided error message
      friendlyError.message = error.response.data.message;
    } else if (error.response?.status) {
      // Create friendly message based on status code
      switch (error.response.status) {
        case 400:
          friendlyError.message = 'Invalid request. Please check your input and try again.';
          break;
        case 401:
          friendlyError.message = 'Authentication required. Please log in and try again.';
          break;
        case 403:
          friendlyError.message = 'You do not have permission to perform this action.';
          break;
        case 404:
          friendlyError.message = 'The requested resource was not found.';
          break;
        case 429:
          friendlyError.message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          friendlyError.message = 'Server error. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          friendlyError.message = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          friendlyError.message = 'An unexpected error occurred. Please try again.';
      }
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      friendlyError.message = 'Network connection error. Please check your internet connection and try again.';
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      friendlyError.message = 'Request timed out. Please try again.';
    } else {
      friendlyError.message = error.message || 'An unexpected error occurred. Please try again.';
    }

    // Preserve original error properties
    Object.assign(friendlyError, {
      originalError: error,
      status: error.response?.status,
      code: error.response?.data?.code || error.code,
      data: error.response?.data
    });

    return friendlyError;
  }

  // HTTP method wrappers
  public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  public post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  public put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  public patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Utility methods
  public setCurrentTenant(tenantId: string): void {
    localStorage.setItem('currentTenantId', tenantId);
  }

  public getCurrentTenant(): string | null {
    return getItem('currentTenantId');
  }

  public clearCurrentTenant(): void {
    removeItem('currentTenantId');
  }

  public updateBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }
}

// Export singleton instance
export const apiHelper = new ApiHelper();
export default apiHelper;