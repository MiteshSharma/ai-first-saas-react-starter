/**
 * @fileoverview Centralized API endpoint definitions with template placeholders
 * 
 * This file serves as the single source of truth for all API endpoints.
 * All endpoints use template placeholders that get expanded by backendHelper.
 * 
 * Template Format: "/users/{user-id}/profile"
 * Expanded Format: "/users/123/profile"
 */

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

export const AUTH_LOGIN = '/auth/login';
export const AUTH_REGISTER = '/auth/register';
export const AUTH_LOGOUT = '/auth/logout';
export const AUTH_REFRESH = '/auth/refresh';
export const AUTH_SIGNUP_WITH_EMAIL = '/auth/signup/email';
export const AUTH_SIGNUP_RESEND = '/auth/signup/resend';
export const AUTH_SIGNUP_COMPLETE = '/auth/signup/complete';
export const AUTH_PASSWORD_RESET_REQUEST = '/auth/password-reset/request';
export const AUTH_PASSWORD_RESET_COMPLETE = '/auth/password-reset/complete';
export const AUTH_VERIFY_EMAIL = '/auth/verify-email';
export const AUTH_SSO_CALLBACK = '/auth/sso/callback';

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

export const USERS_LIST = '/users';
export const USER_PROFILE = '/users/{user-id}';
export const USER_PREFERENCES = '/users/{user-id}/preferences';
export const USER_AVATAR = '/users/{user-id}/avatar';
export const USER_SESSIONS = '/users/{user-id}/sessions';
export const USER_API_KEYS = '/users/{user-id}/api-keys';
export const USER_NOTIFICATIONS = '/users/{user-id}/notifications';

// ==========================================
// TENANT MANAGEMENT ENDPOINTS
// ==========================================

export const TENANTS_LIST = '/tenants';
export const TENANT_DETAILS = '/tenants/{tenant-id}';
export const TENANT_CREATE = '/tenants';
export const TENANT_UPDATE = '/tenants/{tenant-id}';
export const TENANT_DELETE = '/tenants/{tenant-id}';
export const TENANT_SETTINGS = '/tenants/{tenant-id}/settings';
export const TENANT_PLAN = '/tenants/{tenant-id}/plan';
export const TENANT_BILLING = '/tenants/{tenant-id}/billing';
export const TENANT_USAGE = '/tenants/{tenant-id}/usage';

// ==========================================
// TENANT MEMBER MANAGEMENT
// ==========================================

export const TENANT_MEMBERS = '/tenants/{tenant-id}/members';
export const TENANT_MEMBER = '/tenant-members/{member-id}';
export const TENANT_MEMBER_UPDATE = '/tenant-members/{member-id}';
export const TENANT_MEMBER_REMOVE = '/tenant-members/{member-id}';

// ==========================================
// TENANT INVITE MANAGEMENT
// ==========================================

export const TENANT_INVITES = '/tenants/{tenant-id}/invites';
export const TENANT_INVITE = '/tenant-invites/{invite-id}';
export const TENANT_INVITE_RESEND = '/tenant-invites/{invite-id}/resend';
export const TENANT_INVITE_REVOKE = '/tenant-invites/{invite-id}';
export const TENANT_INVITE_ACCEPT = '/tenant-invites/{invite-id}/accept';

// ==========================================
// WORKSPACE MANAGEMENT ENDPOINTS
// ==========================================

export const WORKSPACES_LIST = '/tenants/{tenant-id}/workspaces';
export const WORKSPACE_DETAILS = '/workspaces/{workspace-id}';
export const WORKSPACE_CREATE = '/tenants/{tenant-id}/workspaces';
export const WORKSPACE_UPDATE = '/workspaces/{workspace-id}';
export const WORKSPACE_DELETE = '/workspaces/{workspace-id}';
export const WORKSPACE_SETTINGS = '/workspaces/{workspace-id}/settings';
export const WORKSPACE_MEMBERS = '/workspaces/{workspace-id}/members';

