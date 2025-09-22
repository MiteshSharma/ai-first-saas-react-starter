/**
 * @fileoverview Centralized Event Constants
 *
 * All event strings used throughout the application should be defined here
 * to maintain consistency and prevent typos.
 */

// ============================================================================
// CORE SYSTEM EVENTS
// ============================================================================

/**
 * Core system events for context and authentication
 */
export const CORE_SYSTEM_EVENTS = {
  // Context management events
  CONTEXT_CHANGED: 'context:changed',
  TENANT_SWITCHED: 'tenant:switched',
  WORKSPACE_SWITCHED: 'workspace:switched',
  USER_UPDATED: 'user:updated',

  // Authentication events
  AUTH_SUCCESS: 'auth:success',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
} as const;

/**
 * Core application lifecycle events
 */
export const CORE_APP_EVENTS = {
  APP_INITIALIZED: 'core.app.initialized',
  USER_LOGGED_IN: 'core.user.logged_in',
  USER_LOGGED_OUT: 'core.user.logged_out',
  USER_UPDATED: 'core.user.updated',

  // Plugin lifecycle events
  PLUGIN_LOADED: 'core.plugin.loaded',
  PLUGIN_ERROR: 'core.plugin.error',
  PLUGIN_UNLOADED: 'core.plugin.unloaded',
} as const;

// ============================================================================
// PLUGIN EVENTS
// ============================================================================

/**
 * Tenant management plugin events
 */
export const TENANT_PLUGIN_EVENTS = {
  // Plugin lifecycle
  PLUGIN_INITIALIZED: 'tenant.plugin.initialized',

  // Tenant operations
  TENANT_SWITCHED: 'tenant.switched',
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_DELETED: 'tenant.deleted',

  // User operations within tenant
  USER_INVITED: 'tenant.user.invited',
  USER_REMOVED: 'tenant.user.removed',
  USER_ROLE_UPDATED: 'tenant.user.role.updated',
} as const;

/**
 * User management plugin events
 */
export const USER_PLUGIN_EVENTS = {
  // User operations
  USER_INVITED: 'user.invited',
  USER_UPDATED: 'user.updated',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_PREFERENCES_UPDATED: 'user.preferences.updated',
  USER_SECURITY_UPDATED: 'user.security.updated',

  // Avatar operations
  AVATAR_UPLOADED: 'user.avatar.uploaded',

  // Invitation operations
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
  INVITATION_CANCELLED: 'invitation.cancelled',
} as const;

/**
 * Workspace management plugin events
 */
export const WORKSPACE_PLUGIN_EVENTS = {
  // Plugin lifecycle
  PLUGIN_INITIALIZED: 'workspace.plugin.initialized',

  // Workspace operations
  WORKSPACE_SWITCHED: 'WORKSPACE_SWITCHED', // Keep existing format for compatibility
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',

  // Workspace member operations
  MEMBER_INVITED: 'workspace.member.invited',
  MEMBER_REMOVED: 'workspace.member.removed',
  MEMBER_ROLE_UPDATED: 'workspace.member.role.updated',
} as const;

/**
 * Audit logging plugin events
 */
export const AUDIT_PLUGIN_EVENTS = {
  // Plugin lifecycle
  PLUGIN_INITIALIZED: 'audit.plugin.initialized',

  // Audit operations
  LOG_CREATED: 'audit.log.created',
  LOG_VIEWED: 'audit.log.viewed',
  FILTERS_CHANGED: 'audit.filters.changed',

  // Generic audit event
  AUDIT_EVENT: 'audit.event',
} as const;

// ============================================================================
// AUDIT ACTION EVENTS
// ============================================================================

/**
 * Audit action constants for tracking user actions
 */
export const AUDIT_ACTIONS = {
  // User actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_AVATAR_UPLOADED: 'user.avatar.uploaded',
  USER_PREFERENCES_UPDATED: 'user.preferences.updated',
  USER_SECURITY_UPDATED: 'user.security.updated',
  USER_2FA_ENABLED: 'user.2fa.enabled',
  USER_2FA_DISABLED: 'user.2fa.disabled',
  USER_DEACTIVATED: 'user.deactivated',
  USER_REACTIVATED: 'user.reactivated',
  USER_REMOVED: 'user.removed',
  USER_ROLE_UPDATED: 'user.role.updated',

  // Invitation actions
  INVITATION_SENT: 'invitation.sent',
  INVITATION_CANCELLED: 'invitation.cancelled',
  INVITATION_RESENT: 'invitation.resent',
  INVITATION_ACCEPTED: 'invitation.accepted',

  // Data fetching actions
  USERS_FETCHED: 'users.fetched',
  INVITATIONS_FETCHED: 'invitations.fetched',
} as const;

// ============================================================================
// TEST EVENTS
// ============================================================================

/**
 * Events used in testing
 */
export const TEST_EVENTS = {
  TEST_EVENT: 'test.event',
  PERFORMANCE_TEST: 'performance.test',
  EVENTBUS_ERROR: 'eventbus.error',

  // Plugin activation events for tests
  USER_MANAGEMENT_ACTIVATED: 'plugin.userManagement.activated',
  TENANT_MANAGEMENT_ACTIVATED: 'plugin.tenantManagement.activated',
} as const;

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

