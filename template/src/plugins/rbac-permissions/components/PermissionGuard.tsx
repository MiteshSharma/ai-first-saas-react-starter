/**
 * @fileoverview Permission Guard Component
 *
 * Conditional rendering component based on user permissions
 */

import React, { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuardProps, AccessContext } from '../types';

// Re-export for convenience
export type { PermissionGuardProps };

/**
 * Permission Guard Component
 *
 * Conditionally renders children based on permission checks
 * Supports both single permission and multiple permissions with AND/OR logic
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  operator = 'OR',
  roles,
  fallback,
  children,
  context,
  loading: externalLoading = false,
  showLoader = true,
  showFallback = true,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading: permissionLoading,
    error,
  } = usePermissions();

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  /**
   * Check permissions on component mount and when dependencies change
   */
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingPermissions(true);
      setHasAccess(null);

      try {
        let result = false;

        // Check single permission
        if (permission) {
          result = await hasPermission(permission, context);
        }
        // Check multiple permissions
        else if (permissions && permissions.length > 0) {
          if (operator === 'AND') {
            result = await hasAllPermissions(permissions, context);
          } else {
            result = await hasAnyPermission(permissions, context);
          }
        }
        // Check roles (simplified - would need role store integration)
        else if (roles && roles.length > 0) {
          // For now, assume access if roles are specified
          // In full implementation, this would check user's roles
          result = true;
        }
        // Default to true if no restrictions specified
        else {
          result = true;
        }

        setHasAccess(result);
      } catch (err) {
        console.error('Permission check failed:', err);
        setHasAccess(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkAccess();
  }, [
    permission,
    permissions,
    operator,
    roles,
    context,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  ]);

  // Show loading state
  const isLoading = externalLoading || permissionLoading || checkingPermissions;
  if (isLoading && showLoader) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <Spin size="small" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return showFallback ? (
      <Alert
        message="Permission Error"
        description="Unable to verify permissions. Please try again."
        type="error"
        showIcon
      />
    ) : null;
  }

  // Show access denied state
  if (hasAccess === false) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Alert
        message="Access Denied"
        description="You don't have permission to view this content."
        type="warning"
        icon={<LockOutlined />}
        showIcon
      />
    );
  }

  // Show children if access is granted
  if (hasAccess === true) {
    return <>{children}</>;
  }

  // Default fallback while determining access
  return null;
};

/**
 * Enhanced Permission Guard with additional features
 */
interface EnhancedPermissionGuardProps extends PermissionGuardProps {
  context?: Partial<AccessContext>;
  loading?: boolean;
  showLoader?: boolean;
  showFallback?: boolean;
  onAccessDenied?: () => void;
  onAccessGranted?: () => void;
}

export const EnhancedPermissionGuard: React.FC<EnhancedPermissionGuardProps> = ({
  onAccessDenied,
  onAccessGranted,
  ...props
}) => {
  const [previousAccess, setPreviousAccess] = useState<boolean | null>(null);

  return (
    <PermissionGuard
      {...props}
      fallback={
        props.fallback !== undefined ? props.fallback : (
          <Alert
            message="Access Restricted"
            description="This feature requires additional permissions."
            type="info"
            icon={<LockOutlined />}
            showIcon
          />
        )
      }
    >
      {props.children}
    </PermissionGuard>
  );
};

/**
 * Permission Guard for specific actions
 */
interface ActionPermissionGuardProps {
  action: string;
  resource: string;
  context?: Partial<AccessContext>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ActionPermissionGuard: React.FC<ActionPermissionGuardProps> = ({
  action,
  resource,
  context,
  fallback,
  children,
}) => {
  const permission = `${resource}.${action}`;

  return (
    <PermissionGuard
      permission={permission}
      context={context}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Role-based guard component
 */
interface RoleGuardProps {
  roles: string[];
  operator?: 'AND' | 'OR';
  context?: Partial<AccessContext>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  operator = 'OR',
  context,
  fallback,
  children,
}) => {
  return (
    <PermissionGuard
      roles={roles}
      operator={operator}
      context={context}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Workspace permission guard
 */
interface WorkspacePermissionGuardProps {
  permission?: string;
  permissions?: string[];
  operator?: 'AND' | 'OR';
  workspaceId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WorkspacePermissionGuard: React.FC<WorkspacePermissionGuardProps> = ({
  workspaceId,
  ...props
}) => {
  const context = { workspaceId };

  return (
    <PermissionGuard
      {...props}
      context={context}
    />
  );
};

/**
 * Tenant permission guard
 */
interface TenantPermissionGuardProps {
  permission?: string;
  permissions?: string[];
  operator?: 'AND' | 'OR';
  tenantId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const TenantPermissionGuard: React.FC<TenantPermissionGuardProps> = ({
  tenantId,
  ...props
}) => {
  const context = { tenantId };

  return (
    <PermissionGuard
      {...props}
      context={context}
    />
  );
};

export default PermissionGuard;