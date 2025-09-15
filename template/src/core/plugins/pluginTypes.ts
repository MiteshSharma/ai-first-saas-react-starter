/**
 * @fileoverview Plugin system type definitions
 *
 * Defines the interfaces and types for the plugin architecture
 */

import { PluginEvent, EventListenerConfig } from './EventBus';

// Re-export types for easier importing
export type { EventListenerConfig, PluginEvent };

export interface PluginContext {
  // Core framework access
  getCoreStore<T>(storeName: string): T;
  getCoreService<T>(serviceName: string): T;

  // Event Bus communication
  emit(eventType: string, payload: any): void;
  on(eventType: string, listener: (event: PluginEvent) => void): () => void;
  off(eventType: string, listener: Function): void;

  // Plugin metadata
  pluginName: string;
  pluginVersion: string;
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any> | (() => Promise<React.ComponentType<any>>);
  requiresAuth?: boolean;
  requiresTenant?: boolean;
  permissions?: string[];
  onEnter?: () => void;
  onExit?: () => void;
}

export interface ComponentConfig {
  name: string;
  component: React.ComponentType<any>;
  mountPoint: string;
  props?: Record<string, any>;
  order?: number;
}

export interface Plugin {
  // Plugin metadata
  name: string;
  version: string;
  description: string;
  author?: string;

  // Lifecycle methods with context
  install(context: PluginContext): Promise<void>;
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;

  // Integration points
  registerStores?(context: PluginContext): Record<string, any>;
  registerRoutes?(context: PluginContext): RouteConfig[];
  registerComponents?(context: PluginContext): ComponentConfig[];

  // Event listeners this plugin provides
  getEventListeners?(): EventListenerConfig[];
}

export interface PluginManifest {
  plugins: PluginConfig[];
}

export interface PluginConfig {
  name: string;
  pluginClass: new() => Plugin;
  autoLoad?: boolean;
  enabled?: boolean;
  dependencies?: string[];
}