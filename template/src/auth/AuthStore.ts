import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@services/apiClient';
import type { AuthState, User, LoginCredentials, RegisterData, AuthResponse } from './types';

interface AuthStore extends AuthState {
  // Computed values
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

/**
 * @store useAuthStore
 * @description Zustand store for authentication state management
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Computed values
      get isAuthenticated() {
        const state = get();
        return !!state.token && !!state.user;
      },

      // Actions
      login: async (credentials: LoginCredentials): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
          const { user, token } = response.data;
          
          set({ user, token, isLoading: false });
          apiClient.setAuthToken(token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<AuthResponse>('/auth/register', data);
          const { user, token } = response.data;
          
          set({ user, token, isLoading: false });
          apiClient.setAuthToken(token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async (): Promise<void> => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          // Ignore logout errors, proceed with local cleanup
        } finally {
          set({ user: null, token: null, error: null });
          apiClient.clearAuthToken();
        }
      },

      refreshToken: async (): Promise<void> => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await apiClient.post<AuthResponse>('/auth/refresh');
          const { user: newUser, token: newToken } = response.data;
          
          set({ user: newUser, token: newToken });
          apiClient.setAuthToken(newToken);
        } catch (error) {
          set({ user: null, token: null, error: null });
          apiClient.clearAuthToken();
          throw error;
        }
      },

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
          apiClient.setAuthToken(state.token);
        }
      },
    }
  )
);