/**
 * @fileoverview Tenant Service
 *
 * Service layer for tenant-related API operations
 */

import TenantBackendHelper from '../api/backendHelper';
import {
  Tenant,
  TenantUser,
  TenantInvitation,
  CreateTenantRequest,
  UpdateTenantRequest,
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
    return TenantBackendHelper.getUserTenants();
  }

  /**
   * Get specific tenant details
   */
  async getTenant(tenantId: string): Promise<Tenant> {
    return TenantBackendHelper.getTenant(tenantId);
  }

  /**
   * Get tenants for a specific user
   */
  async listForUser(userId: string): Promise<Tenant[]> {
    return TenantBackendHelper.listForUser(userId);
  }

  /**
   * Switch to a different tenant context
   */
  async switchTenant(tenantId: string): Promise<{ tenant: Tenant; workspaces: any[] }> {
    return TenantBackendHelper.switchTenant(tenantId);
  }

  /**
   * Update tenant settings
   */
  async updateSettings(id: string, settings: Partial<Tenant['settings']>): Promise<Tenant> {
    return TenantBackendHelper.updateSettings(id, settings);
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    return TenantBackendHelper.createTenant(data);
  }

  /**
   * Update tenant information
   */
  async updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<Tenant> {
    return TenantBackendHelper.updateTenant(tenantId, data);
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    return TenantBackendHelper.deleteTenant(tenantId);
  }

  /**
   * Get tenant members
   */
  async getTenantMembers(tenantId: string): Promise<TenantUser[]> {
    return TenantBackendHelper.getTenantMembers(tenantId);
  }

  /**
   * Invite user to tenant
   */
  async inviteUser(tenantId: string, data: { email: string; role: TenantRole }): Promise<TenantInvitation> {
    return TenantBackendHelper.inviteUser(tenantId, data);
  }

  /**
   * Remove user from tenant
   */
  async removeUser(tenantId: string, userId: string): Promise<void> {
    return TenantBackendHelper.removeUser(tenantId, userId);
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(tenantId: string, userId: string, role: TenantRole): Promise<TenantUser> {
    return TenantBackendHelper.updateUserRole(tenantId, userId, role);
  }

  /**
   * Get tenant workspaces
   */
  async getTenantWorkspaces(tenantId: string): Promise<any[]> {
    return TenantBackendHelper.getTenantWorkspaces(tenantId);
  }

  /**
   * Create workspace in tenant
   */
  async createWorkspace(tenantId: string, data: any): Promise<any> {
    return TenantBackendHelper.createWorkspace(tenantId, data);
  }

  // Note: Workspace operations should use workspace service instead

  /**
   * Test tenant isolation
   */
  async testTenantIsolation(tenantId: string): Promise<any> {
    return TenantBackendHelper.testTenantIsolation(tenantId);
  }

  /**
   * Get tenant-scoped data sources
   */
  async getDataSources(tenantId: string): Promise<any[]> {
    return TenantBackendHelper.getDataSources(tenantId);
  }

  /**
   * Get tenant-scoped charts
   */
  async getCharts(tenantId: string): Promise<any[]> {
    return TenantBackendHelper.getCharts(tenantId);
  }
}

// Export singleton instance
export const tenantService = new TenantService();
export default tenantService;