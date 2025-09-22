/**
 * @fileoverview Permission Store
 *
 * Zustand store for permission management and access control
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PermissionState,
  ContextualPermission,
  AccessContext,
  BulkPermissionCheck,
  PermissionCheckResult,
} from '../types';
import { permissionService } from '../services/permissionService';
import { TENANT_EVENTS } from '../../tenant-management/types';

/**
 * Permission store implementation
 */
// Store to hold event bus reference
let eventBus: any = null;

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set) => ({
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
       * Set user permissions from event (no API call needed)
       */
      setUserPermissionsFromEvent: (permissions: string[], role: string, context: AccessContext) => {
        // Convert string permissions to ContextualPermission objects
        const contextualPermissions: ContextualPermission[] = permissions.map(permission => {
          const parts = permission.split('.');
          const resource = parts[0] || 'general';
          const action = parts[1] || 'read';

          return {
            id: permission,
            name: permission,
            description: `Permission for ${permission}`,
            action: action as any,
            resource: resource as any,
            scope: context.workspaceId ? 'workspace' : 'tenant',
            category: resource,
            isSystem: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            granted: true,
            tenantId: context.tenantId,
            workspaceId: context.workspaceId,
            inheritedFrom: role
          };
        });

        set({
          userPermissions: contextualPermissions,
          loading: false,
          error: null
        });
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
          return check.permissions.map(() => ({
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
 * Initialize permission store with event bus
 */
export const initializePermissionStore = (providedEventBus: any) => {
  eventBus = providedEventBus;
  const store = usePermissionStore.getState();

  console.log('[RBAC Store] Initializing permission store with event listeners');
  console.log('[RBAC Store] Listening for event:', TENANT_EVENTS.USER_PERMISSIONS_LOADED);

  // Listen for tenant permission events (now includes workspace information)
  const unsubscribeTenantPermissions = eventBus.on(
    TENANT_EVENTS.USER_PERMISSIONS_LOADED,
    ({ userId, tenantId, tenantRole, workspaces }: any) => {
      console.log('[RBAC Store] Received USER_PERMISSIONS_LOADED event:', {
        userId,
        tenantId,
        tenantRole,
        workspaceCount: workspaces?.length || 0
      });

      // For now, we'll store tenant-level role information
      // Workspace-specific permissions are handled by the workspace event
      if (workspaces && workspaces.length > 0) {
        // Process workspace permissions from the tenant event
        workspaces.forEach((workspace: any) => {
          if (workspace.effectivePermissions && workspace.effectivePermissions.length > 0) {
            const permissionIds = workspace.effectivePermissions.map((p: any) => p.id);
            store.setUserPermissionsFromEvent(permissionIds, tenantRole, {
              tenantId,
              workspaceId: workspace.workspaceId,
              userId
            });
          }
        });
      }
    }
  );

  // Listen for workspace permission events
  const unsubscribeWorkspacePermissions = eventBus.on(
    'workspace.permissions.loaded',
    ({ userId, tenantId, workspaceId, permissions, groupIds }: any) => {
      console.log('[RBAC Store] Received workspace.permissions.loaded event:', {
        userId,
        tenantId,
        workspaceId,
        permissionsCount: permissions?.length || 0,
        groupIds
      });

      // Store workspace-specific permissions
      store.setUserPermissionsFromEvent(permissions || [], 'workspace-member', {
        tenantId,
        workspaceId,
        userId
      });
    }
  );

  // Return cleanup function
  return () => {
    unsubscribeTenantPermissions();
    unsubscribeWorkspacePermissions();
  };
};

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

  /**
   * Get permissions for specific workspace
   */
  getWorkspacePermissions: (workspaceId: string): ContextualPermission[] => {
    const store = usePermissionStore.getState();
    return store.userPermissions.filter(p =>
      p.granted && p.workspaceId === workspaceId
    );
  },

  /**
   * Check if user has permission in specific workspace
   */
  hasWorkspacePermission: async (
    permission: string,
    workspaceId: string,
    tenantId?: string
  ): Promise<boolean> => {
    const store = usePermissionStore.getState();
    const context: AccessContext = {
      userId: 'current', // This will be resolved by the check
      workspaceId,
      tenantId
    };
    return await store.checkPermission(permission, context);
  },
};

export default usePermissionStore;