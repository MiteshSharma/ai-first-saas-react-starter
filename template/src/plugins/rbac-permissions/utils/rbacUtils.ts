/**
 * @fileoverview RBAC Utility Functions
 *
 * Utility functions for role-based access control operations
 */

import {
  Permission,
  Role,
  ContextualPermission,
  AccessContext,
  UserRole,
  PermissionScope,
  PermissionAction,
  PermissionResource,
} from '../types';

/**
 * Permission hierarchy utilities
 */
export const PermissionHierarchy = {
  /**
   * Check if one scope contains another
   */
  scopeContains: (parentScope: PermissionScope, childScope: PermissionScope): boolean => {
    const hierarchy: PermissionScope[] = ['system', 'tenant', 'workspace', 'resource'];
    const parentIndex = hierarchy.indexOf(parentScope);
    const childIndex = hierarchy.indexOf(childScope);
    return parentIndex <= childIndex;
  },

  /**
   * Get inherited permissions from parent scopes
   */
  getInheritedPermissions: (
    permissions: ContextualPermission[],
    targetScope: PermissionScope
  ): ContextualPermission[] => {
    return permissions.filter(permission =>
      PermissionHierarchy.scopeContains(permission.scope, targetScope)
    );
  },

  /**
   * Calculate effective permissions considering inheritance
   */
  calculateEffectivePermissions: (
    permissions: ContextualPermission[],
    context: AccessContext
  ): ContextualPermission[] => {
    return permissions.filter(permission => {
      // Check if permission applies to the current context
      switch (permission.scope) {
        case 'system':
          return true;
        case 'tenant':
          return permission.tenantId === context.tenantId;
        case 'workspace':
          return permission.workspaceId === context.workspaceId;
        case 'resource':
          return permission.resourceId === context.resourceId &&
                 permission.resourceType === context.resourceType;
        default:
          return false;
      }
    });
  },
};

/**
 * Role hierarchy utilities
 */
