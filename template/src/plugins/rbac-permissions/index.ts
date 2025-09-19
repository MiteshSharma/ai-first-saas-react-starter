/**
 * @fileoverview RBAC & Permissions Plugin Entry Point
 *
 * Main export file for the RBAC & Permissions plugin
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Stores
export { usePermissionStore, permissionStoreUtils } from './stores/permissionStore';

// Hooks
export {
  usePermissions,
  useWorkspacePermissions,
  useTenantPermissions,
  useResourcePermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
} from './hooks/usePermissions';

// Components
export {
  PermissionGuard,
  EnhancedPermissionGuard,
  ActionPermissionGuard,
  RoleGuard,
  WorkspacePermissionGuard,
  TenantPermissionGuard,
} from './components/PermissionGuard';

export {
  PermissionGate,
  EnhancedPermissionGate,
  ActionPermissionGate,
  RolePermissionGate,
  WorkspacePermissionGate as WorkspacePermissionGate,
  TenantPermissionGate as TenantPermissionGate,
} from './components/PermissionGate';

export {
  withPermission,
  withSinglePermission,
  withAnyPermission,
  withAllPermissions,
  withRole,
  withAction,
  withWorkspacePermission,
  withTenantPermission,
} from './components/withPermission';

export { RoleManagement } from './components/RoleManagement';
export { UserRoleAssignment } from './components/UserRoleAssignment';
export { PermissionViewer } from './components/PermissionViewer';

// Pages
export { RBACDashboard } from './pages/RBACDashboard';

// Services
export { permissionService } from './services/permissionService';
export { roleService } from './services/roleService';

// API
export { rbacMockHandlers, rbacMockUtils } from './api/mockHandlers';

// Utilities
export { default as rbacUtils } from './utils/rbacUtils';

// Plugin configuration
export const RBACPermissionsPlugin = {
  name: 'rbac-permissions',
  version: '1.0.0',
  description: 'Role-Based Access Control and Permissions Management',

  // Plugin initialization
  initialize: async () => {
    const { permissionStoreUtils } = await import('./stores/permissionStore');
    await permissionStoreUtils.initialize();
  },

  // Plugin configuration
  config: {
    enableAuditLogging: true,
    cachePermissions: true,
    permissionRefreshInterval: 5 * 60 * 1000, // 5 minutes
  },
};

export default RBACPermissionsPlugin;