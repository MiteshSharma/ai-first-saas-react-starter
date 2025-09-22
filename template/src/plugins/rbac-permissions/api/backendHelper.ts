/**
 * @fileoverview RBAC Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for RBAC operations
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { RBAC_ENDPOINTS } from './endpoints';
import {
  Permission,
  Role,
  ContextualPermission,
  AccessContext,
  BulkPermissionCheck,
  PermissionCheckResult,
} from '../types';

// Dynamic import for mock handlers to avoid circular dependencies
let RBACMockHandlers: any = null;
const isMockMode = () => process.env.REACT_APP_USE_MOCK_API === 'true';

const getMockHandlers = async () => {
  if (!RBACMockHandlers) {
    const module = await import('./mockHandlers');
    RBACMockHandlers = module.default;
  }
  return RBACMockHandlers;
};

/**
 * Backend helper for RBAC API calls
 */
export class RBACBackendHelper {
  /**
   * Get all permissions
   */
  static async getPermissions(): Promise<Permission[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getPermissions();
    }

    const response = await apiHelper.get(RBAC_ENDPOINTS.PERMISSIONS);
    return (response.data as { data: Permission[] }).data;
  }

  /**
   * Check single permission
   */
  static async checkPermission(permission: string, context: AccessContext): Promise<{ hasPermission: boolean }> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.checkPermission(permission, context);
    }

    const response = await apiHelper.post(RBAC_ENDPOINTS.CHECK_PERMISSION, { permission, context });
    return response.data as { hasPermission: boolean };
  }

  /**
   * Check multiple permissions
   */
  static async checkBulkPermissions(bulkCheck: BulkPermissionCheck): Promise<PermissionCheckResult[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.checkBulkPermissions(bulkCheck);
    }

    const response = await apiHelper.post(RBAC_ENDPOINTS.CHECK_BULK_PERMISSIONS, bulkCheck);
    return (response.data as { data: PermissionCheckResult[] }).data;
  }

  /**
   * Get all roles
   */
  static async getRoles(params?: { tenantId?: string; workspaceId?: string }): Promise<Role[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getRoles(params);
    }

    const queryParams = new URLSearchParams();
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.workspaceId) queryParams.append('workspaceId', params.workspaceId);

    const endpoint = queryParams.toString()
      ? `${RBAC_ENDPOINTS.ROLES}?${queryParams.toString()}`
      : RBAC_ENDPOINTS.ROLES;

    const response = await apiHelper.get(endpoint);
    return (response.data as { data: Role[] }).data;
  }

  /**
   * Create role
   */
  static async createRole(roleData: Partial<Role>): Promise<Role> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.createRole(roleData);
    }

    const response = await apiHelper.post(RBAC_ENDPOINTS.ROLES, roleData);
    return (response.data as { data: Role }).data;
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.updateRole(roleId, updates);
    }

    const endpoint = RBAC_ENDPOINTS.ROLE_BY_ID.replace(':roleId', roleId);
    const response = await apiHelper.put(endpoint, updates);
    return (response.data as { data: Role }).data;
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.deleteRole(roleId);
    }

    const endpoint = RBAC_ENDPOINTS.ROLE_BY_ID.replace(':roleId', roleId);
    await apiHelper.delete(endpoint);
  }

  /**
   * Assign roles to user
   */
  static async assignUserRoles(userId: string, data: { roleIds: string[]; tenantId?: string; workspaceId?: string }): Promise<any> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.assignUserRoles(userId, data);
    }

    const endpoint = RBAC_ENDPOINTS.ASSIGN_USER_ROLES.replace(':userId', userId);
    const response = await apiHelper.post(endpoint, data);
    return (response.data as { data: any }).data;
  }

  /**
   * Remove role from user
   */
  static async removeUserRole(userId: string, roleId: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.removeUserRole(userId, roleId);
    }

    const endpoint = RBAC_ENDPOINTS.REMOVE_USER_ROLE
      .replace(':userId', userId)
      .replace(':roleId', roleId);
    await apiHelper.delete(endpoint);
  }

  /**
   * Get role templates
   */
  static async getRoleTemplates(): Promise<any[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.getRoleTemplates();
    }

    const response = await apiHelper.get(RBAC_ENDPOINTS.ROLE_TEMPLATES);
    return (response.data as { data: any[] }).data;
  }

  /**
   * Export RBAC configuration
   */
  static async exportRBAC(): Promise<any> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.exportRBAC();
    }

    const response = await apiHelper.get(RBAC_ENDPOINTS.RBAC_EXPORT);
    return response.data as any;
  }

  /**
   * Import RBAC configuration
   */
  static async importRBAC(importData: any): Promise<{ message: string }> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.importRBAC(importData);
    }

    const response = await apiHelper.post(RBAC_ENDPOINTS.RBAC_IMPORT, importData);
    return response.data as { message: string };
  }
}

export default RBACBackendHelper;