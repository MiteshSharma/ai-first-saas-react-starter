# Core Framework Documentation

The Core Framework is the foundation of the AI-First SaaS React Starter, providing essential services, utilities, and patterns that all plugins build upon. This documentation covers every aspect of the core framework.

## 🏗️ Core Framework Overview

The Core Framework provides the **solid foundation** that enables the plugin architecture to work seamlessly:

```
Core Framework
├── 🔐 Authentication System    # Complete auth with JWT, refresh tokens
├── 🌐 API Layer               # HTTP client with interceptors, caching
├── 🏪 State Management        # Zustand patterns and base stores
├── 🎛️ Event Bus System        # Type-safe event communication
├── 🔌 Plugin Management       # Plugin lifecycle and context
├── 🛣️ Router System           # Route management and guards
├── 🔧 Utilities Library       # Storage, validation, formatting helpers
└── 🌍 Type System             # TypeScript definitions and interfaces
```

## 🔐 Authentication System (`/src/core/auth`)

### Overview

The authentication system provides **comprehensive user authentication** with JWT tokens, refresh token handling, and role-based access control.

### File Structure
```
src/core/auth/
├── AuthService.ts              # Core authentication business logic
├── AuthStore.ts                # Authentication state management
├── authAPI.ts                  # Authentication API integration
├── tokenStorage.ts             # Secure token storage
├── types/                      # Authentication type definitions
│   ├── auth.types.ts           # Auth-related interfaces
│   ├── user.types.ts           # User-related interfaces
│   └── permissions.types.ts    # Permission system types
└── __tests__/                  # Authentication tests
    ├── AuthService.test.ts
    ├── AuthStore.test.ts
    └── authAPI.test.ts
```

### AuthService - Core Authentication Logic

```typescript
// src/core/auth/AuthService.ts
export class AuthService {
  private apiHelper: ApiHelper;
  private tokenStorage: TokenStorage;
  private authStore: AuthStore;

  constructor(apiHelper: ApiHelper) {
    this.apiHelper = apiHelper;
    this.tokenStorage = new TokenStorage();
    this.authStore = useAuthStore.getState();
  }

  /**
   * Authenticate user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      this.authStore.setLoading(true);

      // Call authentication API
      const response = await this.apiHelper.post<AuthResponse>('/auth/login', credentials);

      // Store tokens securely
      this.tokenStorage.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      });

      // Update auth state
      this.authStore.setAuth(response.user, response.accessToken);

      // Emit login event for plugins
      eventBus.emit('USER_LOGIN', {
        user: response.user,
        timestamp: new Date(),
        loginMethod: credentials.method || 'password'
      });

      return {
        success: true,
        user: response.user,
        token: response.accessToken
      };
    } catch (error) {
      this.authStore.setError(error.message);
      eventBus.emit('USER_LOGIN_FAILED', { error: error.message });
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * Logout user and cleanup
   */
  async logout(): Promise<void> {
    try {
      // Call logout API to invalidate tokens
      await this.apiHelper.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always cleanup local state
      this.tokenStorage.clearTokens();
      this.authStore.clearAuth();

      // Emit logout event
      eventBus.emit('USER_LOGOUT', { timestamp: new Date() });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.apiHelper.post<RefreshResponse>('/auth/refresh', {
        refreshToken
      });

      // Update stored tokens
      this.tokenStorage.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || refreshToken,
        expiresAt: response.expiresAt
      });

      // Update auth store
      this.authStore.setToken(response.accessToken);

      // Emit token refresh event
      eventBus.emit('TOKEN_REFRESHED', { timestamp: new Date() });

      return response.accessToken;
    } catch (error) {
      // Refresh failed, logout user
      await this.logout();
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return null;

    try {
      const response = await this.apiHelper.get<User>('/auth/me');
      this.authStore.setUser(response);
      return response;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.tokenStorage.getAccessToken();
    const isExpired = this.tokenStorage.isTokenExpired();
    return !!token && !isExpired;
  }

  /**
   * Check user permissions
   */
  hasPermission(permission: string): boolean {
    const user = this.authStore.getState().user;
    return user?.permissions?.includes(permission) ?? false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    const user = this.authStore.getState().user;
    return user?.roles?.includes(role) ?? false;
  }
}
```

