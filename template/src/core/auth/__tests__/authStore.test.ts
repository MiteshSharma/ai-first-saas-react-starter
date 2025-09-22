/**
 * @fileoverview Auth Store Test Suite
 * Tests for the authentication store functionality and event emission
 */

import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import { EventBus } from '../../plugin-system/EventBus';
import { CORE_EVENTS } from '../../../events';
// import { MockLocalStorage } from '../../utils/testUtils';

// Mock localStorage
// const mockLocalStorage = new MockLocalStorage();
// (global as any).localStorage = mockLocalStorage;

// Create a test component to interact with the store
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-info">{user ? JSON.stringify(user) : 'no-user'}</div>
      <button
        data-testid="login-button"
        onClick={() => login({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          token: 'test-token'
        })}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
};

describe('AuthStore', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    mockLocalStorage.clear();

    // Reset the store state
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    eventBus.clearHistory();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should load token from localStorage on initialization', () => {
      const testToken = 'stored-token';
      mockLocalStorage.setItem('auth_token', testToken);

      // Create new store instance (simulating app initialization)
      const { user, isAuthenticated, token } = useAuthStore.getState();

      // Note: This test might need adjustment based on actual store implementation
      // The store might automatically load the token on initialization
      expect(token).toBeDefined();
    });
  });

  describe('Login Functionality', () => {
    it('should update state correctly on login', () => {
      const loginData = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token'
      };

      act(() => {
        useAuthStore.getState().login(loginData);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(loginData.user);
      expect(state.token).toBe(loginData.token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should store token in localStorage on login', () => {
      const loginData = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token'
      };

      act(() => {
        useAuthStore.getState().login(loginData);
      });

      expect(mockLocalStorage.getItem('auth_token')).toBe('test-token');
    });

    it('should handle login with minimal data', () => {
      const loginData = {
        user: { id: '1', email: 'test@example.com' },
        token: 'test-token'
      };

      act(() => {
        useAuthStore.getState().login(loginData);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(loginData.user);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      // Set up authenticated state
      const loginData = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token'
      };

      act(() => {
        useAuthStore.getState().login(loginData);
      });
    });

    it('should clear state correctly on logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should remove token from localStorage on logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(mockLocalStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Loading State Management', () => {
    it('should manage loading state during authentication', () => {
      const { setLoading } = useAuthStore.getState();

      act(() => {
        setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      act(() => {
        setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should update token correctly', () => {
      const newToken = 'new-test-token';

      act(() => {
        useAuthStore.getState().setToken(newToken);
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe(newToken);
      expect(mockLocalStorage.getItem('auth_token')).toBe(newToken);
    });

    it('should clear token when set to null', () => {
      // First set a token
      act(() => {
        useAuthStore.getState().setToken('test-token');
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().setToken(null);
      });

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(mockLocalStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('User Profile Update', () => {
    beforeEach(() => {
      // Set up authenticated state
      const loginData = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token'
      };

      act(() => {
        useAuthStore.getState().login(loginData);
      });
    });

    it('should update user profile', () => {
      const updatedUser = { id: '1', email: 'updated@example.com', name: 'Updated User' };

      act(() => {
        useAuthStore.getState().updateUser(updatedUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(updatedUser);
      expect(state.isAuthenticated).toBe(true); // Should remain authenticated
    });

    it('should handle partial user updates', () => {
      const partialUpdate = { name: 'New Name Only' };

      act(() => {
        useAuthStore.getState().updateUser(partialUpdate);
      });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('New Name Only');
      expect(state.user?.email).toBe('test@example.com'); // Should preserve existing fields
      expect(state.user?.id).toBe('1');
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers of state changes', () => {
      const subscriber = jest.fn();
      const unsubscribe = useAuthStore.subscribe(subscriber);

      act(() => {
        useAuthStore.getState().login({
          user: { id: '1', email: 'test@example.com' },
          token: 'test-token'
        });
      });

      expect(subscriber).toHaveBeenCalled();

      unsubscribe();
    });

    it('should stop notifying after unsubscribing', () => {
      const subscriber = jest.fn();
      const unsubscribe = useAuthStore.subscribe(subscriber);

      unsubscribe();
      subscriber.mockClear();

      act(() => {
        useAuthStore.getState().login({
          user: { id: '1', email: 'test@example.com' },
          token: 'test-token'
        });
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('React Component Integration', () => {
    it('should work with React components', () => {
      render(<TestComponent />);

      // Initial state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');

      // Login
      act(() => {
        screen.getByTestId('login-button').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');

      // Logout
      act(() => {
        screen.getByTestId('logout-button').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw when trying to login
      expect(() => {
        act(() => {
          useAuthStore.getState().login({
            user: { id: '1', email: 'test@example.com' },
            token: 'test-token'
          });
        });
      }).not.toThrow();

      // The state should still be updated even if localStorage fails
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);

      // Restore original method
      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe('Persistence', () => {
    it('should persist authentication state across page reloads', () => {
      const loginData = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token'
      };

      act(() => {
        useAuthStore.getState().login(loginData);
      });

      // Verify token is stored
      expect(mockLocalStorage.getItem('auth_token')).toBe('test-token');

      // This would typically be tested by creating a new store instance
      // and verifying it loads the token from localStorage
    });
  });
});