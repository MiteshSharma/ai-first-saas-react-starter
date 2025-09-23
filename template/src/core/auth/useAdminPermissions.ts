/**
 * @fileoverview Admin Permissions Hook
 *
 * Custom hook for admin permission checking and enforcement
 */

import { useCallback } from 'react';
import { useAuthStore } from './AuthStore';
import { useTenantStore } from '../../plugins/tenant-management/stores/tenantStore';

export interface AdminPermissionContext {
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Hook for admin permission management
 *
 * Provides utilities for checking admin permissions and enforcing access controls
 */
export const useAdminPermissions = () => {
  const { isAdminSession, isAdminUser, adminMetadata } = useAuthStore();
  const { currentTenant, getAdminForcedTenant, isAdminMode } = useTenantStore();

  /**
   * Check if user has admin access
   */
  const hasAdminAccess = useCallback((): boolean => {
    return isAdminMode();
  }, [isAdminMode]);

  /**
   * Check if admin can access a specific tenant
   */
  const canAccessTenant = useCallback((tenantId: string): boolean => {
    if (!hasAdminAccess()) {
      return false;
    }

    // Check if admin is forced to a specific tenant
    const forcedTenantId = getAdminForcedTenant();
    if (forcedTenantId) {
      return tenantId === forcedTenantId;
    }

    // Full admin users can access any tenant
    return true;
  }, [hasAdminAccess, getAdminForcedTenant]);

  /**
   * Check if admin can perform write operations
   */
  const canPerformWriteOperations = useCallback((): boolean => {
    if (!hasAdminAccess()) {
      return false;
    }

    // Check admin access level (currently all admin sessions are read-only)
    return adminMetadata?.accessLevel !== 'read-only';
  }, [hasAdminAccess, adminMetadata?.accessLevel]);

  /**
   * Check if admin can access a specific resource
   */
  const canAccessResource = useCallback((
    context: AdminPermissionContext
  ): boolean => {
    if (!hasAdminAccess()) {
      return false;
    }

    // If tenant context is provided, check tenant access
    if (context.tenantId && !canAccessTenant(context.tenantId)) {
      return false;
    }

    // Admin users can access all resources within their allowed tenants
    return true;
  }, [hasAdminAccess, canAccessTenant]);

  /**
   * Get current admin session info
   */
  const getAdminSessionInfo = useCallback(() => {
    if (!isAdminSession || !adminMetadata) {
      return null;
    }

    return {
      isAdminSession,
      loginTime: adminMetadata.loginTime,
      accessLevel: adminMetadata.accessLevel,
      forcedTenantId: adminMetadata.forcedTenantId,
      currentTenantId: currentTenant?.id,
      isRestrictedSession: !!adminMetadata.forcedTenantId
    };
  }, [isAdminSession, adminMetadata, currentTenant?.id]);

  /**
   * Check if current session allows tenant switching
   */
  const canSwitchTenants = useCallback((): boolean => {
    if (!hasAdminAccess()) {
      return false;
    }

    // If admin is forced to a specific tenant, they cannot switch
    const forcedTenantId = getAdminForcedTenant();
    return !forcedTenantId;
  }, [hasAdminAccess, getAdminForcedTenant]);

  /**
   * Get admin override permissions for UI components
   */
  const getAdminOverrides = useCallback(() => {
    if (!hasAdminAccess()) {
      return {
        canViewAllTenants: false,
        canViewAllWorkspaces: false,
        canViewAllUsers: false,
        canViewAuditLogs: false,
        canBypassPermissions: false
      };
    }

    return {
      canViewAllTenants: true,
      canViewAllWorkspaces: true,
      canViewAllUsers: true,
      canViewAuditLogs: true,
      canBypassPermissions: true
    };
  }, [hasAdminAccess]);

  /**
   * Enforce admin-only access (throws error if not admin)
   */
  const enforceAdminAccess = useCallback((
    operation: string,
    context?: AdminPermissionContext
  ): void => {
    if (!hasAdminAccess()) {
      throw new Error(`Admin access required for operation: ${operation}`);
    }

    if (context?.tenantId && !canAccessTenant(context.tenantId)) {
      throw new Error(
        `Admin does not have access to tenant ${context.tenantId} for operation: ${operation}`
      );
    }
  }, [hasAdminAccess, canAccessTenant]);

  return {
    // Permission checks
    hasAdminAccess,
    canAccessTenant,
    canPerformWriteOperations,
    canAccessResource,
    canSwitchTenants,

    // Session info
    getAdminSessionInfo,
    getAdminOverrides,

    // Enforcement
    enforceAdminAccess,

    // Direct state access (for advanced use cases)
    isAdminSession,
    isAdminUser: isAdminUser(),
    adminMetadata
  };
};

export default useAdminPermissions;