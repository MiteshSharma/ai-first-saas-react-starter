/**
 * @fileoverview Role Service
 *
 * Service layer for role-related API operations
 */

import RBACBackendHelper from '../api/backendHelper';
import {
  Role,
} from '../types';

/**
 * Role API service
 */
export class RoleService {
  /**
   * Get all roles
   */
  async getRoles(params?: { tenantId?: string; workspaceId?: string }): Promise<Role[]> {
    return RBACBackendHelper.getRoles(params);
  }

  /**
   * Get specific role by ID
   */
  async getRole(roleId: string): Promise<Role | undefined> {
    const roles = await this.getRoles();
    return roles.find(role => role.id === roleId);
  }

  /**
   * Create a new role
   */
  async createRole(roleData: Partial<Role>): Promise<Role> {
    return RBACBackendHelper.createRole(roleData);
  }

  /**
   * Update existing role
   */
  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    return RBACBackendHelper.updateRole(roleId, updates);
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<void> {
    return RBACBackendHelper.deleteRole(roleId);
  }

  /**
   * Assign roles to user
   */
  async assignUserRoles(userId: string, data: { roleIds: string[]; tenantId?: string; workspaceId?: string }): Promise<any> {
    return RBACBackendHelper.assignUserRoles(userId, data);
  }

  /**
   * Remove role from user
   */
  async removeUserRole(userId: string, roleId: string): Promise<void> {
    return RBACBackendHelper.removeUserRole(userId, roleId);
  }

  /**
   * Get role templates
   */
  async getRoleTemplates(): Promise<any[]> {
    return RBACBackendHelper.getRoleTemplates();
  }

  /**
   * Export RBAC configuration
   */
  async exportRBAC(): Promise<any> {
    return RBACBackendHelper.exportRBAC();
  }

  /**
   * Import RBAC configuration
   */
  async importRBAC(importData: any): Promise<{ message: string }> {
    return RBACBackendHelper.importRBAC(importData);
  }

  /**
   * Get roles for specific tenant
   */
  async getTenantRoles(tenantId: string): Promise<Role[]> {
    return this.getRoles({ tenantId });
  }

  /**
   * Get roles for specific workspace
   */
  async getWorkspaceRoles(workspaceId: string, tenantId?: string): Promise<Role[]> {
    return this.getRoles({ workspaceId, tenantId });
  }

  /**
   * Check if role can be deleted
   */
  async canDeleteRole(roleId: string): Promise<boolean> {
    try {
      const role = await this.getRole(roleId);

      if (!role) {
        return false;
      }

      // Cannot delete system roles
      if (role.isSystem) {
        return false;
      }

      // TODO: Check if role has assigned users in a real implementation
      // For now, assume we can delete non-system roles

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's roles in specific context
   * @deprecated User roles now come from tenant-management events
   */
  async getUserRolesInContext(userId: string, context: { tenantId?: string; workspaceId?: string }): Promise<any[]> {
    // This method is deprecated - roles should come from tenant-management
    console.warn('getUserRolesInContext is deprecated. User roles should come from tenant-management events.');
    // Return empty array as roles are now managed by tenant-management
    return [];
  }
}

// Export singleton instance
export const roleService = new RoleService();
export default roleService;