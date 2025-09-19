/**
 * @fileoverview React hooks for permission checking
 *
 * Provides convenient hooks for checking permissions in React components:
 * - usePermissions: Main hook for permission checking
 * - useHasPermission: Single permission check hook
 * - useHasRole: Role checking hook
 */

import { useMemo } from 'react';
import { useAuthStore } from '../auth/AuthStore';
import { useCoreContext } from '../context/CoreContext';
import { permissionService, type PermissionResult, type PermissionContext } from './PermissionService';

// Permission hook return type
export interface UsePermissionsReturn {
  hasPermission: (resource: string, action: string) => PermissionResult;
  hasRole: (roleId: string, scope: 'global' | 'tenant' | 'workspace', scopeId?: string) => boolean;
  context: PermissionContext | null;
  isLoading: boolean;
}

/**
 * Main permissions hook
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated } = useAuthStore();
  const { state } = useCoreContext();

  // Create permission context
  const context: PermissionContext | null = useMemo(() => {
    if (!isAuthenticated || !user) {
      return null;
    }

    return {
      user,
      tenant: state.currentTenant || undefined,
      workspace: state.currentWorkspace || undefined,
    };
  }, [isAuthenticated, user, state.currentTenant, state.currentWorkspace]);

  // Permission checking function
  const hasPermission = useMemo(() => {
    return (resource: string, action: string): PermissionResult => {
      if (!context) {
        return {
          allowed: false,
          reason: 'User not authenticated or context not available',
        };
      }

      return permissionService.hasPermission(context, resource, action);
    };
  }, [context]);

  // Role checking function
  const hasRole = useMemo(() => {
    return (roleId: string, scope: 'global' | 'tenant' | 'workspace', scopeId?: string): boolean => {
      if (!user) {
        return false;
      }

      return permissionService.hasRole(user.id, roleId, scope, scopeId);
    };
  }, [user]);

  return {
    hasPermission,
    hasRole,
    context,
    isLoading: state.isLoading || state.isContextSwitching,
  };
}

/**
 * Hook for checking a single permission
 */
export function useHasPermission(resource: string, action: string): {
  allowed: boolean;
  loading: boolean;
  result: PermissionResult;
} {
  const { hasPermission, isLoading } = usePermissions();

  const result = useMemo(() => {
    return hasPermission(resource, action);
  }, [hasPermission, resource, action]);

  return {
    allowed: result.allowed,
    loading: isLoading,
    result,
  };
}

/**
 * Hook for checking if user has a specific role
 */
export function useHasRole(
  roleId: string,
  scope: 'global' | 'tenant' | 'workspace',
  scopeId?: string
): {
  hasRole: boolean;
  loading: boolean;
} {
  const { hasRole, isLoading } = usePermissions();

  const result = useMemo(() => {
    return hasRole(roleId, scope, scopeId);
  }, [hasRole, roleId, scope, scopeId]);

  return {
    hasRole: result,
    loading: isLoading,
  };
}

/**
 * Hook for getting user roles in current context
 */
export function useUserRoles(): {
  globalRoles: string[];
  tenantRoles: string[];
  workspaceRoles: string[];
  loading: boolean;
} {
  const { user } = useAuthStore();
  const { state } = useCoreContext();

  const roles = useMemo(() => {
    if (!user) {
      return {
        globalRoles: [],
        tenantRoles: [],
        workspaceRoles: [],
      };
    }

    const userRoles = permissionService.getUserRoles(user.id);

    const globalRoles = userRoles
      .filter(role => role.scope === 'global')
      .map(role => role.roleId);

    const tenantRoles = userRoles
      .filter(role =>
        role.scope === 'tenant' &&
        role.scopeId === state.currentTenant?.id
      )
      .map(role => role.roleId);

    const workspaceRoles = userRoles
      .filter(role =>
        role.scope === 'workspace' &&
        role.scopeId === state.currentWorkspace?.id
      )
      .map(role => role.roleId);

    return {
      globalRoles,
      tenantRoles,
      workspaceRoles,
    };
  }, [user, state.currentTenant, state.currentWorkspace]);

  return {
    ...roles,
    loading: state.isLoading || state.isContextSwitching,
  };
}

/**
 * Hook for admin-level permissions
 */
export function useIsAdmin(): {
  isGlobalAdmin: boolean;
  isTenantAdmin: boolean;
  isWorkspaceAdmin: boolean;
  loading: boolean;
} {
  const { hasRole, isLoading } = usePermissions();
  const { state } = useCoreContext();

  const adminStatus = useMemo(() => {
    const isGlobalAdmin = hasRole('global.super_admin', 'global');

    const isTenantAdmin = state.currentTenant ?
      hasRole('tenant.owner', 'tenant', state.currentTenant.id) ||
      hasRole('tenant.admin', 'tenant', state.currentTenant.id) : false;

    const isWorkspaceAdmin = state.currentWorkspace ?
      hasRole('ws.admin', 'workspace', state.currentWorkspace.id) : false;

    return {
      isGlobalAdmin,
      isTenantAdmin,
      isWorkspaceAdmin,
    };
  }, [hasRole, state.currentTenant, state.currentWorkspace]);

  return {
    ...adminStatus,
    loading: isLoading,
  };
}