### AuthStore - State Management

```typescript
// src/core/auth/AuthStore.ts
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;

  // Actions
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  updateLastActivity: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastActivity: null,

  // Actions
  setAuth: (user: User, token: string) => {
    set({
      user,
      token,
      isAuthenticated: true,
      error: null,
      lastActivity: new Date()
    });

    // Start session monitoring
    sessionMonitor.startMonitoring();
  },

  setUser: (user: User) => {
    set({ user });
  },

  setToken: (token: string) => {
    set({ token });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearAuth: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      lastActivity: null
    });

    // Stop session monitoring
    sessionMonitor.stopMonitoring();
  },

  updateLastActivity: () => {
    set({ lastActivity: new Date() });
  }
}));

// Session monitoring for auto-logout
class SessionMonitor {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  startMonitoring(): void {
    this.resetTimeout();
    document.addEventListener('mousedown', this.resetTimeout);
    document.addEventListener('keydown', this.resetTimeout);
  }

  stopMonitoring(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    document.removeEventListener('mousedown', this.resetTimeout);
    document.removeEventListener('keydown', this.resetTimeout);
  }

  private resetTimeout = (): void => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      const authService = new AuthService(apiHelper);
      authService.logout();
    }, this.TIMEOUT_DURATION);

    useAuthStore.getState().updateLastActivity();
  };
}

const sessionMonitor = new SessionMonitor();
```

### Token Storage - Secure Token Management

```typescript
// src/core/auth/tokenStorage.ts
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'ai_first_access_token';
  private readonly REFRESH_TOKEN_KEY = 'ai_first_refresh_token';
  private readonly EXPIRES_AT_KEY = 'ai_first_expires_at';

  /**
   * Store authentication tokens
   */
  setTokens(tokens: TokenData): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(this.EXPIRES_AT_KEY, tokens.expiresAt.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    try {
      const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
      if (!expiresAt) return true;

      return Date.now() >= parseInt(expiresAt, 10);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.EXPIRES_AT_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiry(): number {
    try {
      const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
      if (!expiresAt) return 0;

      return Math.max(0, parseInt(expiresAt, 10) - Date.now());
    } catch (error) {
      console.error('Failed to calculate time until expiry:', error);
      return 0;
    }
  }
}
```

## 🌐 API Layer (`/src/core/api`)

### Overview

The API layer provides a **centralized HTTP client** with interceptors for authentication, error handling, caching, and logging.

### File Structure
```
src/core/api/
├── ApiHelper.ts                # Main HTTP client wrapper
├── interceptors/               # Request/Response interceptors
│   ├── authInterceptor.ts      # Authentication handling
│   ├── errorInterceptor.ts     # Error handling and retry logic
│   ├── cacheInterceptor.ts     # Response caching
│   └── loggingInterceptor.ts   # Request/response logging
├── types/                      # API type definitions
│   ├── api.types.ts            # API-related interfaces
│   ├── response.types.ts       # Response format types
│   └── request.types.ts        # Request format types
└── __tests__/                  # API tests
    ├── ApiHelper.test.ts
    └── interceptors/
```

### ApiHelper - Core HTTP Client

```typescript
// src/core/api/ApiHelper.ts
export class ApiHelper {
  private client: AxiosInstance;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptors
    this.client.interceptors.request.use(
      authInterceptor.onRequest,
      authInterceptor.onRequestError
    );

    this.client.interceptors.request.use(
      loggingInterceptor.onRequest,
      loggingInterceptor.onRequestError
    );

    // Response interceptors
    this.client.interceptors.response.use(
      cacheInterceptor.onResponse,
      cacheInterceptor.onResponseError
    );

    this.client.interceptors.response.use(
      errorInterceptor.onResponse,
      errorInterceptor.onResponseError
    );

    this.client.interceptors.response.use(
      loggingInterceptor.onResponse,
      loggingInterceptor.onResponseError
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request deduplication - prevent duplicate requests
   */
  async getWithDeduplication<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const key = this.getRequestKey('GET', url, config);

    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    const promise = this.get<T>(url, config);
    this.requestQueue.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  /**
   * Upload file with progress
   */
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      }
    };

    return this.post<T>(url, formData, config);
  }

  /**
   * Download file
   */
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic error handler
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        details: error.response?.data?.details
      };
    }

    return {
      message: error.message || 'An unknown error occurred',
      status: 500
    };
  }

  /**
   * Generate request key for deduplication
   */
  private getRequestKey(method: string, url: string, config?: AxiosRequestConfig): string {
    const params = config?.params ? JSON.stringify(config.params) : '';
    return `${method}:${url}:${params}`;
  }
}

// Global API helper instance
export const apiHelper = new ApiHelper();
```