/**
 * All events combined for easy access
 */
export const ALL_EVENTS = {
  ...CORE_SYSTEM_EVENTS,
  ...CORE_APP_EVENTS,
  ...TENANT_PLUGIN_EVENTS,
  ...USER_PLUGIN_EVENTS,
  ...WORKSPACE_PLUGIN_EVENTS,
  ...AUDIT_PLUGIN_EVENTS,
  ...AUDIT_ACTIONS,
  ...TEST_EVENTS,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CoreSystemEventType = typeof CORE_SYSTEM_EVENTS[keyof typeof CORE_SYSTEM_EVENTS];
export type CoreAppEventType = typeof CORE_APP_EVENTS[keyof typeof CORE_APP_EVENTS];
export type TenantPluginEventType = typeof TENANT_PLUGIN_EVENTS[keyof typeof TENANT_PLUGIN_EVENTS];
export type UserPluginEventType = typeof USER_PLUGIN_EVENTS[keyof typeof USER_PLUGIN_EVENTS];
export type WorkspacePluginEventType = typeof WORKSPACE_PLUGIN_EVENTS[keyof typeof WORKSPACE_PLUGIN_EVENTS];
export type AuditPluginEventType = typeof AUDIT_PLUGIN_EVENTS[keyof typeof AUDIT_PLUGIN_EVENTS];
export type AuditActionType = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
export type TestEventType = typeof TEST_EVENTS[keyof typeof TEST_EVENTS];

export type AllEventType = typeof ALL_EVENTS[keyof typeof ALL_EVENTS];

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Re-export existing constants for backward compatibility
 * These will be gradually phased out in favor of the new structure
 */

// Core events (from core/plugin-system/types.ts)
export const CORE_EVENTS = {
  APP_INITIALIZED: CORE_APP_EVENTS.APP_INITIALIZED,
  PLUGIN_LOADED: CORE_APP_EVENTS.PLUGIN_LOADED,
  PLUGIN_ERROR: CORE_APP_EVENTS.PLUGIN_ERROR,
  PLUGIN_UNLOADED: CORE_APP_EVENTS.PLUGIN_UNLOADED,
  USER_LOGGED_IN: CORE_APP_EVENTS.USER_LOGGED_IN,
  USER_LOGGED_OUT: CORE_APP_EVENTS.USER_LOGGED_OUT,
  USER_UPDATED: CORE_APP_EVENTS.USER_UPDATED,
} as const;

// Tenant events (from plugins/tenant-management/types.ts)
export const TENANT_EVENTS = {
  TENANT_SWITCHED: TENANT_PLUGIN_EVENTS.TENANT_SWITCHED,
  TENANT_CREATED: TENANT_PLUGIN_EVENTS.TENANT_CREATED,
  TENANT_UPDATED: TENANT_PLUGIN_EVENTS.TENANT_UPDATED,
  TENANT_DELETED: TENANT_PLUGIN_EVENTS.TENANT_DELETED,
  USER_INVITED: TENANT_PLUGIN_EVENTS.USER_INVITED,
  USER_REMOVED: TENANT_PLUGIN_EVENTS.USER_REMOVED,
  USER_ROLE_UPDATED: TENANT_PLUGIN_EVENTS.USER_ROLE_UPDATED,
} as const;

// User management events (from plugins/user-management/types.ts)
export const USER_MANAGEMENT_EVENTS = {
  USER_INVITED: USER_PLUGIN_EVENTS.USER_INVITED,
  USER_UPDATED: USER_PLUGIN_EVENTS.USER_UPDATED,
  USER_PROFILE_UPDATED: USER_PLUGIN_EVENTS.USER_PROFILE_UPDATED,
  USER_PREFERENCES_UPDATED: USER_PLUGIN_EVENTS.USER_PREFERENCES_UPDATED,
  USER_SECURITY_UPDATED: USER_PLUGIN_EVENTS.USER_SECURITY_UPDATED,
  AVATAR_UPLOADED: USER_PLUGIN_EVENTS.AVATAR_UPLOADED,
  INVITATION_SENT: USER_PLUGIN_EVENTS.INVITATION_SENT,
  INVITATION_ACCEPTED: USER_PLUGIN_EVENTS.INVITATION_ACCEPTED,
  INVITATION_CANCELLED: USER_PLUGIN_EVENTS.INVITATION_CANCELLED,
} as const;

// Audit events (from plugins/audit-logging/types.ts)
export const AUDIT_EVENTS = {
  LOG_CREATED: AUDIT_PLUGIN_EVENTS.LOG_CREATED,
  LOG_VIEWED: AUDIT_PLUGIN_EVENTS.LOG_VIEWED,
  FILTERS_CHANGED: AUDIT_PLUGIN_EVENTS.FILTERS_CHANGED,
} as const;

// Auth events for tests
export const AUTH_EVENTS = {
  USER_LOGIN: CORE_SYSTEM_EVENTS.AUTH_LOGIN,
} as const;