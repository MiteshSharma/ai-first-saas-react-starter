/**
 * @fileoverview Permission Service for RBAC System
 *
 * Provides role-based access control functionality:
 * - Permission checking for actions and resources
 * - Role and permission management
 * - Context-aware permissions (tenant/workspace)
 * - Plugin permission integration
 */

import type { User } from '../types';
import type { TenantContext, WorkspaceContext } from '../plugin-system/EventBus';

// Permission types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: 'global' | 'tenant' | 'workspace';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  scope: 'global' | 'tenant' | 'workspace';
  isBuiltIn: boolean;
}

export interface UserRole {
  userId: string;
  roleId: string;
  scope: 'global' | 'tenant' | 'workspace';
  scopeId?: string; // tenant or workspace ID
  assignedAt: string;
  assignedBy: string;
}

// Permission context for checks
export interface PermissionContext {
  user: User;
  tenant?: TenantContext;
  workspace?: WorkspaceContext;
}

// Permission check result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  role?: Role;
  permission?: Permission;
}

// Built-in permissions
const BUILT_IN_PERMISSIONS: Permission[] = [
  // Global permissions
  {
    id: 'global.admin',
    name: 'Global Administrator',
    description: 'Full system access',
    resource: '*',
    action: '*',
    scope: 'global',
  },

  // Tenant permissions
  {
    id: 'tenant.admin',
    name: 'Tenant Administrator',
    description: 'Full tenant access',
    resource: 'tenant',
    action: '*',
    scope: 'tenant',
  },
  {
    id: 'tenant.member.read',
    name: 'Read Tenant Members',
    description: 'View tenant members',
    resource: 'tenant.members',
    action: 'read',
    scope: 'tenant',
  },
  {
    id: 'tenant.member.write',
    name: 'Manage Tenant Members',
    description: 'Add, remove, and modify tenant members',
    resource: 'tenant.members',
    action: 'write',
    scope: 'tenant',
  },
  {
    id: 'tenant.settings.read',
    name: 'Read Tenant Settings',
    description: 'View tenant settings',
    resource: 'tenant.settings',
    action: 'read',
    scope: 'tenant',
  },
  {
    id: 'tenant.settings.write',
    name: 'Manage Tenant Settings',
    description: 'Modify tenant settings',
    resource: 'tenant.settings',
    action: 'write',
    scope: 'tenant',
  },

  // Workspace permissions
  {
    id: 'ws.admin',
    name: 'Workspace Administrator',
    description: 'Full workspace access',
    resource: 'workspace',
    action: '*',
    scope: 'workspace',
  },
  {
    id: 'ws.member.read',
    name: 'Read Workspace Members',
    description: 'View workspace members',
    resource: 'workspace.members',
    action: 'read',
    scope: 'workspace',
  },
  {
    id: 'ws.member.write',
    name: 'Manage Workspace Members',
    description: 'Add, remove, and modify workspace members',
    resource: 'workspace.members',
    action: 'write',
    scope: 'workspace',
  },
  {
    id: 'ws.content.read',
    name: 'Read Workspace Content',
    description: 'View workspace content',
    resource: 'workspace.content',
    action: 'read',
    scope: 'workspace',
  },
  {
    id: 'ws.content.write',
    name: 'Manage Workspace Content',
    description: 'Create, modify, and delete workspace content',
    resource: 'workspace.content',
    action: 'write',
    scope: 'workspace',
  },
];

