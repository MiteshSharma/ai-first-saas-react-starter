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
} from '../types';
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
       * Set static permissions (no API call needed)
       */
      setPermissions: (permissions: any[]) => {
        set({ permissions });
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
       * Check if user has specific permission (local evaluation)
       */
      checkPermission: (permission: string, context: AccessContext): boolean => {
        const state = usePermissionStore.getState();

        // Find matching permission in user permissions
        const hasPermission = state.userPermissions.some(userPerm => {
          // Check if permission ID matches
          if (userPerm.id !== permission) return false;

          // Check if permission is granted
          if (!userPerm.granted) return false;

          // Check if permission applies to the context
          return state.isPermissionApplicableToContext(userPerm, context);
        });

        return hasPermission;
      },

      /**
       * Check multiple permissions with local evaluation
       */
      checkMultiplePermissions: (permissions: string[], context: AccessContext, requireAll = false): boolean => {
        const state = usePermissionStore.getState();

        if (requireAll) {
          // AND logic: all permissions must be granted
          return permissions.every(permission => state.checkPermission(permission, context));
        } else {
          // OR logic: at least one permission must be granted
          return permissions.some(permission => state.checkPermission(permission, context));
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
 * Permission store utilities for common operations (all local evaluation)
 */
export const permissionStoreUtils = {
  /**
   * Initialize permissions with static data (no API call)
   */
  initialize: () => {
    const store = usePermissionStore.getState();
    // Set up any static permissions if needed
    store.setPermissions([]);
  },

  /**
   * Check if user can perform action on resource (local evaluation)
   */
  canPerformAction: (
    action: string,
    resource: string,
    context: AccessContext
  ): boolean => {
    const store = usePermissionStore.getState();
    const permission = `${resource}.${action}`;
    return store.checkPermission(permission, context);
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
   * Check if user has any permission from a list (local evaluation)
   */
  hasAnyPermission: (
    permissions: string[],
    context: AccessContext
  ): boolean => {
    const store = usePermissionStore.getState();
    return store.checkMultiplePermissions(permissions, context, false);
  },

  /**
   * Check if user has all permissions from a list (local evaluation)
   */
  hasAllPermissions: (
    permissions: string[],
    context: AccessContext
  ): boolean => {
    const store = usePermissionStore.getState();
    return store.checkMultiplePermissions(permissions, context, true);
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
   * Check if user has permission in specific workspace (local evaluation)
   */
  hasWorkspacePermission: (
    permission: string,
    workspaceId: string,
    tenantId?: string
  ): boolean => {
    const store = usePermissionStore.getState();
    const context: AccessContext = {
      userId: 'current',
      workspaceId,
      tenantId
    };
    return store.checkPermission(permission, context);
  },
};

export default usePermissionStore;