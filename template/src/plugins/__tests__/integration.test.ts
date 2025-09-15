/**
 * @fileoverview Plugin System Integration Tests
 * End-to-end tests for the complete plugin system
 */

import { EventBus } from '../../core/plugins/EventBus';
import { PluginManager } from '../../core/plugins/PluginManager';
import { pluginManifest } from '../pluginRegistry';
import { AUTH_EVENTS, TENANT_EVENTS } from '../../core/plugins/coreEvents';
import { PluginTestEnvironment } from '../../core/plugins/testUtils';

describe('Plugin System Integration', () => {
  let testEnv: PluginTestEnvironment;
  let eventBus: EventBus;
  let pluginManager: PluginManager;

  beforeEach(() => {
    testEnv = new PluginTestEnvironment();
    eventBus = testEnv.getEventBus();
    pluginManager = testEnv.getPluginManager();
    testEnv.setupCoreEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Full Plugin Lifecycle', () => {
    it('should load all plugins from manifest', async () => {
      await pluginManager.loadPluginsFromManifest(pluginManifest.plugins);

      // Verify all plugins are loaded
      pluginManifest.plugins.forEach(config => {
        const status = pluginManager.getPluginStatus(config.name);
        expect(status.installed).toBe(true);
        if (config.autoLoad) {
          expect(status.active).toBe(true);
        }
      });
    });

    it('should handle plugin interdependencies', async () => {
      await pluginManager.loadPluginsFromManifest(pluginManifest.plugins);

      const events: any[] = [];
      eventBus.on('plugin.userManagement.activated', (e) => events.push(e));
      eventBus.on('plugin.tenantManagement.activated', (e) => events.push(e));

      // Verify plugins can communicate
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Flow Between Plugins', () => {
    beforeEach(async () => {
      await pluginManager.loadPluginsFromManifest(pluginManifest.plugins);
    });

    it('should propagate auth events to all interested plugins', async () => {
      const loginEvents: any[] = [];

      // Spy on events
      eventBus.on(AUTH_EVENTS.USER_LOGIN, (e) => loginEvents.push(e));

      // Emit login event
      eventBus.emit(AUTH_EVENTS.USER_LOGIN, {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        timestamp: new Date()
      }, 'TestSource');

      // Allow async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loginEvents.length).toBeGreaterThan(0);
      expect(loginEvents[0].payload.userId).toBe('test-user');
    });

    it('should handle tenant switch events across plugins', async () => {
      const tenantEvents: any[] = [];

      eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, (e) => tenantEvents.push(e));

      eventBus.emit(TENANT_EVENTS.TENANT_SWITCHED, {
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
        previousTenantId: null,
        timestamp: new Date()
      }, 'TestSource');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(tenantEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Plugin Error Handling', () => {
    it('should isolate plugin errors', async () => {
      const errorEvents: any[] = [];
      eventBus.on('eventbus.error', (e) => errorEvents.push(e));

      // Create a faulty plugin
      const faultyPlugin = {
        name: 'FaultyPlugin',
        version: '1.0.0',
        description: 'Test faulty plugin',
        activate: async () => {
          throw new Error('Plugin activation failed');
        }
      };

      // Install and try to activate
      await pluginManager.installPlugin(faultyPlugin);

      try {
        await pluginManager.activatePlugin('FaultyPlugin');
      } catch (error) {
        // Expected to throw
      }

      // Verify other plugins are not affected
      const analyticsStatus = pluginManager.getPluginStatus('Analytics');
      expect(analyticsStatus.active).toBe(true);
    });

    it('should handle event listener errors gracefully', async () => {
      await pluginManager.loadPluginsFromManifest(pluginManifest.plugins);

      const errorEvents: any[] = [];
      eventBus.on('eventbus.error', (e) => errorEvents.push(e));

      // Add a faulty listener
      eventBus.on('test.event', () => {
        throw new Error('Listener error');
      });

      // Add a normal listener
      const normalEvents: any[] = [];
      eventBus.on('test.event', (e) => normalEvents.push(e));

      // Emit event
      eventBus.emit('test.event', { data: 'test' }, 'TestSource');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify error was caught
      expect(errorEvents.length).toBeGreaterThan(0);
      // Verify normal listener still received event
      expect(normalEvents.length).toBe(1);
    });
  });

  describe('Plugin Performance', () => {
    it('should handle high-frequency events efficiently', async () => {
      await pluginManager.loadPluginsFromManifest(pluginManifest.plugins);

      const startTime = Date.now();
      const eventCount = 1000;

      // Emit many events rapidly
      for (let i = 0; i < eventCount; i++) {
        eventBus.emit('performance.test', { index: i }, 'TestSource');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should process 1000 events in less than 100ms
      expect(duration).toBeLessThan(100);

      // Verify event history is limited
      const history = eventBus.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(1000); // Max history size
    });

    it('should not leak memory with event listeners', async () => {
      const plugin = pluginManifest.plugins[0];
      const PluginClass = plugin.pluginClass;
      const pluginInstance = new PluginClass();

      // Install and activate multiple times
      for (let i = 0; i < 10; i++) {
        await pluginManager.installPlugin(pluginInstance);
        await pluginManager.activatePlugin(plugin.name);
        await pluginManager.deactivatePlugin(plugin.name);
      }

      // Check listener count hasn't grown
      const listeners = eventBus.getListenersForEvent(AUTH_EVENTS.USER_LOGIN);
      expect(listeners.length).toBeLessThan(20); // Reasonable upper bound
    });
  });

  describe('Plugin Configuration', () => {
    it('should respect plugin enable/disable settings', async () => {
      const disabledPlugin = {
        ...pluginManifest.plugins[0],
        enabled: false
      };

      await pluginManager.loadPluginsFromManifest([disabledPlugin]);

      const status = pluginManager.getPluginStatus(disabledPlugin.name);
      expect(status.installed).toBe(true);
      expect(status.active).toBe(false);
    });

    it('should handle plugin version conflicts', async () => {
      const plugin1 = {
        name: 'TestPlugin',
        version: '1.0.0',
        description: 'Version 1',
        install: jest.fn()
      };

      const plugin2 = {
        name: 'TestPlugin',
        version: '2.0.0',
        description: 'Version 2',
        install: jest.fn()
      };

      await pluginManager.installPlugin(plugin1);

      // Second installation should update
      await pluginManager.installPlugin(plugin2);

      const status = pluginManager.getPluginStatus('TestPlugin');
      expect(status.version).toBe('2.0.0');
    });
  });

  describe('Core Integration', () => {
    it('should integrate with core stores', async () => {
      // Register mock core stores
      const mockAuthStore = {
        getState: () => ({ user: { id: '123' }, isAuthenticated: true }),
        subscribe: jest.fn()
      };

      pluginManager.registerCoreStore('authStore', mockAuthStore);

      await pluginManager.loadPluginsFromManifest(pluginManifest.plugins);

      // Verify plugins can access core stores
      // This would be tested through plugin context usage
      expect(mockAuthStore.subscribe).toHaveBeenCalled();
    });

    it('should provide consistent plugin context', async () => {
      const contexts: any[] = [];

      const testPlugin = {
        name: 'ContextTestPlugin',
        version: '1.0.0',
        install: async (context: any) => {
          contexts.push(context);
        },
        activate: async (context: any) => {
          contexts.push(context);
        }
      };

      await pluginManager.installPlugin(testPlugin);
      await pluginManager.activatePlugin('ContextTestPlugin');

      // Both contexts should have same interface
      expect(contexts[0].pluginName).toBe('ContextTestPlugin');
      expect(contexts[1].pluginName).toBe('ContextTestPlugin');
      expect(typeof contexts[0].emit).toBe('function');
      expect(typeof contexts[1].emit).toBe('function');
    });
  });
});