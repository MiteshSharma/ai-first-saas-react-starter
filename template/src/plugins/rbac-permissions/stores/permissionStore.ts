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
import { SYSTEM_PERMISSIONS } from '../constants';
import { apiHelper } from '../../../core/api';

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
          // For now, use system permissions
          // In real implementation, this would fetch from API
          const permissions = SYSTEM_PERMISSIONS;

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
          // Mock implementation - in real app, this would call API
          const response = await fetch('/api/permissions/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context),
          });

          if (!response.ok) {
            throw new Error('Failed to load user permissions');
          }

          const userPermissions: ContextualPermission[] = await response.json();

          set({
            userPermissions,
            loading: false
          });
        } catch (error) {
          console.error('Failed to load user permissions:', error);

          // Fallback to mock permissions for development
          const mockUserPermissions = get().generateMockUserPermissions(context);

          set({
            userPermissions: mockUserPermissions,
            loading: false
          });
        }
      },

      /**
       * Check if user has specific permission
       */
      checkPermission: async (permission: string, context: AccessContext): Promise<boolean> => {
        try {
          const { userPermissions } = get();

          // Check if permission exists in user's permissions
          const hasPermission = userPermissions.some(p =>
            p.id === permission &&
            p.granted &&
            get().isPermissionApplicableToContext(p, context)
          );

          return hasPermission;
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
          const results: PermissionCheckResult[] = [];

          for (const permission of check.permissions) {
            const granted = await get().checkPermission(permission, check.context);
            const { userPermissions } = get();
            const permissionData = userPermissions.find(p => p.id === permission);

            results.push({
              granted,
              reason: granted ? 'Permission granted' : 'Permission denied',
              grantedBy: permissionData?.inheritedFrom,
              scope: permissionData?.scope || 'resource',
              context: check.context,
            });
          }

          return results;
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
       * Generate mock user permissions for development
       */
      generateMockUserPermissions: (context: AccessContext): ContextualPermission[] => {
        const { permissions } = get();

        // Mock: Grant different permissions based on user ID
        const mockUserRoles = get().getMockUserRoles(context.userId);
        const grantedPermissions: string[] = [];

        // Accumulate permissions from all roles
        mockUserRoles.forEach(role => {
          grantedPermissions.push(...role.permissions);
        });

        // Convert to contextual permissions
        return permissions.map(permission => ({
          ...permission,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          resourceId: context.resourceId,
          granted: grantedPermissions.includes(permission.id),
          inheritedFrom: mockUserRoles.find(role =>
            role.permissions.includes(permission.id)
          )?.id,
        }));
      },

      /**
       * Get mock user roles for development
       */
      getMockUserRoles: (userId: string) => {
        // Mock role assignments based on user ID
        const mockRoles = [
          {
            id: 'tenant-owner',
            permissions: [
              'tenant.read', 'tenant.update', 'tenant.manage',
              'workspace.create', 'workspace.read', 'workspace.update',
              'workspace.delete', 'workspace.settings.manage',
              'user.create', 'user.read', 'user.update', 'user.delete',
              'role.create', 'role.read', 'role.update', 'role.delete', 'role.assign',
              'settings.tenant.read', 'settings.tenant.update',
              'audit.read', 'audit.export',
              'dashboard.read', 'dashboard.export',
              'integration.read', 'integration.manage',
            ]
          }
        ];

        return mockRoles;
      },

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
    const store = usePermissionStore.getState();
    const permissionId = `${resource}.${action}`;
    return await store.checkPermission(permissionId, context);
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
    const store = usePermissionStore.getState();

    for (const permission of permissions) {
      const hasPermission = await store.checkPermission(permission, context);
      if (hasPermission) {
        return true;
      }
    }

    return false;
  },

  /**
   * Check if user has all permissions from a list
   */
  hasAllPermissions: async (
    permissions: string[],
    context: AccessContext
  ): Promise<boolean> => {
    const store = usePermissionStore.getState();

    for (const permission of permissions) {
      const hasPermission = await store.checkPermission(permission, context);
      if (!hasPermission) {
        return false;
      }
    }

    return true;
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