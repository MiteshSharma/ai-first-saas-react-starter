/**
 * @fileoverview Workspace Service
 *
 * Service for workspace-related API operations
 */

import { WorkspaceBackendHelper } from '../api/backendHelper';
import {
  Workspace,
  WorkspaceSettings
} from '../../../core/types';
import {
  WorkspaceListFilter,
  WorkspaceWithMembers,
  CreateWorkspacePayload,
  UpdateWorkspacePayload
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

}

export default WorkspaceService;