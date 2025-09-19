/**
 * @fileoverview RBAC Constants
 *
 * Predefined permissions, roles, and system constants for RBAC system
 */

import { Permission, Role, RoleTemplate, PermissionAction, PermissionResource } from './types';

// ============================================================================
// System Permissions
// ============================================================================

/**
 * Predefined system permissions with hierarchical structure
 */
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Tenant Management
  {
    id: 'tenant.create',
    name: 'Create Tenant',
    description: 'Create new tenants',
    action: 'create',
    resource: 'tenant',
    scope: 'system',
    category: 'Tenant Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant.read',
    name: 'View Tenant',
    description: 'View tenant information',
    action: 'read',
    resource: 'tenant',
    scope: 'tenant',
    category: 'Tenant Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant.update',
    name: 'Update Tenant',
    description: 'Modify tenant settings',
    action: 'update',
    resource: 'tenant',
    scope: 'tenant',
    category: 'Tenant Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant.delete',
    name: 'Delete Tenant',
    description: 'Delete tenant',
    action: 'delete',
    resource: 'tenant',
    scope: 'tenant',
    category: 'Tenant Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant.manage',
    name: 'Manage Tenant',
    description: 'Full tenant management access',
    action: 'manage',
    resource: 'tenant',
    scope: 'tenant',
    category: 'Tenant Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Workspace Management
  {
    id: 'workspace.create',
    name: 'Create Workspace',
    description: 'Create new workspaces',
    action: 'create',
    resource: 'workspace',
    scope: 'tenant',
    category: 'Workspace Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace.read',
    name: 'View Workspace',
    description: 'View workspace information',
    action: 'read',
    resource: 'workspace',
    scope: 'workspace',
    category: 'Workspace Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace.update',
    name: 'Update Workspace',
    description: 'Modify workspace settings',
    action: 'update',
    resource: 'workspace',
    scope: 'workspace',
    category: 'Workspace Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace.delete',
    name: 'Delete Workspace',
    description: 'Delete workspace',
    action: 'delete',
    resource: 'workspace',
    scope: 'workspace',
    category: 'Workspace Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace.settings.manage',
    name: 'Manage Workspace Settings',
    description: 'Configure workspace settings',
    action: 'manage',
    resource: 'workspace',
    scope: 'workspace',
    category: 'Workspace Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // User Management
  {
    id: 'user.create',
    name: 'Create User',
    description: 'Invite new users',
    action: 'create',
    resource: 'user',
    scope: 'tenant',
    category: 'User Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user.read',
    name: 'View Users',
    description: 'View user information',
    action: 'read',
    resource: 'user',
    scope: 'tenant',
    category: 'User Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user.update',
    name: 'Update Users',
    description: 'Modify user information',
    action: 'update',
    resource: 'user',
    scope: 'tenant',
    category: 'User Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user.delete',
    name: 'Remove Users',
    description: 'Remove users from tenant',
    action: 'delete',
    resource: 'user',
    scope: 'tenant',
    category: 'User Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Role & Permission Management
  {
    id: 'role.create',
    name: 'Create Role',
    description: 'Create custom roles',
    action: 'create',
    resource: 'role',
    scope: 'tenant',
    category: 'Role Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role.read',
    name: 'View Roles',
    description: 'View role information',
    action: 'read',
    resource: 'role',
    scope: 'tenant',
    category: 'Role Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role.update',
    name: 'Update Roles',
    description: 'Modify role permissions',
    action: 'update',
    resource: 'role',
    scope: 'tenant',
    category: 'Role Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role.delete',
    name: 'Delete Roles',
    description: 'Delete custom roles',
    action: 'delete',
    resource: 'role',
    scope: 'tenant',
    category: 'Role Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role.assign',
    name: 'Assign Roles',
    description: 'Assign roles to users',
    action: 'manage',
    resource: 'role',
    scope: 'tenant',
    category: 'Role Management',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Settings Management
  {
    id: 'settings.tenant.read',
    name: 'View Tenant Settings',
    description: 'View tenant configuration',
    action: 'read',
    resource: 'settings',
    scope: 'tenant',
    category: 'Settings',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'settings.tenant.update',
    name: 'Update Tenant Settings',
    description: 'Modify tenant configuration',
    action: 'update',
    resource: 'settings',
    scope: 'tenant',
    category: 'Settings',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Audit & Compliance
  {
    id: 'audit.read',
    name: 'View Audit Logs',
    description: 'Access audit trail',
    action: 'read',
    resource: 'audit',
    scope: 'tenant',
    category: 'Audit & Compliance',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'audit.export',
    name: 'Export Audit Logs',
    description: 'Export audit data',
    action: 'export',
    resource: 'audit',
    scope: 'tenant',
    category: 'Audit & Compliance',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Dashboard & Analytics
  {
    id: 'dashboard.read',
    name: 'View Dashboard',
    description: 'Access dashboard and analytics',
    action: 'read',
    resource: 'dashboard',
    scope: 'workspace',
    category: 'Dashboard',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dashboard.export',
    name: 'Export Dashboard Data',
    description: 'Export dashboard reports',
    action: 'export',
    resource: 'dashboard',
    scope: 'workspace',
    category: 'Dashboard',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Integration Management
  {
    id: 'integration.read',
    name: 'View Integrations',
    description: 'View connected integrations',
    action: 'read',
    resource: 'integration',
    scope: 'workspace',
    category: 'Integrations',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'integration.manage',
    name: 'Manage Integrations',
    description: 'Configure integrations',
    action: 'manage',
    resource: 'integration',
    scope: 'workspace',
    category: 'Integrations',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// System Roles
// ============================================================================

/**
 * Predefined system roles with permission assignments
 */
export const SYSTEM_ROLES: Role[] = [
  // System Level Roles
  {
    id: 'system-owner',
    name: 'System Owner',
    description: 'Full system access and administration',
    type: 'system',
    level: 'owner',
    permissions: SYSTEM_PERMISSIONS.map(p => p.id),
    isSystem: true,
    isDefault: false,
    color: '#722ed1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Tenant Level Roles
  {
    id: 'tenant-owner',
    name: 'Tenant Owner',
    description: 'Full tenant access and management',
    type: 'tenant',
    level: 'owner',
    permissions: [
      'tenant.read', 'tenant.update', 'tenant.manage',
      'workspace.create', 'workspace.read', 'workspace.update', 'workspace.delete', 'workspace.settings.manage',
      'user.create', 'user.read', 'user.update', 'user.delete',
      'role.create', 'role.read', 'role.update', 'role.delete', 'role.assign',
      'settings.tenant.read', 'settings.tenant.update',
      'audit.read', 'audit.export',
      'dashboard.read', 'dashboard.export',
      'integration.read', 'integration.manage',
    ],
    isSystem: true,
    isDefault: true,
    color: '#f5222d',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant-admin',
    name: 'Tenant Admin',
    description: 'Tenant administration without billing access',
    type: 'tenant',
    level: 'admin',
    permissions: [
      'tenant.read',
      'workspace.create', 'workspace.read', 'workspace.update', 'workspace.delete', 'workspace.settings.manage',
      'user.create', 'user.read', 'user.update', 'user.delete',
      'role.read', 'role.assign',
      'settings.tenant.read',
      'audit.read',
      'dashboard.read', 'dashboard.export',
      'integration.read', 'integration.manage',
    ],
    isSystem: true,
    isDefault: true,
    color: '#fa541c',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant-manager',
    name: 'Tenant Manager',
    description: 'Workspace and user management',
    type: 'tenant',
    level: 'manager',
    permissions: [
      'tenant.read',
      'workspace.create', 'workspace.read', 'workspace.update', 'workspace.settings.manage',
      'user.create', 'user.read', 'user.update',
      'role.read',
      'settings.tenant.read',
      'dashboard.read',
      'integration.read',
    ],
    isSystem: true,
    isDefault: true,
    color: '#fa8c16',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant-member',
    name: 'Tenant Member',
    description: 'Basic tenant access',
    type: 'tenant',
    level: 'member',
    permissions: [
      'tenant.read',
      'workspace.read',
      'user.read',
      'dashboard.read',
    ],
    isSystem: true,
    isDefault: true,
    color: '#1890ff',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Workspace Level Roles
  {
    id: 'workspace-admin',
    name: 'Workspace Admin',
    description: 'Full workspace management',
    type: 'workspace',
    level: 'admin',
    permissions: [
      'workspace.read', 'workspace.update', 'workspace.settings.manage',
      'user.read',
      'dashboard.read', 'dashboard.export',
      'integration.read', 'integration.manage',
    ],
    isSystem: true,
    isDefault: true,
    color: '#52c41a',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-editor',
    name: 'Workspace Editor',
    description: 'Edit workspace content',
    type: 'workspace',
    level: 'member',
    permissions: [
      'workspace.read', 'workspace.update',
      'dashboard.read',
      'integration.read',
    ],
    isSystem: true,
    isDefault: true,
    color: '#13c2c2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-viewer',
    name: 'Workspace Viewer',
    description: 'Read-only workspace access',
    type: 'workspace',
    level: 'viewer',
    permissions: [
      'workspace.read',
      'dashboard.read',
    ],
    isSystem: true,
    isDefault: true,
    color: '#722ed1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// Role Templates
// ============================================================================

/**
 * Role templates for common configurations
 */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'template-developer',
    name: 'Developer',
    description: 'Development team member with workspace access',
    type: 'workspace',
    level: 'member',
    permissions: [
      'workspace.read', 'workspace.update',
      'dashboard.read',
      'integration.read',
    ],
    category: 'Development',
    isBuiltIn: true,
  },
  {
    id: 'template-analyst',
    name: 'Data Analyst',
    description: 'Analytics and reporting specialist',
    type: 'workspace',
    level: 'member',
    permissions: [
      'workspace.read',
      'dashboard.read', 'dashboard.export',
    ],
    category: 'Analytics',
    isBuiltIn: true,
  },
  {
    id: 'template-manager',
    name: 'Project Manager',
    description: 'Project management with workspace oversight',
    type: 'workspace',
    level: 'manager',
    permissions: [
      'workspace.read', 'workspace.update', 'workspace.settings.manage',
      'user.read',
      'dashboard.read', 'dashboard.export',
      'integration.read',
    ],
    category: 'Management',
    isBuiltIn: true,
  },
  {
    id: 'template-client',
    name: 'Client Access',
    description: 'External client with limited read access',
    type: 'workspace',
    level: 'viewer',
    permissions: [
      'workspace.read',
      'dashboard.read',
    ],
    category: 'External',
    isBuiltIn: true,
  },
];

// ============================================================================
// Permission Categories
// ============================================================================

/**
 * Permission categories for organization
 */
export const PERMISSION_CATEGORIES = [
  'Tenant Management',
  'Workspace Management',
  'User Management',
  'Role Management',
  'Settings',
  'Audit & Compliance',
  'Dashboard',
  'Integrations',
] as const;

// ============================================================================
// Role Colors
// ============================================================================

/**
 * Predefined colors for role tags
 */
export const ROLE_COLORS = [
  '#f5222d', // red
  '#fa541c', // volcano
  '#fa8c16', // orange
  '#faad14', // gold
  '#fadb14', // yellow
  '#a0d911', // lime
  '#52c41a', // green
  '#13c2c2', // cyan
  '#1890ff', // blue
  '#2f54eb', // geekblue
  '#722ed1', // purple
  '#eb2f96', // magenta
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get permission by ID
 */
export const getPermissionById = (id: string): Permission | undefined => {
  return SYSTEM_PERMISSIONS.find(p => p.id === id);
};

/**
 * Get role by ID
 */
export const getRoleById = (id: string): Role | undefined => {
  return SYSTEM_ROLES.find(r => r.id === id);
};

/**
 * Get permissions by category
 */
export const getPermissionsByCategory = (category: string): Permission[] => {
  return SYSTEM_PERMISSIONS.filter(p => p.category === category);
};

/**
 * Get roles by type
 */
export const getRolesByType = (type: Role['type']): Role[] => {
  return SYSTEM_ROLES.filter(r => r.type === type);
};

/**
 * Check if role has permission
 */
export const roleHasPermission = (role: Role, permissionId: string): boolean => {
  return role.permissions.includes(permissionId);
};