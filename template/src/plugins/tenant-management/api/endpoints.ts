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

  // Settings operations
  UPDATE_SETTINGS: '/tenants/:tenantId/settings',

  // Member operations
  GET_MEMBERS: '/tenants/:tenantId/members',
  INVITE_MEMBER: '/tenants/:tenantId/members/invite',
  REMOVE_MEMBER: '/tenants/:tenantId/members/:userId',
  UPDATE_MEMBER_ROLE: '/tenants/:tenantId/members/:userId',


  // User tenant operations
  GET_USER_TENANTS: '/users/:userId/tenants',

  // Workspace permissions
  UPDATE_MEMBER_WORKSPACE_PERMISSIONS: '/tenants/:tenantId/members/:userId/workspace-permissions',
} as const;

export type TenantEndpoint = typeof TENANT_ENDPOINTS[keyof typeof TENANT_ENDPOINTS];