/**
 * @fileoverview Workspace Management API Endpoints
 *
 * Centralized endpoint definitions for workspace operations
 */

export const WORKSPACE_ENDPOINTS = {
  // Workspace operations
  LIST: '/tenants/:tenantId/workspaces',
  GET: '/workspaces/:workspaceId',
  CREATE: '/tenants/:tenantId/workspaces',
  UPDATE: '/workspaces/:workspaceId',
  DELETE: '/workspaces/:workspaceId',
  ARCHIVE: '/workspaces/:workspaceId/archive',

  // Settings operations
  UPDATE_SETTINGS: '/workspaces/:workspaceId/settings',

  // Member operations
  GET_MEMBERS: '/workspaces/:workspaceId/members',
  INVITE_MEMBER: '/workspaces/:workspaceId/invitations',
  REMOVE_MEMBER: '/workspaces/:workspaceId/members/:memberId',
  UPDATE_MEMBER_ROLE: '/workspaces/:workspaceId/members/:memberId/role',

  // Invitation operations
  GET_INVITATIONS: '/workspaces/:workspaceId/invitations',
  CANCEL_INVITATION: '/workspaces/:workspaceId/invitations/:invitationId',

  // Activity and stats
  GET_ACTIVITY: '/workspaces/:workspaceId/activity',
  GET_STATS: '/workspaces/:workspaceId/stats',

  // Context switching
  SWITCH_CONTEXT: '/workspaces/switch'
} as const;

export type WorkspaceEndpoint = typeof WORKSPACE_ENDPOINTS[keyof typeof WORKSPACE_ENDPOINTS];