// ==========================================
// PROJECT ENDPOINTS
// ==========================================

export const PROJECTS_LIST = '/workspaces/{workspace-id}/projects';
export const PROJECT_DETAILS = '/projects/{project-id}';
export const PROJECT_CREATE = '/workspaces/{workspace-id}/projects';
export const PROJECT_UPDATE = '/projects/{project-id}';
export const PROJECT_DELETE = '/projects/{project-id}';
export const PROJECT_SEARCH = '/workspaces/{workspace-id}/projects/search';
export const PROJECT_MEMBERS = '/projects/{project-id}/members';
export const PROJECT_MEMBER_ADD = '/projects/{project-id}/members';
export const PROJECT_MEMBER_UPDATE = '/project-members/{member-id}';
export const PROJECT_MEMBER_REMOVE = '/project-members/{member-id}';

// ==========================================
// DATA SOURCE ENDPOINTS
// ==========================================

export const DATA_SOURCES_LIST = '/workspaces/{workspace-id}/data-sources';
export const DATA_SOURCE_DETAILS = '/data-sources/{data-source-id}';
export const DATA_SOURCE_CREATE = '/workspaces/{workspace-id}/data-sources';
export const DATA_SOURCE_UPDATE = '/data-sources/{data-source-id}';
export const DATA_SOURCE_DELETE = '/data-sources/{data-source-id}';
export const DATA_SOURCE_TEST = '/data-sources/{data-source-id}/test';
export const DATA_SOURCE_SCHEMA = '/data-sources/{data-source-id}/schema';
export const DATA_SOURCE_QUERY = '/data-sources/{data-source-id}/query';

// ==========================================
// CHART ENDPOINTS
// ==========================================

export const CHARTS_LIST = '/workspaces/{workspace-id}/charts';
export const CHART_DETAILS = '/charts/{chart-id}';
export const CHART_CREATE = '/workspaces/{workspace-id}/charts';
export const CHART_UPDATE = '/charts/{chart-id}';
export const CHART_DELETE = '/charts/{chart-id}';
export const CHART_DUPLICATE = '/charts/{chart-id}/duplicate';
export const CHART_SHARE = '/charts/{chart-id}/share';
export const CHART_EXPORT = '/charts/{chart-id}/export';
export const CHART_DATA = '/charts/{chart-id}/data';

// ==========================================
// PIPELINE ENDPOINTS
// ==========================================

export const PIPELINES_LIST = '/workspaces/{workspace-id}/pipelines';
export const PIPELINE_DETAILS = '/pipelines/{pipeline-id}';
export const PIPELINE_CREATE = '/workspaces/{workspace-id}/pipelines';
export const PIPELINE_UPDATE = '/pipelines/{pipeline-id}';
export const PIPELINE_DELETE = '/pipelines/{pipeline-id}';
export const PIPELINE_EXECUTE = '/pipelines/{pipeline-id}/execute';
export const PIPELINE_SCHEDULE = '/pipelines/{pipeline-id}/schedule';
export const PIPELINE_LOGS = '/pipelines/{pipeline-id}/logs';
export const PIPELINE_STATUS = '/pipelines/{pipeline-id}/status';

// ==========================================
// DASHBOARD ENDPOINTS
// ==========================================

export const DASHBOARDS_LIST = '/workspaces/{workspace-id}/dashboards';
export const DASHBOARD_DETAILS = '/dashboards/{dashboard-id}';
export const DASHBOARD_CREATE = '/workspaces/{workspace-id}/dashboards';
export const DASHBOARD_UPDATE = '/dashboards/{dashboard-id}';
export const DASHBOARD_DELETE = '/dashboards/{dashboard-id}';
export const DASHBOARD_SHARE = '/dashboards/{dashboard-id}/share';

// ==========================================
// NOTIFICATION ENDPOINTS
// ==========================================

