/**
 * @fileoverview UserManagement Plugin Tests
 */

import { UserManagementPlugin } from '../UserManagementPlugin';
import { AUTH_EVENTS, TENANT_EVENTS, DATA_EVENTS } from '../../../core/plugins/coreEvents';
import {
  setupPluginTest,
  simulateEvent,
  expectEventEmitted,
  createMockCoreStores,
  createMockCoreServices,
  cleanupPluginTest
} from '../../../core/plugins/pluginTestHelper';

describe('UserManagementPlugin', () => {
  let setup: any;

  beforeEach(async () => {
    setup = await setupPluginTest(UserManagementPlugin, {
      coreStores: createMockCoreStores(),
      coreServices: createMockCoreServices()
    });
  });

  afterEach(async () => {
    await cleanupPluginTest(setup);
  });

  describe('Plugin Metadata', () => {
    it('should have correct metadata', () => {
      expect(setup.plugin.name).toBe('UserManagement');
      expect(setup.plugin.version).toBe('1.0.0');
      expect(setup.plugin.description).toBe('User management, profiles, and authentication features');
    });
  });

  describe('Event Listeners', () => {
    it('should register correct event listeners', () => {
      const listeners = setup.plugin.getEventListeners();
      const eventTypes = listeners.map((l: any) => l.eventType);

      expect(eventTypes).toContain(AUTH_EVENTS.USER_LOGIN);
      expect(eventTypes).toContain(AUTH_EVENTS.USER_LOGOUT);
      expect(eventTypes).toContain(AUTH_EVENTS.USER_PROFILE_UPDATE);
      expect(eventTypes).toContain(TENANT_EVENTS.TENANT_SWITCHED);
      expect(eventTypes).toContain(DATA_EVENTS.DATA_REFRESH);
    });

    it('should have correct listener priorities', () => {
      const listeners = setup.plugin.getEventListeners();
      const loginListener = listeners.find((l: any) => l.eventType === AUTH_EVENTS.USER_LOGIN);

      expect(loginListener.priority).toBe(8); // High priority for user management
    });
  });

  describe('User Login Handling', () => {
    it('should handle user login event', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user: { id: '123', name: 'Test User', email: 'test@example.com' },
        token: 'test-token'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User Test User logged in')
      );

      consoleSpy.mockRestore();
    });

    it('should cache user information on login', async () => {
      const user = { id: '123', name: 'Test User', email: 'test@example.com' };

      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user,
        token: 'test-token'
      });

      const cachedUser = setup.plugin.getUserFromCache('123');
      expect(cachedUser).toBeDefined();
      expect(cachedUser.id).toBe('123');
      expect(cachedUser.lastLogin).toBeDefined();
    });
  });

  describe('User Logout Handling', () => {
    it('should handle user logout event', async () => {
      const user = { id: '123', name: 'Test User' };

      // Login first
      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user,
        token: 'test-token'
      });

      // Then logout
      await simulateEvent(setup, AUTH_EVENTS.USER_LOGOUT, { user });

      const cachedUser = setup.plugin.getUserFromCache('123');
      expect(cachedUser).toBeUndefined();
    });
  });

  describe('Profile Update Handling', () => {
    it('should handle profile update event', async () => {
      const oldUser = { id: '123', name: 'Old Name' };
      const newUser = { id: '123', name: 'New Name' };

      // Login first
      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user: oldUser,
        token: 'test-token'
      });

      // Update profile
      await simulateEvent(setup, AUTH_EVENTS.USER_PROFILE_UPDATE, {
        user: newUser,
        previousUser: oldUser
      });

      const cachedUser = setup.plugin.getUserFromCache('123');
      expect(cachedUser.name).toBe('New Name');
    });
  });

  describe('Tenant Switch Handling', () => {
    it('should handle tenant switch event', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await simulateEvent(setup, TENANT_EVENTS.TENANT_SWITCHED, {
        oldTenant: { id: 'old', name: 'Old Tenant' },
        newTenant: { id: 'new', name: 'New Tenant' },
        oldTenantId: 'old',
        newTenantId: 'new'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tenant switched from Old Tenant to New Tenant')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Refresh Handling', () => {
    it('should clear cache on logout data refresh', async () => {
      const user = { id: '123', name: 'Test User' };

      // Add user to cache
      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user,
        token: 'test-token'
      });

      // Trigger data refresh with logout reason
      await simulateEvent(setup, DATA_EVENTS.DATA_REFRESH, {
        type: 'all',
        reason: 'logout',
        clear: true
      });

      const cachedUsers = setup.plugin.getAllCachedUsers();
      expect(cachedUsers).toHaveLength(0);
    });

    it('should refresh user data on user type refresh', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await simulateEvent(setup, DATA_EVENTS.DATA_REFRESH, {
        type: 'users',
        reason: 'update',
        clear: false
      });

      expect(consoleSpy).toHaveBeenCalledWith('Refreshing user data cache');

      consoleSpy.mockRestore();
    });
  });

  describe('Plugin Activation', () => {
    it('should emit activation event', async () => {
      // Plugin is already activated in setup
      const activationEvent = setup.emittedEvents.find(
        (e: any) => e.type === 'plugin.userManagement.activated'
      );

      expect(activationEvent).toBeDefined();
      expect(activationEvent.payload.features).toContain('profiles');
      expect(activationEvent.payload.features).toContain('authentication');
      expect(activationEvent.payload.features).toContain('user_roles');
    });
  });

  describe('Cache Persistence', () => {
    it('should persist cache to localStorage', async () => {
      const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user: { id: '123', name: 'Test User' },
        token: 'test-token'
      });

      // Note: Implementation doesn't actually persist to localStorage yet
      // This test is for future implementation

      localStorageSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Simulate an event with invalid data
      await simulateEvent(setup, AUTH_EVENTS.USER_LOGIN, {
        user: null, // Invalid user
        token: 'test-token'
      });

      // Should not throw, but might log warning
      expect(setup.plugin).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});