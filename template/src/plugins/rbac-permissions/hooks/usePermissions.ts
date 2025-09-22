/**
 * @fileoverview Enhanced usePermissions Hook
 *
 * Advanced permission checking hook with RBAC integration
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissionStore, permissionStoreUtils } from '../stores/permissionStore';
import { useCoreContext } from '../../../core/context/CoreContext';
import {
  AccessContext,
  PermissionCheckResult,
  BulkPermissionCheck,
  ContextualPermission,
} from '../types';

/**
 * Hook return type
 */
interface UsePermissionsReturn {
  // Permission checking
  hasPermission: (permission: string, context?: Partial<AccessContext>) => Promise<boolean>;
  hasAnyPermission: (permissions: string[], context?: Partial<AccessContext>) => Promise<boolean>;
  hasAllPermissions: (permissions: string[], context?: Partial<AccessContext>) => Promise<boolean>;
  checkBulkPermissions: (permissions: string[], operator?: 'AND' | 'OR', context?: Partial<AccessContext>) => Promise<PermissionCheckResult[]>;

  // Permission utilities
  canPerformAction: (action: string, resource: string, context?: Partial<AccessContext>) => Promise<boolean>;
  getPermissionsByCategory: (category: string) => ContextualPermission[];
  getEffectivePermissions: (context?: Partial<AccessContext>) => ContextualPermission[];

  // State
  permissions: ContextualPermission[];
  loading: boolean;
  error: string | null;

  // Actions
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
}

/**
 * Enhanced permissions hook with RBAC support
 */
