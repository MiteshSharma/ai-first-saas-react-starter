/**
 * @fileoverview Auth Context Adapter (Plan 3)
 *
 * Bridges the existing auth store with the plugin system
 * Provides AuthContext interface that plugins can use
 */

import { useAuthStore } from './AuthStore';
import { AuthContext, User } from '../plugin-system/types';
import { eventBus } from '../plugin-system';
import { CORE_EVENTS } from '../../events';

/**
 * Create AuthContext from the existing auth store
 * This allows plugins to access auth functionality
 */
export function createAuthContext(): AuthContext {
  const authStore = useAuthStore.getState();

  return {
    getCurrentUser: (): User | null => {
      const state = useAuthStore.getState();
      return state.user;
    },

    isAuthenticated: (): boolean => {
      const state = useAuthStore.getState();
      return state.isAuthenticated;
    },

    getToken: (): string | null => {
      const state = useAuthStore.getState();
      return state.token;
    },

    login: async (email: string, password: string): Promise<void> => {
      try {
        await authStore.login({ email, password });
        const user = useAuthStore.getState().user;

        // Emit event for plugins
        eventBus.emit(CORE_EVENTS.USER_LOGGED_IN, { user });
      } catch (error) {
        throw error;
      }
    },

    logout: async (): Promise<void> => {
      await authStore.logout();

      // Emit event for plugins
      eventBus.emit(CORE_EVENTS.USER_LOGGED_OUT, {});
    }
  };
}

/**
 * Hook to use auth context in React components
 */
export function useAuthContext(): AuthContext {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);

  return {
    getCurrentUser: () => user,
    isAuthenticated: () => isAuthenticated,
    getToken: () => token,
    login: async (email: string, password: string) => {
      await login({ email, password });
      eventBus.emit(CORE_EVENTS.USER_LOGGED_IN, { user });
    },
    logout: async () => {
      await logout();
      eventBus.emit(CORE_EVENTS.USER_LOGGED_OUT, {});
    }
  };
}

// Subscribe to auth store changes and emit events
useAuthStore.subscribe((state) => {
  if (state.user) {
    eventBus.emit(CORE_EVENTS.USER_UPDATED, { user: state.user });
  }
});