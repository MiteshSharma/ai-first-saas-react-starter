/**
 * @fileoverview Base types and interfaces for standardized store patterns
 */

// Standard error format for all stores
export interface AppError {
  message: string;
  code?: string;
}

// Base state interface that all stores should extend
export interface BaseState {
  loading: boolean;
  error: AppError | null;
  currentRequest: string | null;
}

// Base actions interface that all stores should implement
export interface BaseActions {
  // Standard request lifecycle methods
  resetRequestState: () => void;
  setLoading: (loading: boolean, requestType?: string) => void;
  setError: (error: AppError | null) => void;
}

// Base store interface combining state and actions
export interface BaseStore extends BaseState, BaseActions {}

// Helper type for request type enums
export type RequestTypeEnum = Record<string, string>;

// Standard request lifecycle state
export interface RequestLifecycle {
  loading: boolean;
  error: AppError | null;
  currentRequest: string | null;
}

// Utility type for store state with request lifecycle
export type StoreStateWithRequest<T> = T & RequestLifecycle;

// Utility type for store actions with request lifecycle
export type StoreActionsWithRequest<T> = T & BaseActions;