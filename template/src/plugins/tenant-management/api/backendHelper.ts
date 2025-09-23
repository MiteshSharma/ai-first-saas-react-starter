/**
 * @fileoverview Tenant Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for tenant management operations
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { TENANT_ENDPOINTS } from './endpoints';
import {
  Tenant,
  TenantSettings,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantRole,
  TenantUser,
  TenantInvitation
} from '../types';

// Dynamic import for mock handlers to avoid circular dependencies
let TenantMockHandlers: any = null;
const isMockMode = () => process.env.REACT_APP_USE_MOCK_API === 'true';

const getMockHandlers = async () => {
  if (!TenantMockHandlers) {
    const module = await import('./mockHandlers');
    TenantMockHandlers = module.default;
  }
  return TenantMockHandlers;
};

/**
 * Backend helper for tenant API calls
 */
export class TenantBackendHelper {
  /**
   * Get all tenants for current user
   */
  static async getUserTenants(): Promise<Tenant[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getUserTenants();
    }

    const response = await apiHelper.get(TENANT_ENDPOINTS.LIST);
    return (response.data as { data: Tenant[] }).data;
  }

  /**
   * Get specific tenant details
   */
  static async getTenant(tenantId: string): Promise<Tenant> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getTenant(tenantId);
    }

    const endpoint = TENANT_ENDPOINTS.GET.replace(':tenantId', tenantId);
    const response = await apiHelper.get(endpoint);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Get tenants for a specific user
   */
  static async listForUser(userId: string): Promise<Tenant[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getUserTenants(); // For now, return user tenants
    }

    const endpoint = TENANT_ENDPOINTS.GET_USER_TENANTS.replace(':userId', userId);
    const response = await apiHelper.get(endpoint);
    return (response.data as { data: Tenant[] }).data;
  }

  /**
   * Switch to a different tenant context
   */
  static async switchTenant(tenantId: string): Promise<{ tenant: Tenant; workspaces: any[] }> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.switchTenant(tenantId);
    }

    const response = await apiHelper.post(TENANT_ENDPOINTS.SWITCH, { tenantId });
    return (response.data as { data: { tenant: Tenant; workspaces: any[] } }).data;
  }

  /**
   * Create a new tenant
   */
  static async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.createTenant(data);
    }

    const response = await apiHelper.post(TENANT_ENDPOINTS.CREATE, data);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Update tenant information
   */
  static async updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<Tenant> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateTenant(tenantId, data);
    }

    const endpoint = TENANT_ENDPOINTS.UPDATE.replace(':tenantId', tenantId);
    const response = await apiHelper.put(endpoint, data);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Delete a tenant
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.deleteTenant(tenantId);
    }

    const endpoint = TENANT_ENDPOINTS.DELETE.replace(':tenantId', tenantId);
    await apiHelper.delete(endpoint);
  }

  /**
   * Update tenant settings
   */
  static async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<Tenant> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateSettings(tenantId, settings);
    }

    const endpoint = TENANT_ENDPOINTS.UPDATE_SETTINGS.replace(':tenantId', tenantId);
    const response = await apiHelper.put(endpoint, settings);
    return (response.data as { data: Tenant }).data;
  }

  /**
   * Get tenant members
   */
  static async getTenantMembers(tenantId: string): Promise<TenantUser[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getTenantMembers(tenantId);
    }

    const endpoint = TENANT_ENDPOINTS.GET_MEMBERS.replace(':tenantId', tenantId);
    const response = await apiHelper.get(endpoint);
    return (response.data as { data: TenantUser[] }).data;
  }

  /**
   * Invite user to tenant
   */
  static async inviteUser(tenantId: string, data: { email: string; role: TenantRole }): Promise<TenantInvitation> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.inviteUser(tenantId, data);
    }

    const endpoint = TENANT_ENDPOINTS.INVITE_MEMBER.replace(':tenantId', tenantId);
    const response = await apiHelper.post(endpoint, data);
    return (response.data as { data: TenantInvitation }).data;
  }

  /**
   * Remove user from tenant
   */
  static async removeUser(tenantId: string, userId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.removeUser(tenantId, userId);
    }

    const endpoint = TENANT_ENDPOINTS.REMOVE_MEMBER
      .replace(':tenantId', tenantId)
      .replace(':userId', userId);
    await apiHelper.delete(endpoint);
  }

  /**
   * Update user role in tenant
   */
  static async updateUserRole(tenantId: string, userId: string, role: TenantRole): Promise<TenantUser> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateUserRole(tenantId, userId, role);
    }

    const endpoint = TENANT_ENDPOINTS.UPDATE_MEMBER_ROLE
      .replace(':tenantId', tenantId)
      .replace(':userId', userId);
    const response = await apiHelper.put(endpoint, { role });
    return (response.data as { data: TenantUser }).data;
  }

  /**
   * Update user workspace permissions
   */
  static async updateMemberWorkspacePermissions(
    tenantId: string,
    userId: string,
    permissions: { workspaceId: string; role: string }[]
  ): Promise<TenantUser> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateMemberWorkspacePermissions(tenantId, userId, permissions);
    }

    const endpoint = TENANT_ENDPOINTS.UPDATE_MEMBER_WORKSPACE_PERMISSIONS
      .replace(':tenantId', tenantId)
      .replace(':userId', userId);
    const response = await apiHelper.put(endpoint, { permissions });
    return (response.data as { data: TenantUser }).data;
  }

  /**
   * Get tenant workspaces
   */
  static async getTenantWorkspaces(tenantId: string): Promise<any[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      const result = await mockHandlers.switchTenant(tenantId);
      return result.workspaces;
    }

    const endpoint = TENANT_ENDPOINTS.GET_WORKSPACES.replace(':tenantId', tenantId);
    const response = await apiHelper.get(endpoint);
    return (response.data as { data: any[] }).data;
  }

  /**
   * Create workspace in tenant
   */
  static async createWorkspace(tenantId: string, data: any): Promise<any> {
    if (isMockMode()) {
      // Mock workspace creation
      return {
        id: `workspace-${Date.now()}`,
        name: data.name,
        tenantId,
        description: data.description,
        settings: {},
        members: []
      };
    }

    const endpoint = TENANT_ENDPOINTS.CREATE_WORKSPACE.replace(':tenantId', tenantId);
    const response = await apiHelper.post(endpoint, data);
    return (response.data as { data: any }).data;
  }

  /**
   * Test tenant isolation
   */
  static async testTenantIsolation(tenantId: string): Promise<any> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.testTenantIsolation(tenantId);
    }

    const response = await apiHelper.get(TENANT_ENDPOINTS.TEST_ISOLATION, {
      headers: {
        'X-Tenant-Id': tenantId
      }
    });
    return response.data as any;
  }

  /**
   * Get tenant-scoped data sources
   */
  static async getDataSources(tenantId: string): Promise<any[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getDataSources(tenantId);
    }

    const response = await apiHelper.get(TENANT_ENDPOINTS.GET_DATA_SOURCES, {
      headers: {
        'X-Tenant-Id': tenantId
      }
    });
    return (response.data as { data: any[] }).data;
  }

  /**
   * Get tenant-scoped charts
   */
  static async getCharts(tenantId: string): Promise<any[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getCharts(tenantId);
    }

    const response = await apiHelper.get(TENANT_ENDPOINTS.GET_CHARTS, {
      headers: {
        'X-Tenant-Id': tenantId
      }
    });
    return (response.data as { data: any[] }).data;
  }
}

export default TenantBackendHelper;