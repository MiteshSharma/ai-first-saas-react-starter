/**
 * @fileoverview User Management API Endpoints
 *
 * Centralized endpoint definitions for user management operations
 */

export const USER_MANAGEMENT_ENDPOINTS = {
  // Invitation operations
  SEND_INVITATIONS: '/api/tenants/:tenantId/invitations',
  GET_INVITATIONS: '/api/tenants/:tenantId/invitations',
  CANCEL_INVITATION: '/api/invitations/:id',
  RESEND_INVITATION: '/api/invitations/:id/resend',
  ACCEPT_INVITATION: '/api/invitations/accept',

  // User operations
  GET_USERS: '/api/tenants/:tenantId/users',
  GET_USER_BY_ID: '/api/users/:id',
  UPDATE_USER_PROFILE: '/api/users/:id/profile',
  UPLOAD_USER_AVATAR: '/api/users/:id/avatar',
  UPDATE_USER_PREFERENCES: '/api/users/:id/preferences',
  GET_USER_PREFERENCES: '/api/users/:id/preferences',

  // Security operations
  GET_SECURITY_SETTINGS: '/api/users/:id/security',
  UPDATE_SECURITY_SETTINGS: '/api/users/:id/security',
  ENABLE_TWO_FACTOR: '/api/users/:id/security/2fa/enable',
  DISABLE_TWO_FACTOR: '/api/users/:id/security/2fa/disable',
  GET_TRUSTED_DEVICES: '/api/users/:id/security/devices',
  REMOVE_TRUSTED_DEVICE: '/api/users/:id/security/devices/:deviceId',

  // User management operations
  UPDATE_USER_ROLE: '/api/tenants/:tenantId/users/:userId/role',
  DEACTIVATE_USER: '/api/tenants/:tenantId/users/:userId/deactivate',
  REACTIVATE_USER: '/api/tenants/:tenantId/users/:userId/reactivate',
  REMOVE_USER: '/api/tenants/:tenantId/users/:userId',
} as const;

export type UserManagementEndpoint = typeof USER_MANAGEMENT_ENDPOINTS[keyof typeof USER_MANAGEMENT_ENDPOINTS];