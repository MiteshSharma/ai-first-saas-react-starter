/**
 * @fileoverview Plugin System Exports (Plan 3)
 *
 * Main exports for the simplified plugin system
 */

// Core plugin system
export { PluginManager, pluginManager } from './PluginManager';
export { EventBus, eventBus } from './EventBus';

// Types and interfaces
export type {
  Plugin,
  PluginContext,
  AuthContext,
  User,
  WidgetRegistration,
  RouteRegistration,
  IPluginManager,
  CoreEventType
} from './types';

export { CORE_EVENTS } from './types';