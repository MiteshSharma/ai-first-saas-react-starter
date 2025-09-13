import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  postUserLogin,
  postUserRegister,
  postUserSignupWithEmail,
  postUserSignupComplete,
  deleteUserSignOut,
  putRefreshAccessToken,
  postResetPasswordGetLink,
  putResetPasswordWithToken
} from '../helpers/backendHelper';
import { setItem, removeItem } from '../utils/localStorage';
import { 
  createRequestLifecycleMethods,
  createInitialRequestState,
  createErrorFromResponse 
} from '../store/base';
import type { 
  AuthState, 
  AuthActions,
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  SignupWithEmailData,
  SignupCompleteData,
  PasswordResetRequestData,
  PasswordResetCompleteData 
} from './types';
import { AuthRequestType } from './types';

interface AuthStore extends AuthState, AuthActions {}

/**
 * @store useAuthStore
 * @description Zustand store for authentication state management
 */
// Create the store
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Core auth state
      user: null,
      token: null,

      // Request lifecycle state (from base utilities)
      ...createInitialRequestState(),

      // Computed values
      get isAuthenticated() {
        const state = get();
        return !!state.token && !!state.user;
      },

      // Standardized request lifecycle methods
      ...createRequestLifecycleMethods(set),

      // Auth actions
      login: async (credentials: LoginCredentials): Promise<void> => {
        const { setLoading, setError } = get();
        setLoading(true, AuthRequestType.LOGIN);

        try {
          const response = await postUserLogin(credentials);
          const { user, authToken: token } = response.data.data;
          
          set({ user, token, loading: false, currentRequest: null, error: null });
          
          // Store auth data for the new API helper
          const authData = { userId: user.id, authToken: token, refreshToken: token };
          setItem('authToken', authData);
        } catch (error: any) {
          const appError = createErrorFromResponse(error, 'Login failed');
          setError(appError);
          throw error;
        }
      },

      register: async (data: RegisterData): Promise<void> => {
        const { setLoading, setError } = get();
        setLoading(true, AuthRequestType.REGISTER);

        try {
          const response = await postUserRegister(data);
          const { user, authToken: token } = response.data.data;
          
          set({ user, token, loading: false, currentRequest: null, error: null });
          
          // Store auth data for the new API helper
          const authData = { userId: user.id, authToken: token, refreshToken: token };
          setItem('authToken', authData);
        } catch (error: any) {
          const appError = createErrorFromResponse(error, 'Registration failed');
          setError(appError);
          throw error;
        }
      },

      logout: async (): Promise<void> => {
        const { setLoading } = get();
        setLoading(true, AuthRequestType.LOGOUT);

        try {
          await deleteUserSignOut();
        } catch (error) {
          // Ignore logout errors, proceed with local cleanup
        } finally {
          set({ 
            user: null, 
            token: null, 
            loading: false, 
            currentRequest: null, 
            error: null 
          });
          removeItem('authToken');
          removeItem('currentTenantId');
        }
      },

      refreshToken: async (): Promise<void> => {
        const { token, setLoading, setError } = get();
        if (!token) return;

        setLoading(true, AuthRequestType.REFRESH_TOKEN);

        try {
          const response = await putRefreshAccessToken({ refreshToken: token });
          const { user: newUser, authToken: newToken } = response.data.data;
          
          set({ 
            user: newUser, 
            token: newToken, 
            loading: false, 
            currentRequest: null, 
            error: null 
          });
          
          // Update stored auth data
          const authData = { userId: newUser.id, authToken: newToken, refreshToken: newToken };
          setItem('authToken', authData);
        } catch (error: any) {
          set({ 
            user: null, 
            token: null, 
            loading: false, 
            currentRequest: null, 
            error: null 
          });
          removeItem('authToken');
          removeItem('currentTenantId');
          throw error;
        }
      },

      signupWithEmail: async (data: SignupWithEmailData): Promise<void> => {
        const { setLoading, setError } = get();
        setLoading(true, AuthRequestType.SIGNUP_WITH_EMAIL);

        try {
          await postUserSignupWithEmail(data);
          set({ loading: false, currentRequest: null, error: null });
          // Success - user should check email for completion link
        } catch (error: any) {
          const appError = createErrorFromResponse(error, 'Signup request failed');
          setError(appError);
          throw error;
        }
      },

      completeSignup: async (data: SignupCompleteData): Promise<void> => {
        const { setLoading, setError } = get();
        setLoading(true, AuthRequestType.COMPLETE_SIGNUP);

        try {
          const response = await postUserSignupComplete(data);
          const { user, authToken: token } = response.data.data;
          
          set({ user, token, loading: false, currentRequest: null, error: null });
          
          // Store auth data for the new API helper
          const authData = { userId: user.id, authToken: token, refreshToken: token };
          setItem('authToken', authData);
        } catch (error: any) {
          const appError = createErrorFromResponse(error, 'Signup completion failed');
          setError(appError);
          throw error;
        }
      },

      requestPasswordReset: async (data: PasswordResetRequestData): Promise<void> => {
        const { setLoading, setError } = get();
        setLoading(true, AuthRequestType.REQUEST_PASSWORD_RESET);

        try {
          await postResetPasswordGetLink(data);
          set({ loading: false, currentRequest: null, error: null });
          // Success - user should check email for reset link
        } catch (error: any) {
          const appError = createErrorFromResponse(error, 'Password reset request failed');
          setError(appError);
          throw error;
        }
      },

      completePasswordReset: async (data: PasswordResetCompleteData): Promise<void> => {
        const { setLoading, setError } = get();
        setLoading(true, AuthRequestType.COMPLETE_PASSWORD_RESET);

        try {
          await putResetPasswordWithToken(data);
          set({ loading: false, currentRequest: null, error: null });
          // Success - password has been reset, user can now login
        } catch (error: any) {
          const appError = createErrorFromResponse(error, 'Password reset failed');
          setError(appError);
          throw error;
        }
      },

      // Additional clearError method for backward compatibility
      clearError: (): void => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          // Store auth data in the format expected by the new API helper
          const authData = { 
            userId: state.user?.id || '', 
            authToken: state.token, 
            refreshToken: state.token 
          };
          setItem('authToken', authData);
        }
      },
    }
  )
);

// Set up token lifecycle management
if (typeof window !== 'undefined') {
  // Listen for auth logout events from API helper
  window.addEventListener('auth:logout', () => {
    const { logout } = useAuthStore.getState();
    logout();
  });
  
  // Optional: Set up periodic token refresh
  const setupTokenRefresh = () => {
    const refreshInterval = 15 * 60 * 1000; // 15 minutes
    
    setInterval(() => {
      const { isAuthenticated, token, refreshToken } = useAuthStore.getState();
      
      if (isAuthenticated && token) {
        // Check if token is close to expiry (optional - requires JWT parsing)
        // For now, we rely on the 401 interceptor for refresh
        
        // You could add JWT token expiry checking here
        // const tokenPayload = parseJwtPayload(token);
        // const expiryTime = tokenPayload.exp * 1000;
        // const timeUntilExpiry = expiryTime - Date.now();
        // if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes before expiry
        //   refreshToken();
        // }
      }
    }, refreshInterval);
  };
  
  // Start token refresh monitoring
  setupTokenRefresh();
}