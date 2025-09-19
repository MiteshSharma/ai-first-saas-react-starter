/**
 * @fileoverview Workspace Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for workspace management operations
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { WORKSPACE_ENDPOINTS } from './endpoints';
import {
  Workspace,
  WorkspaceSettings,
  WorkspaceMember,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest
} from '../../../core/types';
import {
  WorkspaceWithMembers,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  InviteWorkspaceMemberPayload,
  WorkspaceListFilter,
  WorkspaceInvitation,
  WorkspaceActivity,
  WorkspaceStats
} from '../types';

// Dynamic import for mock handlers to avoid circular dependencies
let WorkspaceMockHandlers: any = null;
const isMockMode = () => process.env.REACT_APP_USE_MOCK_API === 'true';

const getMockHandlers = async () => {
  if (!WorkspaceMockHandlers) {
    const module = await import('./mockHandlers');
    WorkspaceMockHandlers = module.default;
  }
  return WorkspaceMockHandlers;
};

/**
 * Backend helper for workspace API calls
 */
export class WorkspaceBackendHelper {
  /**
   * Get workspaces for a tenant
   */
  static async list(tenantId: string, filter?: WorkspaceListFilter): Promise<WorkspaceWithMembers[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.list(tenantId, filter);
    }

    try {
      const params = new URLSearchParams();
      if (filter?.status) {
        filter.status.forEach(status => params.append('status', status));
      }
      if (filter?.type) {
        filter.type.forEach(type => params.append('type', type));
      }
      if (filter?.search) {
        params.append('search', filter.search);
      }
      if (filter?.sortBy) {
        params.append('sortBy', filter.sortBy);
      }
      if (filter?.sortOrder) {
        params.append('sortOrder', filter.sortOrder);
      }

      const queryString = params.toString();
      const url = WORKSPACE_ENDPOINTS.LIST.replace(':tenantId', tenantId);
      const finalUrl = `${url}${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelper.get(finalUrl);
      return response.data as WorkspaceWithMembers[];
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      throw new Error('Failed to fetch workspaces');
    }
  }

  /**
   * Get a specific workspace
   */
  static async get(workspaceId: string): Promise<WorkspaceWithMembers> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      const workspace = await mockHandlers.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      return workspace;
    }

    try {
      const url = WORKSPACE_ENDPOINTS.GET.replace(':workspaceId', workspaceId);
      const response = await apiHelper.get(url);
      return response.data as WorkspaceWithMembers;
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      throw new Error('Failed to fetch workspace');
    }
  }

  /**
   * Create a new workspace
   */
  static async create(tenantId: string, data: CreateWorkspacePayload): Promise<Workspace> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.create(tenantId, data);
    }

    try {
      const payload: CreateWorkspaceRequest = {
        name: data.name,
        type: data.type,
        settings: data.settings
      };

      const url = WORKSPACE_ENDPOINTS.CREATE.replace(':tenantId', tenantId);
      const response = await apiHelper.post(url, payload);
      return response.data as Workspace;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw new Error('Failed to create workspace');
    }
  }

  /**
   * Update a workspace
   */
  static async update(workspaceId: string, data: UpdateWorkspacePayload): Promise<Workspace> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      const workspace = await mockHandlers.update(workspaceId, data);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      return workspace;
    }

    try {
      const payload: UpdateWorkspaceRequest = {
        name: data.name,
        status: data.status,
        settings: data.settings
      };

      const url = WORKSPACE_ENDPOINTS.UPDATE.replace(':workspaceId', workspaceId);
      const response = await apiHelper.put(url, payload);
      return response.data as Workspace;
    } catch (error) {
      console.error('Failed to update workspace:', error);
      throw new Error('Failed to update workspace');
    }
  }

  /**
   * Update workspace settings
   */
  static async updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateSettings(workspaceId, settings);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.UPDATE_SETTINGS.replace(':workspaceId', workspaceId);
      await apiHelper.put(url, settings);
    } catch (error) {
      console.error('Failed to update workspace settings:', error);
      throw new Error('Failed to update workspace settings');
    }
  }

  /**
   * Archive a workspace
   */
  static async archive(workspaceId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.archive(workspaceId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.ARCHIVE.replace(':workspaceId', workspaceId);
      await apiHelper.put(url);
    } catch (error) {
      console.error('Failed to archive workspace:', error);
      throw new Error('Failed to archive workspace');
    }
  }

  /**
   * Delete a workspace
   */
  static async delete(workspaceId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.delete(workspaceId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.DELETE.replace(':workspaceId', workspaceId);
      await apiHelper.delete(url);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw new Error('Failed to delete workspace');
    }
  }

  /**
   * Get workspace members
   */
  static async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getMembersMock(workspaceId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.GET_MEMBERS.replace(':workspaceId', workspaceId);
      const response = await apiHelper.get(url);
      return response.data as WorkspaceMember[];
    } catch (error) {
      console.error('Failed to fetch workspace members:', error);
      throw new Error('Failed to fetch workspace members');
    }
  }

  /**
   * Invite member to workspace
   */
  static async inviteMember(workspaceId: string, data: InviteWorkspaceMemberPayload): Promise<WorkspaceInvitation> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.inviteMemberMock(workspaceId, data);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.INVITE_MEMBER.replace(':workspaceId', workspaceId);
      const response = await apiHelper.post(url, data);
      return response.data as WorkspaceInvitation;
    } catch (error) {
      console.error('Failed to invite workspace member:', error);
      throw new Error('Failed to invite workspace member');
    }
  }

  /**
   * Remove member from workspace
   */
  static async removeMember(workspaceId: string, memberId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.removeMemberMock(workspaceId, memberId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.REMOVE_MEMBER
        .replace(':workspaceId', workspaceId)
        .replace(':memberId', memberId);
      await apiHelper.delete(url);
    } catch (error) {
      console.error('Failed to remove workspace member:', error);
      throw new Error('Failed to remove workspace member');
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(workspaceId: string, memberId: string, role: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateMemberRoleMock(workspaceId, memberId, role);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.UPDATE_MEMBER_ROLE
        .replace(':workspaceId', workspaceId)
        .replace(':memberId', memberId);
      await apiHelper.put(url, { role });
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw new Error('Failed to update member role');
    }
  }

  /**
   * Get workspace invitations
   */
  static async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getInvitationsMock(workspaceId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.GET_INVITATIONS.replace(':workspaceId', workspaceId);
      const response = await apiHelper.get(url);
      return response.data as WorkspaceInvitation[];
    } catch (error) {
      console.error('Failed to fetch workspace invitations:', error);
      throw new Error('Failed to fetch workspace invitations');
    }
  }

  /**
   * Cancel workspace invitation
   */
  static async cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.cancelInvitationMock(workspaceId, invitationId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.CANCEL_INVITATION
        .replace(':workspaceId', workspaceId)
        .replace(':invitationId', invitationId);
      await apiHelper.delete(url);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      throw new Error('Failed to cancel invitation');
    }
  }

  /**
   * Get workspace activity
   */
  static async getActivity(workspaceId: string, limit = 50): Promise<WorkspaceActivity[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getActivityMock(workspaceId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.GET_ACTIVITY.replace(':workspaceId', workspaceId);
      const response = await apiHelper.get(`${url}?limit=${limit}`);
      return response.data as WorkspaceActivity[];
    } catch (error) {
      console.error('Failed to fetch workspace activity:', error);
      throw new Error('Failed to fetch workspace activity');
    }
  }

  /**
   * Get workspace statistics
   */
  static async getStats(workspaceId: string): Promise<WorkspaceStats> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getStatsMock(workspaceId);
    }

    try {
      const url = WORKSPACE_ENDPOINTS.GET_STATS.replace(':workspaceId', workspaceId);
      const response = await apiHelper.get(url);
      return response.data as WorkspaceStats;
    } catch (error) {
      console.error('Failed to fetch workspace stats:', error);
      throw new Error('Failed to fetch workspace stats');
    }
  }

  /**
   * Switch workspace context
   */
  static async switchContext(workspaceId: string): Promise<{ workspace: Workspace; members: WorkspaceMember[] }> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.switchContextMock(workspaceId);
    }

    try {
      const response = await apiHelper.post(WORKSPACE_ENDPOINTS.SWITCH_CONTEXT, { workspaceId });
      return response.data as { workspace: Workspace; members: WorkspaceMember[] };
    } catch (error) {
      console.error('Failed to switch workspace context:', error);
      throw new Error('Failed to switch workspace context');
    }
  }
}

export default WorkspaceBackendHelper;