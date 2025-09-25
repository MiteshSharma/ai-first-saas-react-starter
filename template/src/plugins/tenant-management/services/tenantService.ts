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
   * Update member workspace permissions
   */
  async updateMemberWorkspacePermissions(
    tenantId: string,
    userId: string,
    permissions: { workspaceId: string; role: string }[]
  ): Promise<TenantUser> {
    return TenantBackendHelper.updateMemberWorkspacePermissions(tenantId, userId, permissions);
  }





}

// Export singleton instance
export const tenantService = new TenantService();
export default tenantService;