export const NOTIFICATIONS_LIST = '/users/{user-id}/notifications';
export const NOTIFICATION_MARK_READ = '/notifications/{notification-id}/read';
export const NOTIFICATION_MARK_ALL_READ = '/users/{user-id}/notifications/mark-all-read';
export const NOTIFICATION_PREFERENCES = '/users/{user-id}/notification-preferences';

// ==========================================
// INTEGRATION ENDPOINTS  
// ==========================================

export const INTEGRATIONS_LIST = '/tenants/{tenant-id}/integrations';
export const INTEGRATION_DETAILS = '/integrations/{integration-id}';
export const INTEGRATION_CREATE = '/tenants/{tenant-id}/integrations';
export const INTEGRATION_UPDATE = '/integrations/{integration-id}';
export const INTEGRATION_DELETE = '/integrations/{integration-id}';
export const INTEGRATION_TEST = '/integrations/{integration-id}/test';

// ==========================================
// FILE UPLOAD ENDPOINTS
// ==========================================

export const FILES_UPLOAD = '/files/upload';
export const FILES_LIST = '/workspaces/{workspace-id}/files';
export const FILE_DETAILS = '/files/{file-id}';
export const FILE_DOWNLOAD = '/files/{file-id}/download';
export const FILE_DELETE = '/files/{file-id}';

// ==========================================
// ANALYTICS ENDPOINTS
// ==========================================

export const ANALYTICS_OVERVIEW = '/tenants/{tenant-id}/analytics/overview';
export const ANALYTICS_USAGE = '/tenants/{tenant-id}/analytics/usage';
export const ANALYTICS_PERFORMANCE = '/workspaces/{workspace-id}/analytics/performance';
export const ANALYTICS_REPORTS = '/tenants/{tenant-id}/analytics/reports';

// ==========================================
// WEBHOOK ENDPOINTS
// ==========================================

export const WEBHOOKS_LIST = '/tenants/{tenant-id}/webhooks';
export const WEBHOOK_DETAILS = '/webhooks/{webhook-id}';
export const WEBHOOK_CREATE = '/tenants/{tenant-id}/webhooks';
export const WEBHOOK_UPDATE = '/webhooks/{webhook-id}';
export const WEBHOOK_DELETE = '/webhooks/{webhook-id}';
export const WEBHOOK_TEST = '/webhooks/{webhook-id}/test';

// ==========================================
// SYSTEM ENDPOINTS
// ==========================================

export const SYSTEM_HEALTH = '/system/health';
export const SYSTEM_STATUS = '/system/status';
export const SYSTEM_VERSION = '/system/version';

// ==========================================
// PRODUCT ENDPOINTS
// ==========================================

export const GET_PRODUCT_LIST = '/products';
export const GET_PRODUCT = '/products/{id}';
export const CREATE_PRODUCT = '/products';
export const UPDATE_PRODUCT = '/products/{id}';
export const DELETE_PRODUCT = '/products/{id}';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get all endpoint constants as an object for debugging/testing
 */
