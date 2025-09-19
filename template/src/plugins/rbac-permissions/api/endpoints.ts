/**
 * @fileoverview RBAC & Permissions API Endpoints
 *
 * Centralized endpoint definitions for RBAC operations
 */

export const RBAC_ENDPOINTS = {
  // Permission operations
  PERMISSIONS: '/permissions',
  USER_PERMISSIONS: '/permissions/user',
  CHECK_PERMISSION: '/permissions/check',
  CHECK_BULK_PERMISSIONS: '/permissions/check-bulk',

  // Role operations
  ROLES: '/roles',
  ROLE_BY_ID: '/roles/:roleId',

  // User role operations
  USER_ROLES: '/users/roles',
  ASSIGN_USER_ROLES: '/users/:userId/roles',
  REMOVE_USER_ROLE: '/users/:userId/roles/:roleId',

  // Role templates
  ROLE_TEMPLATES: '/role-templates',

  // RBAC management
  RBAC_EXPORT: '/rbac/export',
  RBAC_IMPORT: '/rbac/import',
} as const;

export type RBACEndpoint = typeof RBAC_ENDPOINTS[keyof typeof RBAC_ENDPOINTS];