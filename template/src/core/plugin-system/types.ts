/**
 * @fileoverview Plugin System Types (Plan 3)
 *
 * Simplified plugin system types following plan_3 specifications:
 * - Code-based registration (no JSON manifests)
 * - Core can't call plugins directly
 * - Plugins can call core services
 * - Event-driven communication
 */

// Core services that plugins can access
export interface AuthContext {
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
  getToken: () => string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Event bus interface for communication
export interface EventBus {
  on: (event: string, handler: (data: unknown) => void) => () => void;
  off: (event: string, handler: (data: unknown) => void) => void;
  emit: (event: string, data: unknown) => void;
}

// Layout context interface for plugins (minimal interface to avoid circular deps)
export interface LayoutContext {
  registerMenuItem: (item: { id: string; label: string; path: string }) => () => void;
  registerSidebarWidget: (widget: { id: string; component: React.ComponentType }) => () => void;
  registerHeaderWidget: (widget: { id: string; component: React.ComponentType }) => () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// Context provided to plugins by core
export interface PluginContext {
  // Core services plugins can call
  auth: AuthContext;

  // Event bus for communication
  eventBus: EventBus;

  // Layout context for UI registration (temporarily disabled)
  // layout: LayoutContext;

  // Registration methods for plugins
  registerRoute: (path: string, component: React.ComponentType) => void;
  registerSidebarWidget: (id: string, component: React.ComponentType, priority: number) => void;
  registerHeaderWidget: (id: string, component: React.ComponentType) => void;
  registerDashboardWidget: (id: string, component: React.ComponentType, priority: number) => void;
}

// Simplified plugin interface
export interface Plugin {
  name: string;
  version: string;
  init: (context: PluginContext) => Promise<void>;
  destroy?: () => Promise<void>;
}

// Widget registration
export interface WidgetRegistration {
  id: string;
  component: React.ComponentType;
  priority?: number;
  slot?: string;
}

// Route registration
export interface RouteRegistration {
  path: string;
  component: React.ComponentType;
  requiresAuth?: boolean;
}

// User interface for auth context
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// Plugin manager interface (simplified)
export interface IPluginManager {
  register: (plugin: Plugin) => void;
  getRegisteredRoutes: () => Map<string, React.ComponentType>;
  getSidebarWidgets: () => WidgetRegistration[];
  getHeaderWidgets: () => WidgetRegistration[];
  getDashboardWidgets: () => WidgetRegistration[];
  getLoadedPlugins: () => string[];
}

// Core events that plugins can listen to
export const CORE_EVENTS = {
  // Auth events
  USER_LOGGED_IN: 'core.user.logged_in',
  USER_LOGGED_OUT: 'core.user.logged_out',
  USER_UPDATED: 'core.user.updated',

  // System events
  APP_INITIALIZED: 'core.app.initialized',
  ROUTE_CHANGED: 'core.route.changed',

  // Plugin events
  PLUGIN_LOADED: 'core.plugin.loaded',
  PLUGIN_UNLOADED: 'core.plugin.unloaded',
  PLUGIN_ERROR: 'core.plugin.error'
} as const;

export type CoreEventType = typeof CORE_EVENTS[keyof typeof CORE_EVENTS];