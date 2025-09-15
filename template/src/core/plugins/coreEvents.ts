/**
 * @fileoverview Core event types for the plugin system
 *
 * Defines standard events that the core framework emits
 * and that plugins can listen to or emit themselves
 */

// Authentication Events
export const AUTH_EVENTS = {
  USER_LOGIN: 'auth.user.login',
  USER_LOGOUT: 'auth.user.logout',
  USER_PROFILE_UPDATE: 'auth.user.profile.update',
  TOKEN_REFRESH: 'auth.token.refresh',
  SESSION_EXPIRED: 'auth.session.expired',
} as const;

// Tenant/Workspace Events
export const TENANT_EVENTS = {
  TENANT_SWITCHED: 'tenant.switched',
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  WORKSPACE_SWITCHED: 'workspace.switched',
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
} as const;

// Data Events
export const DATA_EVENTS = {
  PROJECT_CREATE: 'data.project.create',
  PROJECT_UPDATE: 'data.project.update',
  PROJECT_DELETE: 'data.project.delete',
  DATA_REFRESH: 'data.refresh',
  DATA_SYNC: 'data.sync',
} as const;

// UI Events
export const UI_EVENTS = {
  NAVIGATION_CHANGE: 'ui.navigation.change',
  MODAL_OPEN: 'ui.modal.open',
  MODAL_CLOSE: 'ui.modal.close',
  SIDEBAR_TOGGLE: 'ui.sidebar.toggle',
  THEME_CHANGE: 'ui.theme.change',
  NOTIFICATION_SHOW: 'ui.notification.show',
} as const;

// Plugin Lifecycle Events
export const PLUGIN_EVENTS = {
  PLUGIN_LOADED: 'plugin.loaded',
  PLUGIN_INSTALLED: 'plugin.installed',
  PLUGIN_ACTIVATED: 'plugin.activated',
  PLUGIN_DEACTIVATED: 'plugin.deactivated',
  PLUGIN_ERROR: 'plugin.error',
} as const;

// System Events
export const SYSTEM_EVENTS = {
  APP_INIT: 'system.app.init',
  APP_READY: 'system.app.ready',
  CORE_READY: 'system.core.ready',
  ROUTE_CHANGE: 'system.route.change',
  ERROR_BOUNDARY: 'system.error.boundary',
  PERFORMANCE_METRIC: 'system.performance.metric',
} as const;

// All core events combined
export const CORE_EVENTS = {
  ...AUTH_EVENTS,
  ...TENANT_EVENTS,
  ...DATA_EVENTS,
  ...UI_EVENTS,
  ...PLUGIN_EVENTS,
  ...SYSTEM_EVENTS,
} as const;

// Event payload type definitions
export interface AuthLoginPayload {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
  tenants?: Array<{ id: string; name: string; }>;
}

export interface AuthLogoutPayload {
  user: {
    id: string;
    email: string;
    name: string;
  };
  reason: 'user_action' | 'session_expired' | 'token_refresh_failed' | 'system';
}

export interface TenantSwitchPayload {
  oldTenant?: { id: string; name: string; } | null;
  newTenant?: { id: string; name: string; } | null;
  oldTenantId?: string;
  newTenantId?: string;
}

export interface WorkspaceSwitchPayload {
  oldWorkspaceId?: string;
  newWorkspaceId: string;
  oldWorkspace?: { id: string; name: string; } | null;
  newWorkspace: { id: string; name: string; };
}

export interface DataCreatePayload {
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  workspaceId?: string;
  tenantId?: string;
}

export interface DataUpdatePayload extends DataCreatePayload {
  changes: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}

export interface DataDeletePayload {
  entityType: string;
  entityId: string;
  workspaceId?: string;
  tenantId?: string;
}

export interface NavigationPayload {
  from: string;
  to: string;
  params?: Record<string, unknown>;
}

export interface NotificationPayload {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface PluginLifecyclePayload {
  pluginName: string;
  pluginVersion: string;
  error?: string;
}

// Type helpers for event payloads
export type CoreEventPayload<T extends keyof typeof CORE_EVENTS> =
  T extends keyof typeof AUTH_EVENTS ? AuthLoginPayload :
  T extends keyof typeof TENANT_EVENTS ? TenantSwitchPayload | WorkspaceSwitchPayload :
  T extends keyof typeof DATA_EVENTS ? DataCreatePayload | DataUpdatePayload | DataDeletePayload :
  T extends keyof typeof UI_EVENTS ? NavigationPayload | NotificationPayload :
  T extends keyof typeof PLUGIN_EVENTS ? PluginLifecyclePayload :
  Record<string, unknown>;