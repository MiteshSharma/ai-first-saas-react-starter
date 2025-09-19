/**
 * @fileoverview Workspace Service
 *
 * Service for workspace-related API operations
 */

import { WorkspaceBackendHelper } from '../api/backendHelper';
import {
  Workspace,
  WorkspaceSettings,
  WorkspaceMember
} from '../../../core/types';
import {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  InviteWorkspaceMemberPayload,
  WorkspaceListFilter,
  WorkspaceInvitation,
  WorkspaceActivity,
  WorkspaceStats,
  WorkspaceWithMembers
} from '../types';

/**
 * Workspace Service
 * Handles all workspace-related API operations
 */
export class WorkspaceService {
  /**
   * Get workspaces for a tenant
   */
  static async list(tenantId: string, filter?: WorkspaceListFilter): Promise<WorkspaceWithMembers[]> {
    return WorkspaceBackendHelper.list(tenantId, filter);
  }

  /**
   * Get a specific workspace
   */
  static async get(workspaceId: string): Promise<WorkspaceWithMembers> {
    return WorkspaceBackendHelper.get(workspaceId);
  }

  /**
   * Create a new workspace
   */
  static async create(tenantId: string, data: CreateWorkspacePayload): Promise<Workspace> {
    return WorkspaceBackendHelper.create(tenantId, data);
  }

  /**
   * Update a workspace
   */
  static async update(workspaceId: string, data: UpdateWorkspacePayload): Promise<Workspace> {
    return WorkspaceBackendHelper.update(workspaceId, data);
  }

  /**
   * Update workspace settings
   */
  static async updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): Promise<void> {
    return WorkspaceBackendHelper.updateSettings(workspaceId, settings);
  }

  /**
   * Archive a workspace
   */
  static async archive(workspaceId: string): Promise<void> {
    return WorkspaceBackendHelper.archive(workspaceId);
  }

  /**
   * Delete a workspace
   */
  static async delete(workspaceId: string): Promise<void> {
    return WorkspaceBackendHelper.delete(workspaceId);
  }

  /**
   * Get workspace members
   */
  static async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return WorkspaceBackendHelper.getMembers(workspaceId);
  }

  /**
   * Invite member to workspace
   */
  static async inviteMember(workspaceId: string, data: InviteWorkspaceMemberPayload): Promise<WorkspaceInvitation> {
    return WorkspaceBackendHelper.inviteMember(workspaceId, data);
  }

  /**
   * Remove member from workspace
   */
  static async removeMember(workspaceId: string, memberId: string): Promise<void> {
    return WorkspaceBackendHelper.removeMember(workspaceId, memberId);
  }

  /**
   * Update member role
   */
  static async updateMemberRole(workspaceId: string, memberId: string, role: string): Promise<void> {
    return WorkspaceBackendHelper.updateMemberRole(workspaceId, memberId, role);
  }

  /**
   * Get workspace invitations
   */
  static async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    return WorkspaceBackendHelper.getInvitations(workspaceId);
  }

  /**
   * Cancel workspace invitation
   */
  static async cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
    return WorkspaceBackendHelper.cancelInvitation(workspaceId, invitationId);
  }

  /**
   * Get workspace activity
   */
  static async getActivity(workspaceId: string, limit = 50): Promise<WorkspaceActivity[]> {
    return WorkspaceBackendHelper.getActivity(workspaceId, limit);
  }

  /**
   * Get workspace statistics
   */
  static async getStats(workspaceId: string): Promise<WorkspaceStats> {
    return WorkspaceBackendHelper.getStats(workspaceId);
  }

  /**
   * Switch workspace context
   */
  static async switchContext(workspaceId: string): Promise<{ workspace: Workspace; members: WorkspaceMember[] }> {
    return WorkspaceBackendHelper.switchContext(workspaceId);
  }
}

export default WorkspaceService;