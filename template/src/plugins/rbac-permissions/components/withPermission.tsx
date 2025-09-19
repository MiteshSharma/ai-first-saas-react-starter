/**
 * @fileoverview withPermission Higher-Order Component
 *
 * HOC for wrapping components with permission checking functionality
 */

import React, { ComponentType, forwardRef } from 'react';
import { PermissionGuard, PermissionGuardProps } from './PermissionGuard';

/**
 * Props that will be passed to wrapped component
 */
interface WithPermissionProps extends Omit<PermissionGuardProps, 'children'> {
  // Additional props for HOC configuration
  displayName?: string;
}

/**
 * Higher-order component for permission checking
 *
 * @example
 * ```tsx
 * const ProtectedButton = withPermission({
 *   permission: 'users.edit'
 * })(Button);
 *
 * // Usage
 * <ProtectedButton onClick={handleEdit}>Edit User</ProtectedButton>
 * ```
 */
export function withPermission<P extends object>(
  permissionConfig: WithPermissionProps
) {
  return function <T extends ComponentType<P>>(WrappedComponent: T) {
    const WithPermissionComponent = forwardRef<any, P>((props, ref) => {
      const {
        displayName,
        ...guardProps
      } = permissionConfig;

      return (
        <PermissionGuard {...guardProps}>
          <WrappedComponent {...(props as any)} ref={ref} />
        </PermissionGuard>
      );
    });

    // Set display name for debugging
    const componentName = permissionConfig.displayName ||
                         WrappedComponent.displayName ||
                         WrappedComponent.name ||
                         'Component';
    WithPermissionComponent.displayName = `withPermission(${componentName})`;

    return WithPermissionComponent as unknown as T;
  };
}

/**
 * Convenience HOC for single permission checking
 */
export const withSinglePermission = (
  permission: string,
  context?: WithPermissionProps['context']
) => withPermission({ permission, context });

/**
 * Convenience HOC for multiple permissions with OR logic
 */
export const withAnyPermission = (
  permissions: string[],
  context?: WithPermissionProps['context']
) => withPermission({ permissions, operator: 'OR', context });

/**
 * Convenience HOC for multiple permissions with AND logic
 */
export const withAllPermissions = (
  permissions: string[],
  context?: WithPermissionProps['context']
) => withPermission({ permissions, operator: 'AND', context });

/**
 * Convenience HOC for role-based protection
 */
export const withRole = (
  roles: string[],
  operator: 'AND' | 'OR' = 'OR',
  context?: WithPermissionProps['context']
) => withPermission({ roles, operator, context });

/**
 * Convenience HOC for action-based protection
 */
export const withAction = (
  action: string,
  resource: string,
  context?: WithPermissionProps['context']
) => {
  const permission = `${resource}.${action}`;
  return withPermission({ permission, context });
};

/**
 * Convenience HOC for workspace-scoped permissions
 */
export const withWorkspacePermission = (
  permission: string,
  workspaceId?: string
) => withPermission({
  permission,
  context: { workspaceId }
});

/**
 * Convenience HOC for tenant-scoped permissions
 */
export const withTenantPermission = (
  permission: string,
  tenantId?: string
) => withPermission({
  permission,
  context: { tenantId }
});

export default withPermission;