export const getAllEndpoints = () => ({
  // Auth
  AUTH_LOGIN,
  AUTH_REGISTER,
  AUTH_LOGOUT,
  AUTH_REFRESH,
  AUTH_SIGNUP_WITH_EMAIL,
  AUTH_SIGNUP_RESEND,
  AUTH_SIGNUP_COMPLETE,
  AUTH_PASSWORD_RESET_REQUEST,
  AUTH_PASSWORD_RESET_COMPLETE,
  AUTH_VERIFY_EMAIL,
  AUTH_SSO_CALLBACK,

  // Users
  USERS_LIST,
  USER_PROFILE,
  USER_PREFERENCES,
  USER_AVATAR,
  USER_SESSIONS,
  USER_API_KEYS,
  USER_NOTIFICATIONS,

  // Tenants
  TENANTS_LIST,
  TENANT_DETAILS,
  TENANT_CREATE,
  TENANT_UPDATE,
  TENANT_DELETE,
  TENANT_SETTINGS,
  TENANT_PLAN,
  TENANT_BILLING,
  TENANT_USAGE,

  // Tenant Members
  TENANT_MEMBERS,
  TENANT_MEMBER,
  TENANT_MEMBER_UPDATE,
  TENANT_MEMBER_REMOVE,

  // Tenant Invites
  TENANT_INVITES,
  TENANT_INVITE,
  TENANT_INVITE_RESEND,
  TENANT_INVITE_REVOKE,
  TENANT_INVITE_ACCEPT,

  // Workspaces
  WORKSPACES_LIST,
  WORKSPACE_DETAILS,
  WORKSPACE_CREATE,
  WORKSPACE_UPDATE,
  WORKSPACE_DELETE,
  WORKSPACE_SETTINGS,
  WORKSPACE_MEMBERS,

  // Projects
  PROJECTS_LIST,
  PROJECT_DETAILS,
  PROJECT_CREATE,
  PROJECT_UPDATE,
  PROJECT_DELETE,
  PROJECT_SEARCH,
  PROJECT_MEMBERS,
  PROJECT_MEMBER_ADD,
  PROJECT_MEMBER_UPDATE,
  PROJECT_MEMBER_REMOVE,

  // Data Sources
  DATA_SOURCES_LIST,
  DATA_SOURCE_DETAILS,
  DATA_SOURCE_CREATE,
  DATA_SOURCE_UPDATE,
  DATA_SOURCE_DELETE,
  DATA_SOURCE_TEST,
  DATA_SOURCE_SCHEMA,
  DATA_SOURCE_QUERY,

  // Charts
  CHARTS_LIST,
  CHART_DETAILS,
  CHART_CREATE,
  CHART_UPDATE,
  CHART_DELETE,
  CHART_DUPLICATE,
  CHART_SHARE,
  CHART_EXPORT,
  CHART_DATA,

  // Pipelines
  PIPELINES_LIST,
  PIPELINE_DETAILS,
  PIPELINE_CREATE,
  PIPELINE_UPDATE,
  PIPELINE_DELETE,
  PIPELINE_EXECUTE,
  PIPELINE_SCHEDULE,
  PIPELINE_LOGS,
  PIPELINE_STATUS,

  // Dashboards
  DASHBOARDS_LIST,
  DASHBOARD_DETAILS,
  DASHBOARD_CREATE,
  DASHBOARD_UPDATE,
  DASHBOARD_DELETE,
  DASHBOARD_SHARE,

  // Notifications
  NOTIFICATIONS_LIST,
  NOTIFICATION_MARK_READ,
  NOTIFICATION_MARK_ALL_READ,
  NOTIFICATION_PREFERENCES,

  // Integrations
  INTEGRATIONS_LIST,
  INTEGRATION_DETAILS,
  INTEGRATION_CREATE,
  INTEGRATION_UPDATE,
  INTEGRATION_DELETE,
  INTEGRATION_TEST,

  // Files
  FILES_UPLOAD,
  FILES_LIST,
  FILE_DETAILS,
  FILE_DOWNLOAD,
  FILE_DELETE,

  // Analytics
  ANALYTICS_OVERVIEW,
  ANALYTICS_USAGE,
  ANALYTICS_PERFORMANCE,
  ANALYTICS_REPORTS,

  // Webhooks
  WEBHOOKS_LIST,
  WEBHOOK_DETAILS,
  WEBHOOK_CREATE,
  WEBHOOK_UPDATE,
  WEBHOOK_DELETE,
  WEBHOOK_TEST,

  // System
  SYSTEM_HEALTH,
  SYSTEM_STATUS,
  SYSTEM_VERSION,
});

/**
 * Extract unique placeholder patterns from all endpoints
 */
export const getPlaceholderPatterns = (): string[] => {
  const endpoints = Object.values(getAllEndpoints());
  const placeholders = new Set<string>();
  
  endpoints.forEach(endpoint => {
    const matches = endpoint.match(/\{[^}]+\}/g);
    if (matches) {
      matches.forEach(match => placeholders.add(match));
    }
  });
  
  return Array.from(placeholders).sort();
};