// Built-in roles
const BUILT_IN_ROLES: Role[] = [
  {
    id: 'global.super_admin',
    name: 'Super Administrator',
    description: 'Full system access across all tenants',
    permissions: [BUILT_IN_PERMISSIONS.find(p => p.id === 'global.admin')!],
    scope: 'global',
    isBuiltIn: true,
  },
  {
    id: 'tenant.owner',
    name: 'Tenant Owner',
    description: 'Full control over tenant',
    permissions: [
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.admin')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.member.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.member.write')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.settings.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.settings.write')!,
    ],
    scope: 'tenant',
    isBuiltIn: true,
  },
  {
    id: 'tenant.admin',
    name: 'Tenant Administrator',
    description: 'Administrative access to tenant',
    permissions: [
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.member.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.member.write')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.settings.read')!,
    ],
    scope: 'tenant',
    isBuiltIn: true,
  },
  {
    id: 'tenant.member',
    name: 'Tenant Member',
    description: 'Basic tenant member',
    permissions: [
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.member.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'tenant.settings.read')!,
    ],
    scope: 'tenant',
    isBuiltIn: true,
  },
  {
    id: 'ws.admin',
    name: 'Workspace Administrator',
    description: 'Full control over workspace',
    permissions: [
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.admin')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.member.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.member.write')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.content.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.content.write')!,
    ],
    scope: 'workspace',
    isBuiltIn: true,
  },
  {
    id: 'ws.editor',
    name: 'Workspace Editor',
    description: 'Can edit workspace content',
    permissions: [
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.member.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.content.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.content.write')!,
    ],
    scope: 'workspace',
    isBuiltIn: true,
  },
  {
    id: 'ws.viewer',
    name: 'Workspace Viewer',
    description: 'Read-only access to workspace',
    permissions: [
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.member.read')!,
      BUILT_IN_PERMISSIONS.find(p => p.id === 'ws.content.read')!,
    ],
    scope: 'workspace',
    isBuiltIn: true,
  },
];

/**
 * Permission Service for RBAC functionality
 */
