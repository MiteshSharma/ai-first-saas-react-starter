/**
 * @fileoverview Base store utilities for standardized request lifecycle management
 */

import type { AppError, RequestLifecycle } from './types';

/**
 * Create standardized request lifecycle methods
 * @returns Object with resetRequestState, setLoading, and setError methods
 */
export const createRequestLifecycleMethods = (
  set: (state: Partial<RequestLifecycle>) => void
) => ({
  /**
   * Reset all request state to initial values
   */
  resetRequestState: (): void => {
    set({ loading: false, error: null, currentRequest: null });
  },

  /**
   * Set loading state with optional request type
   */
  setLoading: (loading: boolean, requestType?: string): void => {
    set({ loading, currentRequest: requestType || null, error: null });
  },

  /**
   * Set error state and clear loading
   */
  setError: (error: AppError | null): void => {
    set({ error, loading: false, currentRequest: null });
  },
});

/**
 * Create initial request lifecycle state
 */
export const createInitialRequestState = (): RequestLifecycle => ({
  loading: false,
  error: null,
  currentRequest: null,
});

/**
 * Helper to create standardized error from API response
 */
export const createErrorFromResponse = (
  error: any,
  defaultMessage: string
): AppError => ({
  message: error.response?.data?.message || defaultMessage,
  code: error.response?.data?.code,
});

/**
 * Helper to create standardized async action wrapper
 * Handles loading states, error catching, and state updates
 */
export const createAsyncAction = <T extends any[], R>(
  setLoading: (loading: boolean, requestType?: string) => void,
  setError: (error: AppError | null) => void,
  action: (...args: T) => Promise<R>,
  requestType?: string,
  errorMessage: string = 'Operation failed'
) => {
  return async (...args: T): Promise<R> => {
    try {
      setLoading(true, requestType);
      const result = await action(...args);
      setLoading(false);
      return result;
    } catch (error: any) {
      const appError = createErrorFromResponse(error, errorMessage);
      setError(appError);
      throw error;
    }
  };
};

/**
 * Create a standardized request type enum validator
 */
export const createRequestTypeValidator = (validTypes: Record<string, string>) => {
  return (requestType: string): boolean => {
    return Object.values(validTypes).includes(requestType);
  };
};