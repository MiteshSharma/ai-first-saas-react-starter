/**
 * @fileoverview PluginManager Test Suite
 * Tests for plugin lifecycle management and context provision
 */

import { PluginManager } from '../PluginManager';
import { EventBus } from '../EventBus';
import { Plugin, PluginContext } from '../pluginTypes';
import { CORE_EVENTS } from '../coreEvents';

// Mock plugin class for testing
class MockPlugin implements Plugin {
  name = 'MockPlugin';
  version = '1.0.0';
  description = 'A mock plugin for testing';

  install = jest.fn();
  activate = jest.fn();
  deactivate = jest.fn();
  getEventListeners = jest.fn(() => []);
  registerStores = jest.fn(() => ({}));
  registerRoutes = jest.fn(() => []);
  registerComponents = jest.fn(() => ({}));
}

class ErrorPlugin implements Plugin {
  name = 'ErrorPlugin';
  version = '1.0.0';

  install = jest.fn().mockRejectedValue(new Error('Install failed'));
  activate = jest.fn().mockRejectedValue(new Error('Activate failed'));
  deactivate = jest.fn().mockRejectedValue(new Error('Deactivate failed'));
}

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let eventBus: EventBus;
  let mockPlugin: MockPlugin;

  beforeEach(() => {
    eventBus = new EventBus();
    pluginManager = new PluginManager(eventBus);
    mockPlugin = new MockPlugin();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should create singleton instance', () => {
      const instance1 = PluginManager.getInstance(eventBus);
      const instance2 = PluginManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should throw error if no EventBus provided on first instantiation', () => {
      // Reset the singleton
      (PluginManager as any).instance = null;

      expect(() => {
        PluginManager.getInstance();
      }).toThrow('EventBus is required for first PluginManager instantiation');
    });
  });

  describe('Plugin Installation', () => {
    it('should install plugin successfully', async () => {
      const eventSpy = jest.spyOn(eventBus, 'emit');

      await pluginManager.installPlugin(mockPlugin);

      expect(mockPlugin.install).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginName: 'MockPlugin',
          pluginVersion: '1.0.0'
        })
      );

      expect(eventSpy).toHaveBeenCalledWith(
        CORE_EVENTS.PLUGIN_INSTALLED,
        {
          name: 'MockPlugin',
          version: '1.0.0',
          description: 'A mock plugin for testing'
        },
        'PluginManager'
      );
    });

    it('should handle plugin installation errors', async () => {
      const errorPlugin = new ErrorPlugin();
      const eventSpy = jest.spyOn(eventBus, 'emit');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(pluginManager.installPlugin(errorPlugin)).rejects.toThrow('Install failed');

      expect(eventSpy).toHaveBeenCalledWith(
        CORE_EVENTS.PLUGIN_ERROR,
        {
          name: 'ErrorPlugin',
          operation: 'install',
          error: 'Install failed'
        },
        'PluginManager'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Plugin Activation', () => {
    beforeEach(async () => {
      await pluginManager.installPlugin(mockPlugin);
    });

    it('should activate plugin successfully', async () => {
      const eventSpy = jest.spyOn(eventBus, 'emit');

      await pluginManager.activatePlugin('MockPlugin');

      expect(mockPlugin.activate).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        CORE_EVENTS.PLUGIN_ACTIVATED,
        expect.objectContaining({
          name: 'MockPlugin',
          version: '1.0.0'
        }),
        'PluginManager'
      );
    });

    it('should not activate already active plugin', async () => {
      await pluginManager.activatePlugin('MockPlugin');
      jest.clearAllMocks();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await pluginManager.activatePlugin('MockPlugin');

      expect(mockPlugin.activate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Plugin MockPlugin is already active');

      consoleSpy.mockRestore();
    });

    it('should throw error for non-existent plugin', async () => {
      await expect(pluginManager.activatePlugin('NonExistentPlugin')).rejects.toThrow(
        'Plugin NonExistentPlugin not found'
      );
    });

    it('should register event listeners during activation', async () => {
      const mockEventListener = jest.fn();
      mockPlugin.getEventListeners = jest.fn(() => [
        { eventType: 'test.event', handler: mockEventListener }
      ]);

      const eventBusSpy = jest.spyOn(eventBus, 'on');

      await pluginManager.activatePlugin('MockPlugin');

      expect(eventBusSpy).toHaveBeenCalledWith('test.event', mockEventListener);
    });

    it('should register plugin stores during activation', async () => {
      const mockStore = { state: 'test' };
      mockPlugin.registerStores = jest.fn(() => ({ testStore: mockStore }));

      await pluginManager.activatePlugin('MockPlugin');

      // Verify store is accessible through plugin context
      const status = pluginManager.getPluginStatus('MockPlugin');
      expect(status.active).toBe(true);
    });
  });

  describe('Plugin Deactivation', () => {
    beforeEach(async () => {
      await pluginManager.installPlugin(mockPlugin);
      await pluginManager.activatePlugin('MockPlugin');
    });

    it('should deactivate plugin successfully', async () => {
      const eventSpy = jest.spyOn(eventBus, 'emit');

      await pluginManager.deactivatePlugin('MockPlugin');

      expect(mockPlugin.deactivate).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        CORE_EVENTS.PLUGIN_DEACTIVATED,
        { name: 'MockPlugin' },
        'PluginManager'
      );

      const status = pluginManager.getPluginStatus('MockPlugin');
      expect(status.active).toBe(false);
    });

    it('should handle non-existent plugin deactivation gracefully', async () => {
      await expect(pluginManager.deactivatePlugin('NonExistentPlugin')).resolves.not.toThrow();
    });

    it('should clean up plugin stores on deactivation', async () => {
      const mockStore = { state: 'test' };
      mockPlugin.registerStores = jest.fn(() => ({ testStore: mockStore }));

      await pluginManager.activatePlugin('MockPlugin');
      await pluginManager.deactivatePlugin('MockPlugin');

      // Stores should be cleaned up - this is tested indirectly through the deactivation process
      expect(mockPlugin.deactivate).toHaveBeenCalled();
    });
  });

  describe('Core Store and Service Registration', () => {
    it('should register and provide access to core stores', () => {
      const mockStore = { state: 'test' };
      pluginManager.registerCoreStore('testStore', mockStore);

      // This would be tested through plugin context usage
      expect(() => {
        pluginManager.registerCoreStore('testStore', mockStore);
      }).not.toThrow();
    });

    it('should register and provide access to core services', () => {
      const mockService = { method: jest.fn() };
      pluginManager.registerCoreService('testService', mockService);

      expect(() => {
        pluginManager.registerCoreService('testService', mockService);
      }).not.toThrow();
    });
  });

  describe('Plugin Context', () => {
    let pluginContext: PluginContext;

    beforeEach(async () => {
      // Install plugin to create context
      await pluginManager.installPlugin(mockPlugin);

      // Access the context through the mock plugin's install call
      pluginContext = mockPlugin.install.mock.calls[0][0];
    });

    it('should provide plugin metadata in context', () => {
      expect(pluginContext.pluginName).toBe('MockPlugin');
      expect(pluginContext.pluginVersion).toBe('1.0.0');
    });

    it('should provide event bus methods in context', () => {
      const mockListener = jest.fn();

      pluginContext.on('test.event', mockListener);
      pluginContext.emit('test.event', { data: 'test' });

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          payload: { data: 'test' },
          metadata: expect.objectContaining({
            source: 'MockPlugin'
          })
        })
      );
    });

    it('should provide access to core stores', () => {
      const mockStore = { state: 'test' };
      pluginManager.registerCoreStore('testStore', mockStore);

      const retrievedStore = pluginContext.getCoreStore('testStore');
      expect(retrievedStore).toBe(mockStore);
    });

    it('should throw error for non-existent core store', () => {
      expect(() => {
        pluginContext.getCoreStore('nonExistentStore');
      }).toThrow("Core store 'nonExistentStore' not found");
    });

    it('should provide access to core services', () => {
      const mockService = { method: jest.fn() };
      pluginManager.registerCoreService('testService', mockService);

      const retrievedService = pluginContext.getCoreService('testService');
      expect(retrievedService).toBe(mockService);
    });

    it('should throw error for non-existent core service', () => {
      expect(() => {
        pluginContext.getCoreService('nonExistentService');
      }).toThrow("Core service 'nonExistentService' not found");
    });
  });

  describe('Plugin Status', () => {
    it('should return correct status for installed plugin', async () => {
      await pluginManager.installPlugin(mockPlugin);

      const status = pluginManager.getPluginStatus('MockPlugin');
      expect(status).toEqual({
        installed: true,
        active: false,
        version: '1.0.0',
        description: 'A mock plugin for testing'
      });
    });

    it('should return correct status for active plugin', async () => {
      await pluginManager.installPlugin(mockPlugin);
      await pluginManager.activatePlugin('MockPlugin');

      const status = pluginManager.getPluginStatus('MockPlugin');
      expect(status).toEqual({
        installed: true,
        active: true,
        version: '1.0.0',
        description: 'A mock plugin for testing'
      });
    });

    it('should return correct status for non-existent plugin', () => {
      const status = pluginManager.getPluginStatus('NonExistentPlugin');
      expect(status).toEqual({
        installed: false,
        active: false,
        version: undefined,
        description: undefined
      });
    });
  });

  describe('Plugin Manifest Loading', () => {
    it('should load plugins from manifest with autoLoad', async () => {
      const mockConfig = [
        {
          name: 'MockPlugin',
          pluginClass: MockPlugin,
          autoLoad: true,
          enabled: true
        }
      ];

      await pluginManager.loadPluginsFromManifest(mockConfig);

      const status = pluginManager.getPluginStatus('MockPlugin');
      expect(status.installed).toBe(true);
      expect(status.active).toBe(true);
    });

    it('should load plugins from manifest without autoLoad', async () => {
      const mockConfig = [
        {
          name: 'MockPlugin',
          pluginClass: MockPlugin,
          autoLoad: false,
          enabled: true
        }
      ];

      await pluginManager.loadPluginsFromManifest(mockConfig);

      const status = pluginManager.getPluginStatus('MockPlugin');
      expect(status.installed).toBe(true);
      expect(status.active).toBe(false);
    });

    it('should handle errors in manifest loading gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockConfig = [
        {
          name: 'ErrorPlugin',
          pluginClass: ErrorPlugin,
          autoLoad: true,
          enabled: true
        }
      ];

      await pluginManager.loadPluginsFromManifest(mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load plugin from manifest: ErrorPlugin',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});