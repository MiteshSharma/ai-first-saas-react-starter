/**
 * @fileoverview Tenant Service
 *
 * Service layer for tenant-related API operations
 */

import apiHelper from '../../../core/api/apiHelper';
import {
  Tenant,
  TenantMember,
  TenantInvite,
  Workspace,
  CreateTenantPayload,
  UpdateTenantPayload,
  InviteMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  TenantRole
} from '../types';

/**
 * Tenant API service
 */
export class TenantService {
  /**
   * Get all tenants for current user
   */
  async getUserTenants(): Promise<Tenant[]> {
    const response = await apiHelper.get('/tenants');
    return (response.data as { data: Tenant[] }).data;
  }

  /**
   * Get specific tenant details
   */
  async getTenant(tenantId: string): Promise<Tenant> {
    const response = await apiHelper.get(`/tenants/${tenantId}`);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Get tenants for a specific user
   */
  async listForUser(userId: string): Promise<Tenant[]> {
    const response = await apiHelper.get(`/users/${userId}/tenants`);
    return (response.data as { data: Tenant[] }).data;
  }

  /**
   * Switch to a different tenant context
   */
  async switchTenant(tenantId: string): Promise<{ tenant: Tenant; workspaces: Workspace[] }> {
    const response = await apiHelper.post('/tenants/switch', { tenantId });
    return (response.data as { data: { tenant: Tenant; workspaces: Workspace[] } }).data;
  }

  /**
   * Update tenant settings
   */
  async updateSettings(id: string, settings: Partial<Tenant['settings']>): Promise<Tenant> {
    const response = await apiHelper.put(`/tenants/${id}/settings`, settings);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantPayload): Promise<Tenant> {
    const response = await apiHelper.post('/tenants', data);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Update tenant information
   */
  async updateTenant(tenantId: string, data: UpdateTenantPayload): Promise<Tenant> {
    const response = await apiHelper.put(`/tenants/${tenantId}`, data);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    await apiHelper.delete(`/tenants/${tenantId}`);
  }

  /**
   * Get tenant members
   */
  async getTenantMembers(tenantId: string): Promise<TenantMember[]> {
    const response = await apiHelper.get(`/tenants/${tenantId}/members`);
    return (response.data as { data: TenantMember[] }).data;
  }

  /**
   * Invite user to tenant
   */
  async inviteUser(tenantId: string, data: InviteMemberPayload): Promise<TenantInvite> {
    const response = await apiHelper.post(`/tenants/${tenantId}/members/invite`, data);
    return (response.data as { data: TenantInvite }).data;
  }

  /**
   * Remove user from tenant
   */
  async removeUser(tenantId: string, userId: string): Promise<void> {
    await apiHelper.delete(`/tenants/${tenantId}/members/${userId}`);
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(tenantId: string, userId: string, role: TenantRole): Promise<TenantMember> {
    const response = await apiHelper.put(`/tenants/${tenantId}/members/${userId}`, { role });
    return (response.data as { data: TenantMember }).data;
  }

  /**
   * Get tenant workspaces
   */
  async getTenantWorkspaces(tenantId: string): Promise<Workspace[]> {
    const response = await apiHelper.get(`/tenants/${tenantId}/workspaces`);
    return (response.data as { data: Workspace[] }).data;
  }

  /**
   * Create workspace in tenant
   */
  async createWorkspace(tenantId: string, data: CreateWorkspacePayload): Promise<Workspace> {
    const response = await apiHelper.post(`/tenants/${tenantId}/workspaces`, data);
    return (response.data as { data: Workspace }).data;
  }

  /**
   * Update workspace
   */
  async updateWorkspace(workspaceId: string, data: UpdateWorkspacePayload): Promise<Workspace> {
    const response = await apiHelper.put(`/workspaces/${workspaceId}`, data);
    return (response.data as { data: Workspace }).data;
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiHelper.delete(`/workspaces/${workspaceId}`);
  }

  /**
   * Test tenant isolation
   */
  async testTenantIsolation(tenantId: string): Promise<any> {
    const response = await apiHelper.get('/test/tenant-isolation', {
      headers: {
        'X-Tenant-Id': tenantId
      }
    });
    return response.data as any;
  }

  /**
   * Get tenant-scoped data sources
   */
  async getDataSources(tenantId: string): Promise<any[]> {
    const response = await apiHelper.get('/data-sources', {
      headers: {
        'X-Tenant-Id': tenantId
      }
    });
    return (response.data as { data: any[] }).data;
  }

  /**
   * Get tenant-scoped charts
   */
  async getCharts(tenantId: string): Promise<any[]> {
    const response = await apiHelper.get('/charts', {
      headers: {
        'X-Tenant-Id': tenantId
      }
    });
    return (response.data as { data: any[] }).data;
  }
}

// Export singleton instance
export const tenantService = new TenantService();
export default tenantService;