### Interceptors

#### Authentication Interceptor
```typescript
// src/core/api/interceptors/authInterceptor.ts
export const authInterceptor = {
  onRequest: (config: AxiosRequestConfig): AxiosRequestConfig => {
    const tokenStorage = new TokenStorage();
    const token = tokenStorage.getAccessToken();

    if (token && !tokenStorage.isTokenExpired()) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  onRequestError: (error: any): Promise<any> => {
    return Promise.reject(error);
  }
};
```

#### Error Interceptor
```typescript
// src/core/api/interceptors/errorInterceptor.ts
export const errorInterceptor = {
  onResponse: (response: AxiosResponse): AxiosResponse => {
    return response;
  },

  onResponseError: async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 (Unauthorized) - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authService = new AuthService(apiHelper);
        const newToken = await authService.refreshToken();

        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axios.request(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        eventBus.emit('AUTH_TOKEN_EXPIRED');
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 (Forbidden)
    if (error.response?.status === 403) {
      eventBus.emit('AUTH_FORBIDDEN', {
        url: error.config?.url,
        method: error.config?.method
      });
    }

    // Handle network errors
    if (!error.response) {
      eventBus.emit('NETWORK_ERROR', {
        message: 'Network connection failed',
        url: error.config?.url
      });
    }

    return Promise.reject(error);
  }
};
```

## 🏪 State Management (`/src/core/stores`)

### Overview

The state management system provides **standardized Zustand patterns** and base store utilities for consistent state handling across the application.

### File Structure
```
src/core/stores/
├── base/                       # Base store patterns and utilities
│   ├── createBaseStore.ts      # Store factory function
│   ├── requestLifecycle.ts     # Async request state patterns
│   ├── pagination.ts           # Pagination state patterns
│   ├── caching.ts              # Caching utilities
│   └── types.ts                # Base store types
├── app/                        # Application-level stores
│   ├── appStore.ts             # Global application state
│   ├── uiStore.ts              # UI state (modals, drawers, etc.)
│   ├── navigationStore.ts      # Navigation state
│   └── themeStore.ts           # Theme and preferences
└── __tests__/                  # Store tests
    ├── createBaseStore.test.ts
    └── requestLifecycle.test.ts
```

### Base Store Patterns

#### Request Lifecycle Pattern
```typescript
// src/core/stores/base/requestLifecycle.ts
export interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  retryCount: number;
}

export interface RequestActions<T> {
  setLoading: (loading: boolean) => void;
  setData: (data: T) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  reset: () => void;
}

export const createRequestLifecycleMethods = <T>(
  apiCall: () => Promise<T>
) => ({
  async fetchData(set: any, get: any): Promise<void> {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await apiCall();
      set({
        data,
        loading: false,
        lastFetch: new Date(),
        retryCount: 0
      });
    } catch (error) {
      set({
        error: error.message,
        loading: false,
        retryCount: state.retryCount + 1
      });
    }
  },

  async retry(set: any, get: any): Promise<void> {
    const state = get();
    if (state.retryCount < 3) {
      await this.fetchData(set, get);
    } else {
      set({ error: 'Maximum retry attempts reached' });
    }
  },

  reset(set: any): void {
    set({
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
      retryCount: 0
    });
  }
});
```

