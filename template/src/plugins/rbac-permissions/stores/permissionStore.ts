/**
 * @fileoverview Permission Store
 *
 * Zustand store for permission management and access control
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PermissionState,
  Permission,
  ContextualPermission,
  AccessContext,
  BulkPermissionCheck,
  PermissionCheckResult,
} from '../types';
import { permissionService } from '../services/permissionService';

/**
 * Permission store implementation
 */
export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: [],
      userPermissions: [],
      loading: false,
      error: null,

      /**
       * Load all available permissions
       */
      loadPermissions: async () => {
        set({ loading: true, error: null });

        try {
          const permissions = await permissionService.getPermissions();

          set({
            permissions,
            loading: false
          });
        } catch (error) {
          console.error('Failed to load permissions:', error);
          set({
            error: 'Failed to load permissions',
            loading: false
          });
        }
      },

      /**
       * Load user permissions for given context
       */
      loadUserPermissions: async (context: AccessContext) => {
        set({ loading: true, error: null });

        try {
          const userPermissions = await permissionService.getUserPermissions(context);

          set({
            userPermissions,
            loading: false
          });
        } catch (error) {
          console.error('Failed to load user permissions:', error);
          set({
            error: 'Failed to load user permissions',
            loading: false
          });
        }
      },

      /**
       * Check if user has specific permission
       */
      checkPermission: async (permission: string, context: AccessContext): Promise<boolean> => {
        try {
          return await permissionService.checkPermission(permission, context);
        } catch (error) {
          console.error('Failed to check permission:', error);
          return false;
        }
      },

      /**
       * Check multiple permissions with AND/OR logic
       */
      checkMultiplePermissions: async (check: BulkPermissionCheck): Promise<PermissionCheckResult[]> => {
        try {
          return await permissionService.checkMultiplePermissions(check);
        } catch (error) {
          console.error('Failed to check multiple permissions:', error);
          return check.permissions.map(permission => ({
            granted: false,
            reason: 'Error checking permission',
            scope: 'resource' as const,
            context: check.context,
          }));
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },

      // =========================================================================
      // Helper Methods (not part of public interface)
      // =========================================================================

      /**
       * Check if permission is applicable to given context
       */
      isPermissionApplicableToContext: (permission: ContextualPermission, context: AccessContext): boolean => {
        switch (permission.scope) {
          case 'system':
            return true;
          case 'tenant':
            return permission.tenantId === context.tenantId;
          case 'workspace':
            return permission.workspaceId === context.workspaceId;
          case 'resource':
            return permission.resourceId === context.resourceId;
          default:
            return false;
        }
      },
    }),
    {
      name: 'permission-store',
      partialize: (state) => ({
        permissions: state.permissions,
        userPermissions: state.userPermissions,
      }),
    }
  )
);

// ============================================================================
// Store Utilities
// ============================================================================

/**
 * Permission store utilities for common operations
 */
export const permissionStoreUtils = {
  /**
   * Initialize permissions on app startup
   */
  initialize: async () => {
    const store = usePermissionStore.getState();
    await store.loadPermissions();
  },

  /**
   * Refresh user permissions
   */
  refreshUserPermissions: async (context: AccessContext) => {
    const store = usePermissionStore.getState();
    await store.loadUserPermissions(context);
  },

  /**
   * Check if user can perform action on resource
   */
  canPerformAction: async (
    action: string,
    resource: string,
    context: AccessContext
  ): Promise<boolean> => {
    return await permissionService.canPerformAction(action, resource, context);
  },

  /**
   * Get user's permissions for a specific category
   */
  getPermissionsByCategory: (category: string): ContextualPermission[] => {
    const store = usePermissionStore.getState();
    return store.userPermissions.filter(p =>
      p.category === category && p.granted
    );
  },

  /**
   * Check if user has any permission from a list
   */
  hasAnyPermission: async (
    permissions: string[],
    context: AccessContext
  ): Promise<boolean> => {
    return await permissionService.hasAnyPermission(permissions, context);
  },

  /**
   * Check if user has all permissions from a list
   */
  hasAllPermissions: async (
    permissions: string[],
    context: AccessContext
  ): Promise<boolean> => {
    return await permissionService.hasAllPermissions(permissions, context);
  },

  /**
   * Get effective permissions for context
   */
  getEffectivePermissions: (context: AccessContext): ContextualPermission[] => {
    const store = usePermissionStore.getState();
    return store.userPermissions.filter(p =>
      p.granted && store.isPermissionApplicableToContext(p, context)
    );
  },
};

export default usePermissionStore;