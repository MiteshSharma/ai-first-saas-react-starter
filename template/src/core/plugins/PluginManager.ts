/**
 * @fileoverview Plugin Manager for handling plugin lifecycle
 *
 * Manages plugin installation, activation, deactivation, and provides
 * context for plugins to interact with the core framework and each other.
 */

import { EventBus, PluginEvent } from './EventBus';
import { CORE_EVENTS } from './coreEvents';
import { Plugin, PluginContext, PluginConfig } from './pluginTypes';
import { logger } from '../utils/logger';

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private pluginContexts: Map<string, PluginContext> = new Map();
  private coreStores: Map<string, unknown> = new Map();
  private coreServices: Map<string, unknown> = new Map();

  constructor(private eventBus: EventBus) {
    this.setupCoreEventListeners();
  }

  static getInstance(eventBus?: EventBus): PluginManager {
    if (!PluginManager.instance) {
      if (!eventBus) {
        throw new Error('EventBus is required for first PluginManager instantiation');
      }
      PluginManager.instance = new PluginManager(eventBus);
    }
    return PluginManager.instance;
  }

  /**
   * Install a plugin
   */
  async installPlugin(plugin: Plugin): Promise<void> {
    try {
      // Create plugin context
      const context = this.createPluginContext(plugin);
      this.pluginContexts.set(plugin.name, context);

      // Install plugin with context
      await plugin.install?.(context);

      this.plugins.set(plugin.name, plugin);

      // Emit plugin installed event
      this.eventBus.emit(CORE_EVENTS.PLUGIN_INSTALLED, {
        name: plugin.name,
        version: plugin.version,
        description: plugin.description
      }, 'PluginManager');

      logger.plugin.success(plugin.name, `Plugin installed: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      logger.plugin.error(plugin.name, `Failed to install plugin ${plugin.name}`, error);
      this.eventBus.emit(CORE_EVENTS.PLUGIN_ERROR, {
        name: plugin.name,
        operation: 'install',
        error: error instanceof Error ? error.message : String(error)
      }, 'PluginManager');
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    if (this.activePlugins.has(pluginName)) {
      logger.warn(`Plugin ${pluginName} is already active`, 'PluginManager');
      return;
    }

    try {
      const context = this.pluginContexts.get(pluginName)!;

      // Register event listeners first
      if (plugin.getEventListeners) {
        const listeners = plugin.getEventListeners();
        listeners.forEach(({ eventType, handler }) => {
          this.eventBus.on(eventType, handler);
        });
      }

      // Activate plugin
      await plugin.activate?.(context);
      this.activePlugins.add(pluginName);

      // Register plugin stores
      if (plugin.registerStores) {
        const stores = plugin.registerStores(context);
        Object.entries(stores).forEach(([storeName, store]) => {
          this.coreStores.set(`plugin.${pluginName}.${storeName}`, store);
        });
      }

      // Emit plugin activated event
      this.eventBus.emit(CORE_EVENTS.PLUGIN_ACTIVATED, {
        name: plugin.name,
        version: plugin.version,
        features: this.getPluginFeatures(plugin)
      }, 'PluginManager');

      logger.plugin.success(plugin.name, `Plugin activated: ${plugin.name}`);
    } catch (error) {
      logger.plugin.error(pluginName, `Failed to activate plugin ${pluginName}`, error);
      this.eventBus.emit(CORE_EVENTS.PLUGIN_ERROR, {
        name: pluginName,
        operation: 'activate',
        error: error instanceof Error ? error.message : String(error)
      }, 'PluginManager');
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !this.activePlugins.has(pluginName)) {
      return;
    }

    try {
      await plugin.deactivate?.();
      this.activePlugins.delete(pluginName);

      // Remove plugin stores
      const keysToRemove = Array.from(this.coreStores.keys())
        .filter(key => key.startsWith(`plugin.${pluginName}.`));
      keysToRemove.forEach(key => this.coreStores.delete(key));

      this.eventBus.emit(CORE_EVENTS.PLUGIN_DEACTIVATED, {
        name: pluginName
      }, 'PluginManager');

      logger.plugin.success(pluginName, `Plugin deactivated: ${pluginName}`);
    } catch (error) {
      logger.plugin.error(pluginName, `Failed to deactivate plugin ${pluginName}`, error);
      throw error;
    }
  }

  /**
   * Register core stores and services for plugins to access
   */
  registerCoreStore(name: string, store: unknown): void {
    this.coreStores.set(name, store);
  }

  registerCoreService(name: string, service: unknown): void {
    this.coreServices.set(name, service);
  }

  /**
   * Create plugin context for a plugin
   */
  private createPluginContext(plugin: Plugin): PluginContext {
    return {
      // Core framework access
      getCoreStore: <T>(storeName: string): T => {
        const store = this.coreStores.get(storeName);
        if (!store) {
          throw new Error(`Core store '${storeName}' not found`);
        }
        return store as T;
      },

      getCoreService: <T>(serviceName: string): T => {
        const service = this.coreServices.get(serviceName);
        if (!service) {
          throw new Error(`Core service '${serviceName}' not found`);
        }
        return service as T;
      },

      // Event Bus methods with plugin source tracking
      emit: (eventType: string, payload: unknown) => {
        this.eventBus.emit(eventType, payload, plugin.name);
      },

      on: (eventType: string, listener: (event: PluginEvent) => void) => {
        return this.eventBus.on(eventType, listener);
      },

      off: (eventType: string, listener: (event: PluginEvent) => void) => {
        this.eventBus.off(eventType, listener);
      },

      // Plugin metadata
      pluginName: plugin.name,
      pluginVersion: plugin.version
    };
  }

  /**
   * Get features provided by a plugin
   */
  private getPluginFeatures(plugin: Plugin): string[] {
    const features: string[] = [];

    if (plugin.registerStores) features.push('stores');
    if (plugin.registerRoutes) features.push('routes');
    if (plugin.registerComponents) features.push('components');
    if (plugin.getEventListeners) features.push('event-listeners');

    return features;
  }

  /**
   * Setup core event listeners
   */
  private setupCoreEventListeners(): void {
    // Listen for system errors
    this.eventBus.on(CORE_EVENTS.ERROR_BOUNDARY, (event) => {
      logger.error('System error', 'PluginManager', event.payload);
    });
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginName: string) {
    const plugin = this.plugins.get(pluginName);
    return {
      installed: !!plugin,
      active: this.activePlugins.has(pluginName),
      version: plugin?.version,
      description: plugin?.description
    };
  }

  /**
   * Get all plugin statuses
   */
  getAllPluginStatuses() {
    const statuses: Record<string, {
      installed: boolean;
      active: boolean;
      version?: string;
      description?: string;
    }> = {};


    return statuses;
  }

  /**
   * Load plugins from manifest
   */
  async loadPluginsFromManifest(configs: PluginConfig[]): Promise<void> {
    for (const config of configs) {
      try {
        const PluginClass = config.pluginClass;
        const plugin = new PluginClass();

        await this.installPlugin(plugin);

        if (config.autoLoad !== false) {
          await this.activatePlugin(plugin.name);
        }
      } catch (error) {
        logger.error(`Failed to load plugin from manifest: ${config.name}`, 'PluginManager', error);
      }
    }
  }
}