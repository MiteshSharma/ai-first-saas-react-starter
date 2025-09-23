/**
 * @fileoverview Tenant Management API Endpoints
 *
 * Centralized endpoint definitions for tenant operations
 */

export const TENANT_ENDPOINTS = {
  // Tenant operations
  LIST: '/tenants',
  GET: '/tenants/:tenantId',
  CREATE: '/tenants',
  UPDATE: '/tenants/:tenantId',
  DELETE: '/tenants/:tenantId',

  // Tenant context switching
  SWITCH: '/tenants/switch',

  // Settings operations
  UPDATE_SETTINGS: '/tenants/:tenantId/settings',

  // Member operations
  GET_MEMBERS: '/tenants/:tenantId/members',
  INVITE_MEMBER: '/tenants/:tenantId/members/invite',
  REMOVE_MEMBER: '/tenants/:tenantId/members/:userId',
  UPDATE_MEMBER_ROLE: '/tenants/:tenantId/members/:userId',

  // Workspace operations for tenant
  GET_WORKSPACES: '/tenants/:tenantId/workspaces',
  CREATE_WORKSPACE: '/tenants/:tenantId/workspaces',

  // User tenant operations
  GET_USER_TENANTS: '/users/:userId/tenants',

  // Workspace permissions
  UPDATE_MEMBER_WORKSPACE_PERMISSIONS: '/tenants/:tenantId/members/:userId/workspace-permissions',

  // Testing endpoints
  TEST_ISOLATION: '/test/tenant-isolation',
  GET_DATA_SOURCES: '/data-sources',
  GET_CHARTS: '/charts'
} as const;

export type TenantEndpoint = typeof TENANT_ENDPOINTS[keyof typeof TENANT_ENDPOINTS];