/**
 * @fileoverview PermissionGate Component
 *
 * Simple alias for PermissionGuard with a more intuitive name
 * Provides cleaner API for conditional rendering based on permissions
 */

import React from 'react';
import {
  PermissionGuard,
  EnhancedPermissionGuard,
  ActionPermissionGuard,
  RoleGuard,
  WorkspacePermissionGuard,
  TenantPermissionGuard,
  PermissionGuardProps
} from './PermissionGuard';

/**
 * PermissionGate - Simple alias for PermissionGuard
 *
 * This component provides a more intuitive name for conditional rendering
 * based on permissions. It's identical to PermissionGuard but with a name
 * that better reflects its purpose as a "gate" that controls access.
 *
 * @example
 * ```tsx
 * <PermissionGate permission="users.edit">
 *   <EditButton />
 * </PermissionGate>
 *
 * <PermissionGate permissions={['users.edit', 'users.delete']} operator="OR">
 *   <UserActionsMenu />
 * </PermissionGate>
 * ```
 */
export const PermissionGate: React.FC<PermissionGuardProps> = (props) => {
  return <PermissionGuard {...props} />;
};

/**
 * Enhanced PermissionGate with additional features
 */
export const EnhancedPermissionGate: React.FC<Parameters<typeof EnhancedPermissionGuard>[0]> = (props) => {
  return <EnhancedPermissionGuard {...props} />;
};

/**
 * Action-specific PermissionGate
 *
 * @example
 * ```tsx
 * <ActionPermissionGate action="edit" resource="users">
 *   <EditButton />
 * </ActionPermissionGate>
 * ```
 */
export const ActionPermissionGate: React.FC<Parameters<typeof ActionPermissionGuard>[0]> = (props) => {
  return <ActionPermissionGuard {...props} />;
};

/**
 * Role-based PermissionGate
 *
 * @example
 * ```tsx
 * <RolePermissionGate roles={['admin', 'moderator']}>
 *   <AdminPanel />
 * </RolePermissionGate>
 * ```
 */
export const RolePermissionGate: React.FC<Parameters<typeof RoleGuard>[0]> = (props) => {
  return <RoleGuard {...props} />;
};

/**
 * Workspace-scoped PermissionGate
 *
 * @example
 * ```tsx
 * <WorkspacePermissionGate permission="projects.edit" workspaceId="ws-123">
 *   <EditProjectButton />
 * </WorkspacePermissionGate>
 * ```
 */
export const WorkspacePermissionGate: React.FC<Parameters<typeof WorkspacePermissionGuard>[0]> = (props) => {
  return <WorkspacePermissionGuard {...props} />;
};

/**
 * Tenant-scoped PermissionGate
 *
 * @example
 * ```tsx
 * <TenantPermissionGate permission="settings.edit" tenantId="tenant-123">
 *   <TenantSettingsButton />
 * </TenantPermissionGate>
 * ```
 */
export const TenantPermissionGate: React.FC<Parameters<typeof TenantPermissionGuard>[0]> = (props) => {
  return <TenantPermissionGuard {...props} />;
};

// Export all gate variants for convenience
export {
  PermissionGuard,
  EnhancedPermissionGuard,
  ActionPermissionGuard,
  RoleGuard,
  WorkspacePermissionGuard,
  TenantPermissionGuard
} from './PermissionGuard';

export default PermissionGate;