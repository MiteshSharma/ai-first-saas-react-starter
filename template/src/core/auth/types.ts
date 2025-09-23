/**
 * @fileoverview Authentication types and interfaces
 */

import type { AppError, RequestLifecycle } from '../stores/base/types';
import type { User } from '../types';

// Re-export User type from core types
export type { User } from '../types';

// Admin session metadata
export interface AdminMetadata {
  token: string;
  forcedTenantId?: string;
  loginTime: string;
  accessLevel: 'read-only';
}

// Auth-specific state
export interface AuthCoreState {
  user: User | null;
  token: string | null;
  isAdminSession: boolean;
  adminMetadata: AdminMetadata | null;
}

// Auth state with standardized request lifecycle
export interface AuthState extends AuthCoreState, RequestLifecycle {
  // Computed properties
  readonly isAuthenticated: boolean;
}

// Auth request types
export enum AuthRequestType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  SIGNUP_WITH_EMAIL = 'SIGNUP_WITH_EMAIL',
  COMPLETE_SIGNUP = 'COMPLETE_SIGNUP',
  REQUEST_PASSWORD_RESET = 'REQUEST_PASSWORD_RESET',
  COMPLETE_PASSWORD_RESET = 'COMPLETE_PASSWORD_RESET',
  LOGOUT = 'LOGOUT',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
}

// Auth actions interface with standardized lifecycle methods
export interface AuthActions {
  // Standard request lifecycle
  resetRequestState: () => void;
  setLoading: (loading: boolean, requestType?: AuthRequestType) => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;

  // Auth actions
  initializeAuth: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signupWithEmail: (data: SignupWithEmailData) => Promise<void>;
  completeSignup: (data: SignupCompleteData) => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequestData) => Promise<void>;
  completePasswordReset: (data: PasswordResetCompleteData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // Admin auth actions
  loginWithAdminToken: (token: string, tenantId?: string) => Promise<void>;
  clearAdminSession: () => void;
  isAdminUser: () => boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignupWithEmailData {
  email: string;
}

export interface SignupCompleteData {
  token: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  password: string;
  organizationName?: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetCompleteData {
  token: string;
  password: string;
}