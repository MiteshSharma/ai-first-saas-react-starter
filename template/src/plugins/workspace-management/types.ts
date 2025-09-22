/**
 * @fileoverview Workspace Management Types
 *
 * Type definitions specific to workspace management functionality
 */

import {
  Workspace,
  WorkspaceSettings,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMember
} from '../../core/types';

// Re-export core types for convenience
export type {
  Workspace,
  WorkspaceSettings,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMember
};

/**
 * Extended workspace with computed properties
 */
export interface WorkspaceWithMembers extends Workspace {
  description?: string;
  visibility?: 'private' | 'tenant' | 'public';
  joinPolicy?: 'open' | 'request' | 'invite_only';
  memberCount?: number;
  isOwner?: boolean;
  canManage?: boolean;
}

/**
 * Workspace creation payload
 */
export interface CreateWorkspacePayload {
  name: string;
  type: 'project' | 'department' | 'team' | 'client';
  description?: string;
  settings?: Partial<WorkspaceSettings>;
}

/**
 * Workspace update payload
 */
export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  status?: 'active' | 'archived' | 'deleted';
  settings?: Partial<WorkspaceSettings>;
}

/**
 * Workspace invite payload
 */
export interface InviteWorkspaceMemberPayload {
  email: string;
  role: string;
  message?: string;
}

/**
 * Extended workspace member with additional properties
 */
export interface ExtendedWorkspaceMember extends WorkspaceMember {
  status?: 'active' | 'inactive' | 'suspended';
  invitedAt?: string;
  invitedBy?: string;
}

/**
 * Workspace member role
 */
export type WorkspaceRole = 'admin' | 'editor' | 'viewer';

/**
 * Workspace status options
 */
export type WorkspaceStatus = 'active' | 'archived' | 'deleted';

/**
 * Workspace type options
 */
export type WorkspaceType = 'project' | 'department' | 'team' | 'client';

/**
 * Workspace visibility options
 */
export type WorkspaceVisibility = 'private' | 'tenant' | 'public';

/**
 * Workspace join policy options
 */
export type WorkspaceJoinPolicy = 'open' | 'request' | 'invite_only';

/**
 * Workspace list filter
 */
export interface WorkspaceListFilter {
  status?: WorkspaceStatus[];
  type?: WorkspaceType[];
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'memberCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Workspace invitation
 */
export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token: string;
  message?: string;
}

/**
 * Workspace activity log entry
 */
export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  userId: string;
  userName?: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Workspace statistics
 */
export interface WorkspaceStats {
  workspaceId: string;
  memberCount: number;
  activeMembers: number;
  totalActivities: number;
  recentActivities: number;
  storageUsed: number;
  apiCallsUsed: number;
  lastActivity?: string;
}

/**
 * Workspace events
 */
export const WORKSPACE_EVENTS = {
  WORKSPACE_SWITCHED: 'workspace.switched',
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
} as const;