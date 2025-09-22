/**
 * @fileoverview Core Context Provider for Multi-tenant Application
 *
 * Manages the application's core state including:
 * - Current tenant and workspace context
 * - User authentication state
 * - Multi-tenant routing and permissions
 * - Context switching functionality
 */

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import type { TenantContext, WorkspaceContext } from '../plugin-system/EventBus';
import { useAuthStore } from '../auth/AuthStore';
import type { User } from '../types';

// Core application state
export interface CoreState {
  // Current context
  currentTenant: TenantContext | null;
  currentWorkspace: WorkspaceContext | null;
  currentUser: User | null;

  // Available contexts for current user
  availableTenants: TenantContext[];
  availableWorkspaces: WorkspaceContext[];

  // Loading states
  isLoading: boolean;
  isContextSwitching: boolean;

  // Error state
  error: string | null;
}

// Actions for context management
export type CoreAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONTEXT_SWITCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_CURRENT_TENANT'; payload: TenantContext | null }
  | { type: 'SET_CURRENT_WORKSPACE'; payload: WorkspaceContext | null }
  | { type: 'SET_AVAILABLE_TENANTS'; payload: TenantContext[] }
  | { type: 'SET_AVAILABLE_WORKSPACES'; payload: WorkspaceContext[] }
  | { type: 'RESET_CONTEXT' };

// Initial state
const initialState: CoreState = {
  currentTenant: null,
  currentWorkspace: null,
  currentUser: null,
  availableTenants: [],
  availableWorkspaces: [],
  isLoading: false,
  isContextSwitching: false,
  error: null,
};

// Context reducer
function coreReducer(state: CoreState, action: CoreAction): CoreState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CONTEXT_SWITCHING':
      return { ...state, isContextSwitching: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isContextSwitching: false };

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_CURRENT_TENANT':
      return { ...state, currentTenant: action.payload };

    case 'SET_CURRENT_WORKSPACE':
      return { ...state, currentWorkspace: action.payload };

    case 'SET_AVAILABLE_TENANTS':
      return { ...state, availableTenants: action.payload };

    case 'SET_AVAILABLE_WORKSPACES':
      return { ...state, availableWorkspaces: action.payload };

    case 'RESET_CONTEXT':
      return {
        ...initialState,
        currentUser: state.currentUser, // Keep user when resetting context
      };

    default:
      return state;
  }
}

// Context interface
export interface CoreContextType {
  state: CoreState;

  // State setters for plugins to update context
  setCurrentTenant: (tenant: TenantContext | null) => void;
  setCurrentWorkspace: (workspace: WorkspaceContext | null) => void;

  // Data loading methods
  loadUserContext: () => Promise<void>;

  // Utility methods
  clearError: () => void;
  refreshContext: () => Promise<void>;
}

// Create context
const CoreContext = createContext<CoreContextType | null>(null);

// Custom hook to use core context
export function useCoreContext(): CoreContextType {
  const context = useContext(CoreContext);
  if (!context) {
    throw new Error('useCoreContext must be used within a CoreProvider');
  }
  return context;
}

// Provider props
interface CoreProviderProps {
  children: ReactNode;
}

// Core provider component
export function CoreProvider({ children }: CoreProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(coreReducer, initialState);
  const { user, isAuthenticated, initializeAuth } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync user from auth store
  useEffect(() => {
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  }, [user]);

  // Load user context when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserContext();
    } else {
      dispatch({ type: 'RESET_CONTEXT' });
    }
  }, [isAuthenticated, user]);

  // Context switching methods
  // Simple state setter for plugins to update tenant context
  const setCurrentTenant = (tenant: TenantContext | null): void => {
    dispatch({ type: 'SET_CURRENT_TENANT', payload: tenant });
  };

  // Simple state setter for plugins to update workspace context
  const setCurrentWorkspace = (workspace: WorkspaceContext | null): void => {
    dispatch({ type: 'SET_CURRENT_WORKSPACE', payload: workspace });
  };

  // Data loading methods
  const loadUserContext = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load user context' });
    }
  };

  // Utility methods
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const refreshContext = async (): Promise<void> => {
    if (state.currentUser) {
      await loadUserContext();
    }
  };

  // Context value
  const contextValue: CoreContextType = {
    state,
    setCurrentTenant,
    setCurrentWorkspace,
    loadUserContext,
    clearError,
    refreshContext,
  };

  return (
    <CoreContext.Provider value={contextValue}>
      {children}
    </CoreContext.Provider>
  );
}

export default CoreProvider;