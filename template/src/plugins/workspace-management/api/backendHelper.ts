/**
 * @fileoverview Workspace Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for workspace management operations
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { WORKSPACE_ENDPOINTS } from './endpoints';
import {
  Workspace,
  WorkspaceSettings
} from '../../../core/types';
import {
  WorkspaceWithMembers,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceListFilter
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
      const url = WORKSPACE_ENDPOINTS.CREATE.replace(':tenantId', tenantId);
      const response = await apiHelper.post(url, data);
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
      const url = WORKSPACE_ENDPOINTS.UPDATE.replace(':workspaceId', workspaceId);
      const response = await apiHelper.put(url, data);
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

}

export default WorkspaceBackendHelper;