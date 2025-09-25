/**
 * @fileoverview User Management API Endpoints
 *
 * Centralized endpoint definitions for user management operations
 */

export const USER_MANAGEMENT_ENDPOINTS = {
  // User operations
  GET_USERS: '/api/tenants/:tenantId/users',
  GET_USER_BY_ID: '/api/users/:id',
  UPDATE_USER_PROFILE: '/api/users/:id/profile',
  UPDATE_USER_PREFERENCES: '/api/users/:id/preferences',
  GET_USER_PREFERENCES: '/api/users/:id/preferences',

} as const;

export type UserManagementEndpoint = typeof USER_MANAGEMENT_ENDPOINTS[keyof typeof USER_MANAGEMENT_ENDPOINTS];