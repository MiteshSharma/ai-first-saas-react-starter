/**
 * @fileoverview Permission Service
 *
 * Service layer for permission-related API operations
 */

import RBACBackendHelper from '../api/backendHelper';
import {
  Permission,
  ContextualPermission,
  AccessContext,
  BulkPermissionCheck,
  PermissionCheckResult,
} from '../types';

/**
 * Permission API service
 */
export class PermissionService {
  /**
   * Get all available permissions
   */
  async getPermissions(): Promise<Permission[]> {
    return RBACBackendHelper.getPermissions();
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(permission: string, context: AccessContext): Promise<boolean> {
    const result = await RBACBackendHelper.checkPermission(permission, context);
    return result.hasPermission;
  }

  /**
   * Check multiple permissions
   */
  async checkMultiplePermissions(bulkCheck: BulkPermissionCheck): Promise<PermissionCheckResult[]> {
    return RBACBackendHelper.checkBulkPermissions(bulkCheck);
  }

  /**
   * Check if user has any permission from a list
   */
  async hasAnyPermission(permissions: string[], context: AccessContext): Promise<boolean> {
    const results = await this.checkMultiplePermissions({
      permissions,
      context,
      operator: 'OR'
    });

    return results.some(result => result.granted);
  }

  /**
   * Check if user has all permissions from a list
   */
  async hasAllPermissions(permissions: string[], context: AccessContext): Promise<boolean> {
    const results = await this.checkMultiplePermissions({
      permissions,
      context,
      operator: 'AND'
    });

    return results.every(result => result.granted);
  }

  /**
   * Check if user can perform action on resource
   */
  async canPerformAction(action: string, resource: string, context: AccessContext): Promise<boolean> {
    const permissionId = `${resource}.${action}`;
    return this.checkPermission(permissionId, context);
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
export default permissionService;