#### Pagination Pattern
```typescript
// src/core/stores/base/pagination.ts
export interface PaginationState<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

export interface PaginationActions<T> {
  loadPage: (page: number) => Promise<void>;
  loadMore: () => Promise<void>;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export const createPaginationMethods = <T>(
  apiCall: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>
) => ({
  async loadPage(page: number, set: any, get: any): Promise<void> {
    const state = get();
    set({ loading: true, error: null });

    try {
      const response = await apiCall(page, state.pageSize);
      set({
        items: page === 1 ? response.items : [...state.items, ...response.items],
        totalCount: response.total,
        page,
        hasMore: response.items.length === state.pageSize,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  async loadMore(set: any, get: any): Promise<void> {
    const state = get();
    if (state.hasMore && !state.loading) {
      await this.loadPage(state.page + 1, set, get);
    }
  },

  setPageSize(size: number, set: any, get: any): void {
    set({ pageSize: size });
    this.loadPage(1, set, get);
  },

  reset(set: any): void {
    set({
      items: [],
      totalCount: 0,
      page: 1,
      hasMore: false,
      loading: false,
      error: null
    });
  }
});
```

### Application Stores

#### UI Store - Global UI State
```typescript
// src/core/stores/app/uiStore.ts
interface UIState {
  // Modal state
  modals: Record<string, boolean>;
  modalData: Record<string, any>;

  // Drawer state
  drawers: Record<string, boolean>;
  drawerData: Record<string, any>;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Notification state
  notifications: Notification[];

  // Layout state
  sidebarCollapsed: boolean;
  fullscreen: boolean;

  // Actions
  openModal: (modalId: string, data?: any) => void;
  closeModal: (modalId: string) => void;
  openDrawer: (drawerId: string, data?: any) => void;
  closeDrawer: (drawerId: string) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  toggleFullscreen: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  modals: {},
  modalData: {},
  drawers: {},
  drawerData: {},
  globalLoading: false,
  loadingMessage: null,
  notifications: [],
  sidebarCollapsed: false,
  fullscreen: false,

  // Modal actions
  openModal: (modalId: string, data?: any) => {
    set(state => ({
      modals: { ...state.modals, [modalId]: true },
      modalData: { ...state.modalData, [modalId]: data }
    }));
  },

  closeModal: (modalId: string) => {
    set(state => ({
      modals: { ...state.modals, [modalId]: false },
      modalData: { ...state.modalData, [modalId]: undefined }
    }));
  },

  // Drawer actions
  openDrawer: (drawerId: string, data?: any) => {
    set(state => ({
      drawers: { ...state.drawers, [drawerId]: true },
      drawerData: { ...state.drawerData, [drawerId]: data }
    }));
  },

  closeDrawer: (drawerId: string) => {
    set(state => ({
      drawers: { ...state.drawers, [drawerId]: false },
      drawerData: { ...state.drawerData, [drawerId]: undefined }
    }));
  },

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => {
    set({ globalLoading: loading, loadingMessage: message || null });
  },

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    set(state => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // Layout actions
  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  toggleFullscreen: () => {
    set(state => ({ fullscreen: !state.fullscreen }));
  }
}));
```

## 🎛️ Event Bus System (`/src/core/events`)

### Overview

The Event Bus provides **type-safe, high-performance event communication** between plugins and core framework components.

### File Structure
```
src/core/events/
├── EventBus.ts                 # Core event bus implementation
├── EventLogger.ts              # Event logging and debugging
├── types/                      # Event type definitions
│   ├── eventTypes.ts           # Core event type definitions
│   ├── coreEvents.ts           # Core framework events
│   └── pluginEvents.ts         # Plugin-specific events
└── __tests__/                  # Event bus tests
    ├── EventBus.test.ts
    └── EventLogger.test.ts
```

### EventBus - Core Implementation

