/**
 * @fileoverview Authentication types and interfaces
 */

import type { AppError, RequestLifecycle } from '../stores/base/types';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
}

// Auth-specific state
export interface AuthCoreState {
  user: User | null;
  token: string | null;
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
}

// Auth actions interface with standardized lifecycle methods
export interface AuthActions {
  // Standard request lifecycle
  resetRequestState: () => void;
  setLoading: (loading: boolean, requestType?: AuthRequestType) => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signupWithEmail: (data: SignupWithEmailData) => Promise<void>;
  completeSignup: (data: SignupCompleteData) => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequestData) => Promise<void>;
  completePasswordReset: (data: PasswordResetCompleteData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
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
  name: string;
  password: string;
  tenantName?: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetCompleteData {
  token: string;
  password: string;
}