export const usePermissions = (
  defaultContext?: Partial<AccessContext>
): UsePermissionsReturn => {
  const { state } = useCoreContext();
  const { currentUser, currentTenant, currentWorkspace } = state;
  const {
    userPermissions,
    loading,
    error,
    checkPermission,
    checkMultiplePermissions,
    clearError,
  } = usePermissionStore();

  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Build access context from available data
   */
  const buildContext = useCallback((contextOverride?: Partial<AccessContext>): AccessContext => {
    return {
      userId: currentUser?.id || 'anonymous',
      tenantId: contextOverride?.tenantId || currentTenant?.id,
      workspaceId: contextOverride?.workspaceId || currentWorkspace?.id,
      resourceId: contextOverride?.resourceId,
      resourceType: contextOverride?.resourceType,
      ...defaultContext,
      ...contextOverride,
    };
  }, [currentUser, currentTenant, currentWorkspace, defaultContext]);

  /**
   * Initialize permissions on mount or context change
   */
  useEffect(() => {
    // Permissions are now loaded via events from tenant-management
    // Just mark as initialized when user is present
    if (currentUser?.id) {
      setIsInitialized(true);
    }
  }, [currentUser?.id, currentTenant?.id, currentWorkspace?.id]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(async (
    permission: string,
    context?: Partial<AccessContext>
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    const fullContext = buildContext(context);
    return await checkPermission(permission, fullContext);
  }, [isInitialized, buildContext, checkPermission]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(async (
    permissions: string[],
    context?: Partial<AccessContext>
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    const fullContext = buildContext(context);
    return await permissionStoreUtils.hasAnyPermission(permissions, fullContext);
  }, [isInitialized, buildContext]);

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(async (
    permissions: string[],
    context?: Partial<AccessContext>
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    const fullContext = buildContext(context);
    return await permissionStoreUtils.hasAllPermissions(permissions, fullContext);
  }, [isInitialized, buildContext]);

  /**
   * Check multiple permissions with bulk operation
   */
  const checkBulkPermissions = useCallback(async (
    permissions: string[],
    operator: 'AND' | 'OR' = 'OR',
    context?: Partial<AccessContext>
  ): Promise<PermissionCheckResult[]> => {
    if (!isInitialized) {
      return permissions.map(permission => ({
        granted: false,
        reason: 'Permissions not initialized',
        scope: 'resource' as const,
        context: buildContext(context),
      }));
    }

    const fullContext = buildContext(context);
    const bulkCheck: BulkPermissionCheck = {
      permissions,
      context: fullContext,
      operator,
    };

    return await checkMultiplePermissions(bulkCheck);
  }, [isInitialized, buildContext, checkMultiplePermissions]);

  /**
   * Check if user can perform specific action on resource
   */
  const canPerformAction = useCallback(async (
    action: string,
    resource: string,
    context?: Partial<AccessContext>
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    const fullContext = buildContext(context);
    return await permissionStoreUtils.canPerformAction(action, resource, fullContext);
  }, [isInitialized, buildContext]);

  /**
   * Get permissions by category
   */
  const getPermissionsByCategory = useCallback((category: string): ContextualPermission[] => {
    return permissionStoreUtils.getPermissionsByCategory(category);
  }, []);

  /**
   * Get effective permissions for context
   */
  const getEffectivePermissions = useCallback((
    context?: Partial<AccessContext>
  ): ContextualPermission[] => {
    const fullContext = buildContext(context);
    return permissionStoreUtils.getEffectivePermissions(fullContext);
  }, [buildContext]);

  /**
   * Refresh user permissions
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    // Permissions are now refreshed via events from tenant-management
    // This is kept for compatibility but doesn't need to do anything
    console.log('Permissions refresh requested - handled by tenant-management events');
  }, []);

  /**
   * Memoized permissions for performance
   */
  const memoizedPermissions = useMemo(() => userPermissions, [userPermissions]);

  return {
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkBulkPermissions,

    // Permission utilities
    canPerformAction,
    getPermissionsByCategory,
    getEffectivePermissions,

    // State
    permissions: memoizedPermissions,
    loading,
    error,

    // Actions
    refreshPermissions,
    clearError,
  };
};

/**
 * Hook for workspace-specific permissions
 */
export const useWorkspacePermissions = (workspaceId?: string) => {
  return usePermissions({ workspaceId });
};

/**
 * Hook for tenant-specific permissions
 */
export const useTenantPermissions = (tenantId?: string) => {
  return usePermissions({ tenantId });
};

/**
 * Hook for resource-specific permissions
 */
export const useResourcePermissions = (resourceId: string, resourceType: string) => {
  return usePermissions({ resourceId, resourceType });
};

/**
 * Simple permission check hook for common use cases
 */
export const useHasPermission = (
  permission: string,
  context?: Partial<AccessContext>
): boolean => {
  const [hasAccess, setHasAccess] = useState(false);
  const { hasPermission } = usePermissions(context);

  useEffect(() => {
    const checkAccess = async () => {
      const result = await hasPermission(permission, context);
      setHasAccess(result);
    };

    checkAccess();
  }, [permission, hasPermission, context]);

  return hasAccess;
};

/**
 * Permission check for multiple permissions with OR logic
 */
export const useHasAnyPermission = (
  permissions: string[],
  context?: Partial<AccessContext>
): boolean => {
  const [hasAccess, setHasAccess] = useState(false);
  const { hasAnyPermission } = usePermissions(context);

  useEffect(() => {
    const checkAccess = async () => {
      const result = await hasAnyPermission(permissions, context);
      setHasAccess(result);
    };

    checkAccess();
  }, [permissions, hasAnyPermission, context]);

  return hasAccess;
};

/**
 * Permission check for multiple permissions with AND logic
 */
export const useHasAllPermissions = (
  permissions: string[],
  context?: Partial<AccessContext>
): boolean => {
  const [hasAccess, setHasAccess] = useState(false);
  const { hasAllPermissions } = usePermissions(context);

  useEffect(() => {
    const checkAccess = async () => {
      const result = await hasAllPermissions(permissions, context);
      setHasAccess(result);
    };

    checkAccess();
  }, [permissions, hasAllPermissions, context]);

  return hasAccess;
};

export default usePermissions;