```typescript
// src/core/events/EventBus.ts
export class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: EventRecord[] = [];
  private maxHistorySize = 1000;
  private isDebugging = process.env.NODE_ENV === 'development';

  /**
   * Emit an event to all subscribers
   */
  emit<T extends keyof EventMap>(eventName: T, data: EventMap[T]): void {
    const listeners = this.listeners.get(eventName as string);

    if (listeners && listeners.size > 0) {
      const eventRecord: EventRecord = {
        name: eventName as string,
        data,
        timestamp: new Date(),
        id: this.generateEventId()
      };

      // Log event if debugging
      if (this.isDebugging) {
        console.log(`🎛️ Event: ${eventName}`, data);
      }

      // Add to history
      this.addToHistory(eventRecord);

      // Call all listeners
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe<T extends keyof EventMap>(
    eventName: T,
    listener: (data: EventMap[T]) => void
  ): () => void {
    const eventKey = eventName as string;

    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }

    const listeners = this.listeners.get(eventKey)!;
    listeners.add(listener as EventListener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener as EventListener);
      if (listeners.size === 0) {
        this.listeners.delete(eventKey);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once<T extends keyof EventMap>(
    eventName: T,
    listener: (data: EventMap[T]) => void
  ): () => void {
    const unsubscribe = this.subscribe(eventName, (data) => {
      unsubscribe();
      listener(data);
    });

    return unsubscribe;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(eventName: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Get all active listeners
   */
  getListeners(): Map<string, number> {
    const result = new Map<string, number>();
    this.listeners.forEach((listeners, eventName) => {
      result.set(eventName, listeners.size);
    });
    return result;
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): EventRecord[] {
    return this.eventHistory.slice(0, limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Enable/disable debugging
   */
  setDebugging(enabled: boolean): void {
    this.isDebugging = enabled;
  }

  /**
   * Wait for a specific event
   */
  waitFor<T extends keyof EventMap>(
    eventName: T,
    timeout: number = 5000
  ): Promise<EventMap[T]> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      const unsubscribe = this.once(eventName, (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      });
    });
  }

  private addToHistory(record: EventRecord): void {
    this.eventHistory.unshift(record);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }

  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Global event bus instance
export const eventBus = new EventBus();
```

## 🔌 Plugin Management (`/src/core/plugins`)

### Overview

The Plugin Management system handles the **complete lifecycle** of plugins including installation, activation, deactivation, and dependency management.

### PluginManager - Core Plugin Management

