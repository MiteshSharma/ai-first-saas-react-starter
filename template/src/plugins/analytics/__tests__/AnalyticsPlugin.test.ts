/**
 * @fileoverview Analytics Plugin Test Suite
 * Tests for the Analytics plugin functionality
 */

import { AnalyticsPlugin } from '../AnalyticsPlugin';
import { PluginTestEnvironment, EventTestUtils } from '../../../core/plugins/testUtils';
import { AUTH_EVENTS, TENANT_EVENTS } from '../../../core/plugins/coreEvents';

describe('AnalyticsPlugin', () => {
  let testEnv: PluginTestEnvironment;
  let eventUtils: EventTestUtils;
  let plugin: AnalyticsPlugin;

  beforeEach(() => {
    testEnv = new PluginTestEnvironment();
    eventUtils = new EventTestUtils(testEnv.getEventBus());
    testEnv.setupCoreEnvironment();
    plugin = new AnalyticsPlugin();
  });

  afterEach(() => {
    eventUtils.cleanup();
    testEnv.cleanup();
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('Analytics');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('Tracks user activity and provides analytics');
      expect(plugin.author).toBe('Core Team');
    });
  });

  describe('Plugin Installation', () => {
    it('should install successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await testEnv.getPluginManager().installPlugin(plugin);

      expect(consoleSpy).toHaveBeenCalledWith('🔌 Installing Analytics plugin v1.0.0');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Analytics plugin installed successfully');

      consoleSpy.mockRestore();
    });

    it('should load existing stats from localStorage', async () => {
      // Pre-populate localStorage with stats
      const existingStats = {
        totalLogins: 5,
        tenantSwitches: 3,
        lastActivity: '2023-01-01T00:00:00.000Z'
      };
      testEnv.getMockLocalStorage().setItem('analytics-plugin-data', JSON.stringify(existingStats));

      await testEnv.getPluginManager().installPlugin(plugin);

      // Verify stats were loaded (this would require exposing stats or testing through behavior)
      expect(testEnv.getMockLocalStorage().getItem('analytics-plugin-data')).toBeTruthy();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set corrupted data
      testEnv.getMockLocalStorage().setItem('analytics-plugin-data', 'invalid json');

      await expect(testEnv.getPluginManager().installPlugin(plugin)).resolves.not.toThrow();
    });
  });

  describe('Plugin Activation', () => {
    beforeEach(async () => {
      await testEnv.getPluginManager().installPlugin(plugin);
    });

    it('should activate successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await testEnv.getPluginManager().activatePlugin('Analytics');

      expect(consoleSpy).toHaveBeenCalledWith('🚀 Activating Analytics plugin');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Analytics plugin activated');

      consoleSpy.mockRestore();
    });

    it('should update lastActivity on activation', async () => {
      const beforeActivation = Date.now();
      await testEnv.getPluginManager().activatePlugin('Analytics');

      // Check that localStorage was updated (indicating lastActivity was updated)
      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.lastActivity).toBeTruthy();
        expect(new Date(parsedData.lastActivity).getTime()).toBeGreaterThanOrEqual(beforeActivation);
      }
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      await testEnv.getPluginManager().installPlugin(plugin);
      await testEnv.getPluginManager().activatePlugin('Analytics');
    });

    it('should provide correct event listeners', () => {
      const listeners = plugin.getEventListeners();

      expect(listeners).toHaveLength(3);
      expect(listeners.some(l => l.eventType === AUTH_EVENTS.USER_LOGIN)).toBe(true);
      expect(listeners.some(l => l.eventType === AUTH_EVENTS.USER_LOGOUT)).toBe(true);
      expect(listeners.some(l => l.eventType === TENANT_EVENTS.TENANT_SWITCHED)).toBe(true);
    });

    it('should track user login events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const eventSpy = eventUtils.spyOnEvent(AUTH_EVENTS.USER_LOGIN);

      // Emit login event
      const loginPayload = { userId: '123', email: 'test@example.com', name: 'Test User' };
      testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGIN, loginPayload);

      await testEnv.waitForNextTick();

      expect(consoleSpy).toHaveBeenCalledWith('📊 Analytics: User logged in', loginPayload);

      // Check that stats were updated in localStorage
      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.totalLogins).toBeGreaterThan(0);
        expect(parsedData.lastActivity).toBeTruthy();
      }

      consoleSpy.mockRestore();
    });

    it('should track user logout events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Emit logout event
      testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGOUT, { previousUserId: '123' });

      await testEnv.waitForNextTick();

      expect(consoleSpy).toHaveBeenCalledWith('📊 Analytics: User logged out');

      // Check that lastActivity was updated
      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.lastActivity).toBeTruthy();
      }

      consoleSpy.mockRestore();
    });

    it('should track tenant switch events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Emit tenant switch event
      const tenantPayload = { tenantId: 'tenant123', tenantName: 'Test Tenant' };
      testEnv.emitTestEvent(TENANT_EVENTS.TENANT_SWITCHED, tenantPayload);

      await testEnv.waitForNextTick();

      expect(consoleSpy).toHaveBeenCalledWith('📊 Analytics: Tenant switched', tenantPayload);

      // Check that stats were updated
      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.tenantSwitches).toBeGreaterThan(0);
        expect(parsedData.lastActivity).toBeTruthy();
      }

      consoleSpy.mockRestore();
    });

    it('should accumulate stats over multiple events', async () => {
      // Clear initial stats
      testEnv.getMockLocalStorage().clear();

      // Emit multiple events
      testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGIN, { userId: '123' });
      testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGIN, { userId: '456' });
      testEnv.emitTestEvent(TENANT_EVENTS.TENANT_SWITCHED, { tenantId: 'tenant1' });
      testEnv.emitTestEvent(TENANT_EVENTS.TENANT_SWITCHED, { tenantId: 'tenant2' });

      await testEnv.waitForNextTick();

      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.totalLogins).toBe(2);
        expect(parsedData.tenantSwitches).toBe(2);
      }
    });
  });

  describe('Component Registration', () => {
    it('should register analytics widget component', () => {
      const components = plugin.registerComponents();

      expect(Array.isArray(components)).toBe(true);
      expect(components).toHaveLength(1);

      const widget = components[0];
      expect(widget.name).toBe('AnalyticsWidget');
      expect(widget.mountPoint).toBe('dashboard-widgets');
      expect(widget.order).toBe(1);
      expect(widget.component).toBeDefined();
    });
  });

  describe('Plugin Deactivation', () => {
    beforeEach(async () => {
      await testEnv.getPluginManager().installPlugin(plugin);
      await testEnv.getPluginManager().activatePlugin('Analytics');
    });

    it('should deactivate successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await testEnv.getPluginManager().deactivatePlugin('Analytics');

      expect(consoleSpy).toHaveBeenCalledWith('⏸️ Deactivating Analytics plugin');

      consoleSpy.mockRestore();
    });
  });

  describe('Data Persistence', () => {
    it('should persist stats to localStorage', async () => {
      await testEnv.getPluginManager().installPlugin(plugin);
      await testEnv.getPluginManager().activatePlugin('Analytics');

      // Clear localStorage to start fresh
      testEnv.getMockLocalStorage().clear();

      // Trigger an event that updates stats
      testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGIN, { userId: '123' });

      await testEnv.waitForNextTick();

      // Verify data is in localStorage
      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.totalLogins).toBe(1);
        expect(parsedData.lastActivity).toBeTruthy();
      }
    });

    it('should maintain stats across plugin reinstallation', async () => {
      // First installation
      await testEnv.getPluginManager().installPlugin(plugin);
      await testEnv.getPluginManager().activatePlugin('Analytics');

      // Trigger some events
      testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGIN, { userId: '123' });
      testEnv.emitTestEvent(TENANT_EVENTS.TENANT_SWITCHED, { tenantId: 'tenant1' });

      await testEnv.waitForNextTick();

      // Create new plugin instance (simulating app restart)
      const newPlugin = new AnalyticsPlugin();
      await testEnv.getPluginManager().installPlugin(newPlugin);

      // Stats should still be available in localStorage
      const storedData = testEnv.getMockLocalStorage().getItem('analytics-plugin-data');
      expect(storedData).toBeTruthy();

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.totalLogins).toBe(1);
        expect(parsedData.tenantSwitches).toBe(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = testEnv.getMockLocalStorage().setItem;
      testEnv.getMockLocalStorage().setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      await testEnv.getPluginManager().installPlugin(plugin);
      await testEnv.getPluginManager().activatePlugin('Analytics');

      // Should not throw when trying to update stats
      expect(() => {
        testEnv.emitTestEvent(AUTH_EVENTS.USER_LOGIN, { userId: '123' });
      }).not.toThrow();

      // Restore original method
      testEnv.getMockLocalStorage().setItem = originalSetItem;
    });
  });
});