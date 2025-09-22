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

  // Settings operations
  UPDATE_SETTINGS: '/workspaces/:workspaceId/settings',

  // Context switching
  SWITCH_CONTEXT: '/workspaces/switch'
} as const;

export type WorkspaceEndpoint = typeof WORKSPACE_ENDPOINTS[keyof typeof WORKSPACE_ENDPOINTS];