```typescript
// src/core/plugins/PluginManager.ts
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private pluginContext: PluginContext;

  constructor() {
    this.pluginContext = this.createPluginContext();
  }

  /**
   * Install and activate a plugin
   */
  async installPlugin(plugin: Plugin): Promise<void> {
    // Check if plugin already exists
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already installed`);
    }

    // Validate plugin
    this.validatePlugin(plugin);

    // Check dependencies
    await this.checkDependencies(plugin);

    try {
      // Install plugin
      await plugin.install?.(this.pluginContext);
      this.plugins.set(plugin.name, plugin);

      // Activate plugin
      await this.activatePlugin(plugin.name);

      console.log(`✅ Plugin ${plugin.name} installed and activated`);
    } catch (error) {
      console.error(`❌ Failed to install plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    if (this.activePlugins.has(pluginName)) {
      console.warn(`Plugin ${pluginName} is already active`);
      return;
    }

    try {
      await plugin.activate?.(this.pluginContext);
      this.activePlugins.add(pluginName);

      eventBus.emit('PLUGIN_ACTIVATED', {
        pluginName,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    if (!this.activePlugins.has(pluginName)) {
      console.warn(`Plugin ${pluginName} is not active`);
      return;
    }

    try {
      await plugin.deactivate?.(this.pluginContext);
      this.activePlugins.delete(pluginName);

      eventBus.emit('PLUGIN_DEACTIVATED', {
        pluginName,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Deactivate first if active
    if (this.activePlugins.has(pluginName)) {
      await this.deactivatePlugin(pluginName);
    }

    try {
      await plugin.uninstall?.(this.pluginContext);
      this.plugins.delete(pluginName);

      eventBus.emit('PLUGIN_UNINSTALLED', {
        pluginName,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginName: string): PluginStatus {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return 'not_installed';
    }

    return this.activePlugins.has(pluginName) ? 'active' : 'inactive';
  }

  /**
   * List all plugins
   */
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      status: this.getPluginStatus(plugin.name),
      dependencies: plugin.dependencies || []
    }));
  }

  /**
   * Create plugin context
   */
  private createPluginContext(): PluginContext {
    return {
      auth: authService,
      api: apiHelper,
      eventBus,
      stores: {
        auth: useAuthStore,
        ui: useUIStore
      },
      registerRoute: this.registerRoute.bind(this),
      registerNavItem: this.registerNavItem.bind(this),
      getConfig: this.getConfig.bind(this),
      setConfig: this.setConfig.bind(this)
    };
  }

  // ... additional private methods
}
```

## 🔧 Utilities Library (`/src/core/utils`)

### Overview

The utilities library provides **common helper functions** for storage, validation, formatting, and other shared functionality.

### File Structure
```
src/core/utils/
├── storage/                    # Storage utilities
│   ├── localStorage.ts         # LocalStorage helpers
│   ├── sessionStorage.ts       # SessionStorage helpers
│   └── indexedDB.ts           # IndexedDB utilities
├── validation/                 # Validation helpers
│   ├── validators.ts           # Common validators
│   ├── schemas.ts              # Validation schemas
│   └── customValidators.ts     # Custom validation rules
├── formatting/                 # Data formatting utilities
│   ├── dateFormatter.ts        # Date formatting
│   ├── numberFormatter.ts      # Number formatting
│   ├── textFormatter.ts        # Text utilities
│   └── currencyFormatter.ts    # Currency formatting
├── constants/                  # Application constants
│   ├── routes.ts               # Route constants
│   ├── config.ts               # Configuration constants
│   └── defaults.ts             # Default values
└── __tests__/                  # Utility tests
```

### Example Utilities

#### Local Storage Helper
```typescript
// src/core/utils/storage/localStorage.ts
export class LocalStorageHelper {
  /**
   * Get item from localStorage with type safety
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item in localStorage
   */
  static set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item in localStorage:`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
```

## 🌍 Type System (`/src/core/types`)

### Overview

The type system provides **comprehensive TypeScript definitions** for the entire framework, ensuring type safety across all components.

### Core Type Definitions

```typescript
// src/core/types/global.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];

  install?(context: PluginContext): Promise<void>;
  activate?(context: PluginContext): Promise<void>;
  deactivate?(context: PluginContext): Promise<void>;
  uninstall?(context: PluginContext): Promise<void>;
}

export interface PluginContext {
  auth: AuthService;
  api: ApiHelper;
  eventBus: EventBus;
  stores: CoreStores;
  registerRoute: (path: string, component: React.ComponentType) => void;
  registerNavItem: (item: NavItem) => void;
  getConfig: (key: string) => any;
  setConfig: (key: string, value: any) => void;
}

export interface EventMap {
  // Auth events
  USER_LOGIN: UserLoginEvent;
  USER_LOGOUT: UserLogoutEvent;
  TOKEN_REFRESHED: TokenRefreshEvent;
  AUTH_TOKEN_EXPIRED: AuthTokenExpiredEvent;

  // Plugin events
  PLUGIN_ACTIVATED: PluginActivatedEvent;
  PLUGIN_DEACTIVATED: PluginDeactivatedEvent;
  PLUGIN_UNINSTALLED: PluginUninstalledEvent;

  // UI events
  MODAL_OPENED: ModalEvent;
  MODAL_CLOSED: ModalEvent;
  NAVIGATION_CHANGED: NavigationEvent;

  // System events
  ERROR_OCCURRED: ErrorEvent;
  NETWORK_ERROR: NetworkErrorEvent;
}
```

## 🔗 Integration Example

Here's how all core framework components work together:

```typescript
// Example: User login flow showing core integration
export class LoginComponent extends React.Component {
  async handleLogin(credentials: LoginCredentials) {
    try {
      // 1. Use Auth Service
      const result = await authService.login(credentials);

      // 2. Auth Service updates Auth Store
      // 3. Auth Service emits USER_LOGIN event via Event Bus
      // 4. Other plugins listen to USER_LOGIN event
      // 5. API Helper automatically adds auth headers for future requests
      // 6. UI Store shows success notification

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      // Error handling via UI Store
      useUIStore.getState().addNotification({
        type: 'error',
        message: error.message
      });
    }
  }
}
```

---

The Core Framework provides a **robust, scalable foundation** that enables rapid development of complex SaaS applications. Each component is designed to work seamlessly with others while maintaining clear separation of concerns and testability.

## 📚 Next Steps

Now that you understand the Core Framework:

1. **[Plugin System](./plugin-system.md)** - Learn how plugins leverage these core services
2. **[Event Bus](./event-bus.md)** - Master event-driven communication patterns
3. **[State Management](./state-management.md)** - Advanced store patterns and best practices
4. **[Plugin Development](./plugin-development.md)** - Build your own plugins using the core framework

**Happy coding!** 🚀