export const RoleHierarchy = {
  /**
   * Check if a role inherits from another role
   */
  inheritsFrom: (role: Role, parentRoleId: string): boolean => {
    return role.inheritedFrom === parentRoleId;
  },

  /**
   * Get all permissions from a role and its parent roles
   */
  getAllRolePermissions: (role: Role, allRoles: Role[]): string[] => {
    const permissions = new Set(role.permissions);

    // Add permissions from inherited roles
    if (role.inheritedFrom) {
      const parentRole = allRoles.find(r => r.id === role.inheritedFrom);
      if (parentRole) {
        const parentPermissions = RoleHierarchy.getAllRolePermissions(parentRole, allRoles);
        parentPermissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  },

  /**
   * Check for circular inheritance
   */
  hasCircularInheritance: (role: Role, allRoles: Role[], visited: Set<string> = new Set()): boolean => {
    if (visited.has(role.id)) {
      return true;
    }

    visited.add(role.id);

    if (role.inheritedFrom) {
      const parentRole = allRoles.find(r => r.id === role.inheritedFrom);
      if (parentRole) {
        return RoleHierarchy.hasCircularInheritance(parentRole, allRoles, visited);
      }
    }

    return false;
  },
};

/**
 * Permission validation utilities
 */
export const PermissionValidator = {
  /**
   * Validate permission ID format
   */
  isValidPermissionId: (permissionId: string): boolean => {
    const pattern = /^[a-z]+\.[a-z]+$/;
    return pattern.test(permissionId);
  },

  /**
   * Validate permission action
   */
  isValidAction: (action: string): action is PermissionAction => {
    const validActions: PermissionAction[] = [
      'create', 'read', 'update', 'delete', 'manage', 'assign', 'export'
    ];
    return validActions.includes(action as PermissionAction);
  },

  /**
   * Validate permission resource
   */
  isValidResource: (resource: string): resource is PermissionResource => {
    const validResources: PermissionResource[] = [
      'tenant', 'workspace', 'user', 'role', 'settings', 'audit', 'dashboard', 'integration'
    ];
    return validResources.includes(resource as PermissionResource);
  },

  /**
   * Validate permission scope
   */
  isValidScope: (scope: string): scope is PermissionScope => {
    const validScopes: PermissionScope[] = ['system', 'tenant', 'workspace', 'resource'];
    return validScopes.includes(scope as PermissionScope);
  },

  /**
   * Validate permission object
   */
  validatePermission: (permission: Partial<Permission>): string[] => {
    const errors: string[] = [];

    if (!permission.id || !PermissionValidator.isValidPermissionId(permission.id)) {
      errors.push('Invalid permission ID format. Use "resource.action" format.');
    }

    if (!permission.name || permission.name.trim().length === 0) {
      errors.push('Permission name is required.');
    }

    if (!permission.action || !PermissionValidator.isValidAction(permission.action)) {
      errors.push('Invalid permission action.');
    }

    if (!permission.resource || !PermissionValidator.isValidResource(permission.resource)) {
      errors.push('Invalid permission resource.');
    }

    if (!permission.scope || !PermissionValidator.isValidScope(permission.scope)) {
      errors.push('Invalid permission scope.');
    }

    return errors;
  },

  /**
   * Validate role object
   */
  validateRole: (role: Partial<Role>, allRoles: Role[] = []): string[] => {
    const errors: string[] = [];

    if (!role.name || role.name.trim().length === 0) {
      errors.push('Role name is required.');
    }

    if (!role.description || role.description.trim().length === 0) {
      errors.push('Role description is required.');
    }

    if (role.permissions && !Array.isArray(role.permissions)) {
      errors.push('Permissions must be an array.');
    }

    if (role.inheritedFrom) {
      const parentRole = allRoles.find(r => r.id === role.inheritedFrom);
      if (!parentRole) {
        errors.push('Parent role not found.');
      } else if (role.id && RoleHierarchy.hasCircularInheritance(role as Role, allRoles)) {
        errors.push('Circular inheritance detected.');
      }
    }

    return errors;
  },
};

/**
 * Permission matching utilities
 */
export const PermissionMatcher = {
  /**
   * Check if a permission matches a pattern (supports wildcards)
   */
  matches: (permission: string, pattern: string): boolean => {
    if (pattern === '*') return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return permission.startsWith(prefix);
    }
    return permission === pattern;
  },

  /**
   * Find permissions matching a pattern
   */
  findMatching: (permissions: string[], pattern: string): string[] => {
    return permissions.filter(permission => PermissionMatcher.matches(permission, pattern));
  },

  /**
   * Check if permissions list contains a required permission (with wildcard support)
   */
  hasPermission: (userPermissions: string[], requiredPermission: string): boolean => {
    return userPermissions.some(permission =>
      PermissionMatcher.matches(requiredPermission, permission)
    );
  },

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission: (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(required =>
      PermissionMatcher.hasPermission(userPermissions, required)
    );
  },

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions: (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(required =>
      PermissionMatcher.hasPermission(userPermissions, required)
    );
  },
};

/**
 * Context utilities
 */
export const ContextUtils = {
  /**
   * Build access context from various sources
   */
  buildContext: (
    base: Partial<AccessContext>,
    overrides: Partial<AccessContext> = {}
  ): AccessContext => {
    return {
      userId: overrides.userId || base.userId || 'anonymous',
      tenantId: overrides.tenantId || base.tenantId,
      workspaceId: overrides.workspaceId || base.workspaceId,
      resourceId: overrides.resourceId || base.resourceId,
      resourceType: overrides.resourceType || base.resourceType,
    };
  },

  /**
   * Check if two contexts are equivalent
   */
  isEqual: (context1: AccessContext, context2: AccessContext): boolean => {
    return (
      context1.userId === context2.userId &&
      context1.tenantId === context2.tenantId &&
      context1.workspaceId === context2.workspaceId &&
      context1.resourceId === context2.resourceId &&
      context1.resourceType === context2.resourceType
    );
  },

  /**
   * Get context scope level
   */
  getScope: (context: AccessContext): PermissionScope => {
    if (context.resourceId && context.resourceType) {
      return 'resource';
    }
    if (context.workspaceId) {
      return 'workspace';
    }
    if (context.tenantId) {
      return 'tenant';
    }
    return 'system';
  },

  /**
   * Check if context is within another context
   */
  isWithin: (childContext: AccessContext, parentContext: AccessContext): boolean => {
    // Check tenant scope
    if (parentContext.tenantId && childContext.tenantId !== parentContext.tenantId) {
      return false;
    }

    // Check workspace scope
    if (parentContext.workspaceId && childContext.workspaceId !== parentContext.workspaceId) {
      return false;
    }

    // Check resource scope
    if (parentContext.resourceId &&
        (childContext.resourceId !== parentContext.resourceId ||
         childContext.resourceType !== parentContext.resourceType)) {
      return false;
    }

    return true;
  },
};

/**
 * Role assignment utilities
 */
export const RoleAssignmentUtils = {
  /**
   * Get user assignments for a specific context
   */
  getUserAssignments: (
    assignments: UserRole[],
    userId: string,
    context?: Partial<AccessContext>
  ): UserRole[] => {
    return assignments.filter(assignment => {
      if (assignment.userId !== userId) return false;

      if (context?.tenantId && assignment.tenantId !== context.tenantId) return false;
      if (context?.workspaceId && assignment.workspaceId !== context.workspaceId) return false;

      return true;
    });
  },

  /**
   * Get all roles for a user in a context
   */
  getUserRoles: (
    assignments: UserRole[],
    allRoles: Role[],
    userId: string,
    context?: Partial<AccessContext>
  ): Role[] => {
    const userAssignments = RoleAssignmentUtils.getUserAssignments(assignments, userId, context);
    const roleIds = userAssignments.map(assignment => assignment.roleId);
    return allRoles.filter(role => roleIds.includes(role.id));
  },

  /**
   * Get effective permissions for a user
   */
  getUserPermissions: (
    assignments: UserRole[],
    allRoles: Role[],
    userId: string,
    context: AccessContext
  ): string[] => {
    const userRoles = RoleAssignmentUtils.getUserRoles(assignments, allRoles, userId, context);
    const permissions = new Set<string>();

    userRoles.forEach(role => {
      const rolePermissions = RoleHierarchy.getAllRolePermissions(role, allRoles);
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  },

  /**
   * Check if user can be assigned a role in a context
   */
  canAssignRole: (
    role: Role,
    context: AccessContext,
    currentUserPermissions: string[]
  ): boolean => {
    // System roles can only be assigned by users with system.manage permission
    if (role.isSystem && !PermissionMatcher.hasPermission(currentUserPermissions, 'system.manage')) {
      return false;
    }

    // Check if user has role.assign permission
    if (!PermissionMatcher.hasPermission(currentUserPermissions, 'role.assign')) {
      return false;
    }

    // Check scope-specific permissions
    switch (ContextUtils.getScope(context)) {
      case 'tenant':
        return PermissionMatcher.hasPermission(currentUserPermissions, 'tenant.manage');
      case 'workspace':
        return PermissionMatcher.hasPermission(currentUserPermissions, 'workspace.manage');
      default:
        return true;
    }
  },
};

/**
 * Audit utilities
 */
export const AuditUtils = {
  /**
   * Create audit log entry for permission change
   */
  createPermissionAuditEntry: (
    action: 'granted' | 'revoked' | 'checked',
    permission: string,
    context: AccessContext,
    actorId: string,
    result?: boolean
  ) => ({
    type: 'permission',
    action,
    permission,
    context,
    actorId,
    result,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Create audit log entry for role change
   */
  createRoleAuditEntry: (
    action: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned',
    roleId: string,
    targetUserId?: string,
    actorId?: string,
    changes?: any
  ) => ({
    type: 'role',
    action,
    roleId,
    targetUserId,
    actorId,
    changes,
    timestamp: new Date().toISOString(),
  }),
};

export default {
  PermissionHierarchy,
  RoleHierarchy,
  PermissionValidator,
  PermissionMatcher,
  ContextUtils,
  RoleAssignmentUtils,
  AuditUtils,
};