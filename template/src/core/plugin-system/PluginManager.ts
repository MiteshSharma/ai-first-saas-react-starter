/**
 * @fileoverview Simplified Plugin Manager (Plan 3)
 *
 * Plugin manager following plan_3 specifications:
 * - Code-based registration (no JSON manifests)
 * - Plugins register themselves directly
 * - Core provides context to plugins (one-way communication)
 * - Simple widget and route registration
 */

import { Plugin, PluginContext, IPluginManager, WidgetRegistration, AuthContext, LayoutContext, CORE_EVENTS } from './types';
import { EventBus, eventBus } from './EventBus';


export class PluginManager implements IPluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  private routes: Map<string, React.ComponentType> = new Map();
  private sidebarWidgets: WidgetRegistration[] = [];
  private headerWidgets: WidgetRegistration[] = [];
  private dashboardWidgets: WidgetRegistration[] = [];
  private authContext: AuthContext | null = null;
  private layoutContext: LayoutContext | null = null;

  private constructor(private eventBus: EventBus) {}

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager(eventBus);
    }
    return PluginManager.instance;
  }

  /**
   * Register a plugin (called by plugins themselves)
   */
  static register(plugin: Plugin): void {
    const instance = PluginManager.getInstance();
    // Fire and forget - static method doesn't support async
    instance.registerPlugin(plugin).catch(() => {
      // Error already logged in registerPlugin
    });
  }

  /**
   * Instance method for register (required by interface)
   */
  register(plugin: Plugin): void {
    // Fire and forget - interface doesn't support async
    this.registerPlugin(plugin).catch(() => {
      // Error already logged in registerPlugin
    });
  }

  /**
   * Internal plugin registration
   */
  private async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      // Store plugin
      this.plugins.set(plugin.name, plugin);

      // Create context for plugin
      const context = this.createPluginContext(plugin);

      // Initialize plugin with context
      await plugin.init(context);

      // Emit plugin loaded event
      this.eventBus.emit(CORE_EVENTS.PLUGIN_LOADED, {
        name: plugin.name,
        version: plugin.version
      });

    } catch (error) {
      this.eventBus.emit(CORE_EVENTS.PLUGIN_ERROR, {
        name: plugin.name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create plugin context (core provides services to plugin)
   */
  private createPluginContext(plugin: Plugin): PluginContext {
    return {
      // Core auth service (plugins can call this)
      auth: this.authContext || {
        getCurrentUser: () => null,
        isAuthenticated: () => false,
        getToken: () => null,
        login: async () => {},
        logout: () => {}
      },

      // Event bus for communication
      eventBus: this.eventBus,

      // Layout context for UI registration (temporarily disabled)
      // layout: this.layoutContext || {
      //   registerMenuItem: () => () => {},
      //   registerSidebarWidget: () => () => {},
      //   registerHeaderWidget: () => () => {},
      //   sidebarCollapsed: false,
      //   setSidebarCollapsed: () => {},
      //   theme: 'light' as const,
      //   setTheme: () => {}
      // },

      // Registration methods (plugins can call these)
      registerRoute: (path: string, component: React.ComponentType) => {
        this.routes.set(path, component);
      },

      registerSidebarWidget: (id: string, component: React.ComponentType, priority: number = 1) => {
        this.sidebarWidgets.push({ id, component, priority });
        this.sidebarWidgets.sort((a, b) => (a.priority || 1) - (b.priority || 1));
      },

      registerHeaderWidget: (id: string, component: React.ComponentType) => {
        this.headerWidgets.push({ id, component });
      },

      registerDashboardWidget: (id: string, component: React.ComponentType, priority: number = 1) => {
        this.dashboardWidgets.push({ id, component, priority });
        this.dashboardWidgets.sort((a, b) => (a.priority || 1) - (b.priority || 1));
      }
    };
  }

  /**
   * Set auth context (called by core, not plugins)
   */
  setAuthContext(authContext: AuthContext): void {
    this.authContext = authContext;
  }

  /**
   * Set layout context (called by core, not plugins)
   */
  setLayoutContext(layoutContext: LayoutContext): void {
    this.layoutContext = layoutContext;
  }

  /**
   * Initialize plugin manager with auth context
   */
  static initialize(authContext: AuthContext, layoutContext?: LayoutContext): void {
    const instance = PluginManager.getInstance();
    instance.setAuthContext(authContext);
    if (layoutContext) {
      instance.setLayoutContext(layoutContext);
    }
  }

  /**
   * Get registered routes (called by core layout, not plugins)
   */
  getRegisteredRoutes(): Map<string, React.ComponentType> {
    return new Map(this.routes);
  }

  /**
   * Get sidebar widgets (called by core layout, not plugins)
   */
  getSidebarWidgets(): WidgetRegistration[] {
    return [...this.sidebarWidgets];
  }

  /**
   * Get header widgets (called by core layout, not plugins)
   */
  getHeaderWidgets(): WidgetRegistration[] {
    return [...this.headerWidgets];
  }

  /**
   * Get dashboard widgets (called by core layout, not plugins)
   */
  getDashboardWidgets(): WidgetRegistration[] {
    return [...this.dashboardWidgets];
  }

  /**
   * Get loaded plugins (for debugging)
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Unload a plugin (cleanup)
   */
  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return;
    }

    try {
      // Call plugin destroy if it exists
      if (plugin.destroy) {
        await plugin.destroy();
      }

      // Remove plugin registrations
      this.sidebarWidgets = this.sidebarWidgets.filter(w => !w.id.startsWith(pluginName));
      this.headerWidgets = this.headerWidgets.filter(w => !w.id.startsWith(pluginName));
      this.dashboardWidgets = this.dashboardWidgets.filter(w => !w.id.startsWith(pluginName));

      // Remove routes (more complex - would need route tracking)
      // For now, routes persist until app reload

      // Remove plugin
      this.plugins.delete(pluginName);

      // Emit plugin unloaded event
      this.eventBus.emit(CORE_EVENTS.PLUGIN_UNLOADED, { name: pluginName });

    } catch (error) {
    }
  }
}

// Export singleton instance
export const pluginManager = PluginManager.getInstance();