export class PermissionService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();

  constructor() {
    this.initializeBuiltInPermissions();
    this.initializeBuiltInRoles();
    this.initializeMockUserRoles();
  }

  // Initialize built-in permissions
  private initializeBuiltInPermissions(): void {
    BUILT_IN_PERMISSIONS.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  // Initialize built-in roles
  private initializeBuiltInRoles(): void {
    BUILT_IN_ROLES.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  // Initialize mock user roles for development
  private initializeMockUserRoles(): void {
    // Mock data - in real app, this would come from database
    const mockUserRoles: UserRole[] = [
      {
        userId: 'admin-user-1',
        roleId: 'global.super_admin',
        scope: 'global',
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'system',
      },
      {
        userId: 'regular-user-1',
        roleId: 'tenant.member',
        scope: 'tenant',
        scopeId: 'tenant-1',
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'admin-user-1',
      },
      {
        userId: 'regular-user-1',
        roleId: 'ws.editor',
        scope: 'workspace',
        scopeId: 'ws-1',
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'admin-user-1',
      },
    ];

    // Group by user ID
    mockUserRoles.forEach(userRole => {
      if (!this.userRoles.has(userRole.userId)) {
        this.userRoles.set(userRole.userId, []);
      }
      this.userRoles.get(userRole.userId)!.push(userRole);
    });
  }

  // Permission checking methods

  /**
   * Check if user has permission for a specific action and resource
   */
  hasPermission(
    context: PermissionContext,
    resource: string,
    action: string
  ): PermissionResult {
    const userRoles = this.getUserRoles(context.user.id);

    // Check global permissions first
    for (const userRole of userRoles) {
      if (userRole.scope === 'global') {
        const role = this.roles.get(userRole.roleId);
        if (role) {
          const permission = this.checkRolePermission(role, resource, action);
          if (permission) {
            return {
              allowed: true,
              role,
              permission,
            };
          }
        }
      }
    }

    // Check tenant permissions
    if (context.tenant) {
      for (const userRole of userRoles) {
        if (userRole.scope === 'tenant' && userRole.scopeId === context.tenant.id) {
          const role = this.roles.get(userRole.roleId);
          if (role) {
            const permission = this.checkRolePermission(role, resource, action);
            if (permission) {
              return {
                allowed: true,
                role,
                permission,
              };
            }
          }
        }
      }
    }

    // Check workspace permissions
    if (context.workspace) {
      for (const userRole of userRoles) {
        if (userRole.scope === 'workspace' && userRole.scopeId === context.workspace.id) {
          const role = this.roles.get(userRole.roleId);
          if (role) {
            const permission = this.checkRolePermission(role, resource, action);
            if (permission) {
              return {
                allowed: true,
                role,
                permission,
              };
            }
          }
        }
      }
    }

    return {
      allowed: false,
      reason: `No permission found for resource '${resource}' and action '${action}'`,
    };
  }

  /**
   * Check if user has any role in the given scope
   */
  hasRole(
    userId: string,
    roleId: string,
    scope: 'global' | 'tenant' | 'workspace',
    scopeId?: string
  ): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.some(userRole =>
      userRole.roleId === roleId &&
      userRole.scope === scope &&
      (scope === 'global' || userRole.scopeId === scopeId)
    );
  }

  /**
   * Get all roles for a user
   */
  getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  /**
   * Get user roles for specific scope
   */
  getUserRolesInScope(
    userId: string,
    scope: 'global' | 'tenant' | 'workspace',
    scopeId?: string
  ): UserRole[] {
    const userRoles = this.getUserRoles(userId);
    return userRoles.filter(userRole =>
      userRole.scope === scope &&
      (scope === 'global' || userRole.scopeId === scopeId)
    );
  }

  // Private helper methods

  /**
   * Check if a role has permission for resource and action
   */
  private checkRolePermission(role: Role, resource: string, action: string): Permission | null {
    for (const permission of role.permissions) {
      if (this.matchesPermission(permission, resource, action)) {
        return permission;
      }
    }
    return null;
  }

  /**
   * Check if permission matches resource and action
   */
  private matchesPermission(permission: Permission, resource: string, action: string): boolean {
    // Check wildcard permissions
    if (permission.resource === '*' && permission.action === '*') {
      return true;
    }

    // Check resource wildcard
    if (permission.resource === '*') {
      return permission.action === action || permission.action === '*';
    }

    // Check action wildcard
    if (permission.action === '*') {
      return permission.resource === resource || this.resourceMatches(permission.resource, resource);
    }

    // Exact match
    return (permission.resource === resource || this.resourceMatches(permission.resource, resource)) &&
           permission.action === action;
  }

  /**
   * Check if resource matches permission resource (with hierarchy support)
   */
  private resourceMatches(permissionResource: string, requestedResource: string): boolean {
    // Exact match
    if (permissionResource === requestedResource) {
      return true;
    }

    // Hierarchical match (e.g., 'tenant' matches 'tenant.members')
    if (requestedResource.startsWith(permissionResource + '.')) {
      return true;
    }

    return false;
  }

  // Management methods (for future use)

  /**
   * Add custom permission
   */
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  /**
   * Add custom role
   */
  addRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  /**
   * Assign role to user
   */
  assignRole(userRole: UserRole): void {
    if (!this.userRoles.has(userRole.userId)) {
      this.userRoles.set(userRole.userId, []);
    }
    this.userRoles.get(userRole.userId)!.push(userRole);
  }

  /**
   * Remove role from user
   */
  removeRole(userId: string, roleId: string, scope: string, scopeId?: string): void {
    const userRoles = this.userRoles.get(userId);
    if (userRoles) {
      const filteredRoles = userRoles.filter(userRole =>
        !(userRole.roleId === roleId &&
          userRole.scope === scope &&
          userRole.scopeId === scopeId)
      );
      this.userRoles.set(userId, filteredRoles);
    }
  }

  /**
   * Get all available permissions
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get all available roles
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get roles by scope
   */
  getRolesByScope(scope: 'global' | 'tenant' | 'workspace'): Role[] {
    return Array.from(this.roles.values()).filter(role => role.scope === scope);
  }
}

// Export singleton instance
export const permissionService = new PermissionService();