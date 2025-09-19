/**
 * @fileoverview Mock API Handlers for RBAC & Permissions
 *
 * Mock handlers for development and testing of the permission system
 */

import {
  Permission,
  Role,
  ContextualPermission,
  AccessContext,
  UserRole,
  BulkPermissionCheck,
  PermissionCheckResult,
} from '../types';
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES } from '../constants';

// Simple interface for mock data
interface MockUserRoleAssignment {
  userId: string;
  roleIds: string[];
  tenantId?: string;
  workspaceId?: string;
  assignedAt: string;
  assignedBy: string;
}

// Mock data storage
let mockRoles: Role[] = SYSTEM_ROLES;
let mockUserRoleAssignments: MockUserRoleAssignment[] = [
  {
    userId: 'user1',
    roleIds: ['tenant-owner'],
    tenantId: 'tenant1',
    assignedAt: '2024-01-01T00:00:00Z',
    assignedBy: 'system',
  },
  {
    userId: 'user2',
    roleIds: ['workspace-admin'],
    tenantId: 'tenant1',
    workspaceId: 'workspace1',
    assignedAt: '2024-01-02T00:00:00Z',
    assignedBy: 'user1',
  },
  {
    userId: 'user3',
    roleIds: ['member'],
    tenantId: 'tenant1',
    workspaceId: 'workspace1',
    assignedAt: '2024-01-03T00:00:00Z',
    assignedBy: 'user1',
  },
];

/**
 * Generate contextual permissions for a user
 */
const generateUserPermissions = (context: AccessContext): ContextualPermission[] => {
  const userAssignments = mockUserRoleAssignments.filter(
    assignment => assignment.userId === context.userId
  );

  const userRoleIds = userAssignments.flatMap(assignment => assignment.roleIds);
  const userRoles = mockRoles.filter(role => userRoleIds.includes(role.id));

  // Get all permissions from user roles
  const rolePermissions = userRoles.flatMap(role => role.permissions);

  // Convert system permissions to contextual permissions
  return SYSTEM_PERMISSIONS.map(permission => {
    const isGranted = rolePermissions.includes(permission.id);
    const grantingRole = userRoles.find(role => role.permissions.includes(permission.id));

    return {
      ...permission,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      resourceId: context.resourceId,
      granted: isGranted,
      inheritedFrom: grantingRole?.id,
    };
  });
};

/**
 * Check if permission is applicable to context
 */
const isPermissionApplicableToContext = (
  permission: ContextualPermission,
  context: AccessContext
): boolean => {
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
};

// Mock API delay simulation
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 500));

/**
 * RBAC Mock Handlers Class
 */
export class RBACMockHandlers {
  /**
   * Get all permissions
   */
  static async getPermissions(): Promise<Permission[]> {
    await mockApiDelay();
    return SYSTEM_PERMISSIONS;
  }

  /**
   * Get user permissions for context
   */
  static async getUserPermissions(context: AccessContext): Promise<ContextualPermission[]> {
    await mockApiDelay();
    return generateUserPermissions(context);
  }

  /**
   * Check single permission
   */
  static async checkPermission(permission: string, context: AccessContext): Promise<{ hasPermission: boolean }> {
    await mockApiDelay();

    const userPermissions = generateUserPermissions(context);
    const hasPermission = userPermissions.some(p =>
      p.id === permission &&
      p.granted &&
      isPermissionApplicableToContext(p, context)
    );

    return { hasPermission };
  }

  /**
   * Check multiple permissions
   */
  static async checkBulkPermissions(bulkCheck: BulkPermissionCheck): Promise<PermissionCheckResult[]> {
    await mockApiDelay();

    const userPermissions = generateUserPermissions(bulkCheck.context);

    return bulkCheck.permissions.map(permissionId => {
      const permission = userPermissions.find(p => p.id === permissionId);
      const granted = permission?.granted &&
        isPermissionApplicableToContext(permission, bulkCheck.context) || false;

      return {
        granted,
        reason: granted ? 'Permission granted' : 'Permission denied',
        grantedBy: permission?.inheritedFrom,
        scope: permission?.scope || 'resource',
        context: bulkCheck.context,
      };
    });
  }

  /**
   * Get all roles
   */
  static async getRoles(params?: { tenantId?: string; workspaceId?: string }): Promise<Role[]> {
    await mockApiDelay();

    // For now, return all roles since Role interface doesn't have tenantId/workspaceId
    // In a real implementation, roles might be filtered by context
    return mockRoles;
  }

  /**
   * Create role
   */
  static async createRole(roleData: Partial<Role>): Promise<Role> {
    await mockApiDelay();

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleData.name || '',
      description: roleData.description || '',
      type: roleData.type || 'custom',
      level: roleData.level || 'member',
      permissions: roleData.permissions || [],
      isSystem: false,
      isDefault: false,
      color: roleData.color || '#1677ff',
      inheritedFrom: roleData.inheritedFrom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockRoles.push(newRole);
    return newRole;
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    await mockApiDelay();

    const roleIndex = mockRoles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    const updatedRole = {
      ...mockRoles[roleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockRoles[roleIndex] = updatedRole;
    return updatedRole;
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: string): Promise<void> {
    await mockApiDelay();

    const roleIndex = mockRoles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    // Check if role is system role
    if (mockRoles[roleIndex].isSystem) {
      throw new Error('Cannot delete system role');
    }

    // Check if role has assigned users
    const hasAssignedUsers = mockUserRoleAssignments.some(assignment =>
      assignment.roleIds.includes(roleId)
    );

    if (hasAssignedUsers) {
      throw new Error('Cannot delete role with assigned users');
    }

    mockRoles.splice(roleIndex, 1);
  }

  /**
   * Get user role assignments
   */
  static async getUserRoles(params?: { tenantId?: string; workspaceId?: string; userId?: string }): Promise<MockUserRoleAssignment[]> {
    await mockApiDelay();

    let filteredAssignments = mockUserRoleAssignments;

    if (params?.tenantId) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.tenantId === params.tenantId
      );
    }

    if (params?.workspaceId) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.workspaceId === params.workspaceId
      );
    }

    if (params?.userId) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.userId === params.userId
      );
    }

    return filteredAssignments;
  }

  /**
   * Assign roles to user
   */
  static async assignUserRoles(userId: string, data: { roleIds: string[]; tenantId?: string; workspaceId?: string }): Promise<MockUserRoleAssignment> {
    await mockApiDelay();

    // Remove existing assignments for this context
    mockUserRoleAssignments = mockUserRoleAssignments.filter(assignment =>
      !(assignment.userId === userId &&
        assignment.tenantId === data.tenantId &&
        assignment.workspaceId === data.workspaceId)
    );

    // Add new assignment
    const newAssignment: MockUserRoleAssignment = {
      userId,
      roleIds: data.roleIds,
      tenantId: data.tenantId,
      workspaceId: data.workspaceId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'current-user',
    };

    mockUserRoleAssignments.push(newAssignment);

    // TODO: Update role user counts in a real implementation

    return newAssignment;
  }

  /**
   * Remove role from user
   */
  static async removeUserRole(userId: string, roleId: string): Promise<void> {
    await mockApiDelay();

    // Find and update assignment
    const assignmentIndex = mockUserRoleAssignments.findIndex(assignment =>
      assignment.userId === userId && assignment.roleIds.includes(roleId)
    );

    if (assignmentIndex === -1) {
      throw new Error('Role assignment not found');
    }

    const assignment = mockUserRoleAssignments[assignmentIndex];
    assignment.roleIds = assignment.roleIds.filter(id => id !== roleId);

    // Remove assignment if no roles left
    if (assignment.roleIds.length === 0) {
      mockUserRoleAssignments.splice(assignmentIndex, 1);
    }

    // TODO: Update role user count in a real implementation
  }

  /**
   * Get role templates
   */
  static async getRoleTemplates(): Promise<any[]> {
    await mockApiDelay();

    return [
      {
        id: 'admin-template',
        name: 'Administrator Template',
        description: 'Full administrative access',
        permissions: ['tenant.manage', 'workspace.manage', 'user.manage'],
      },
      {
        id: 'manager-template',
        name: 'Manager Template',
        description: 'Workspace and user management',
        permissions: ['workspace.manage', 'user.read', 'user.update'],
      },
      {
        id: 'member-template',
        name: 'Member Template',
        description: 'Basic access permissions',
        permissions: ['workspace.read', 'dashboard.read'],
      },
    ];
  }

  /**
   * Export RBAC configuration
   */
  static async exportRBAC(): Promise<any> {
    await mockApiDelay();

    return {
      roles: mockRoles,
      assignments: mockUserRoleAssignments,
      permissions: SYSTEM_PERMISSIONS,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import RBAC configuration
   */
  static async importRBAC(importData: any): Promise<{ message: string }> {
    await mockApiDelay();

    // Validate import data structure
    if (!importData.roles || !importData.assignments) {
      throw new Error('Invalid import data structure');
    }

    // Replace mock data with imported data
    mockRoles = [...SYSTEM_ROLES, ...importData.roles.filter((role: Role) => !role.isSystem)];
    mockUserRoleAssignments = importData.assignments;

    return { message: 'RBAC configuration imported successfully' };
  }
}

/**
 * MSW Handlers (commented out until MSW is installed)
 */
export const rbacMockHandlers: any[] = [
  // All MSW handlers commented out until MSW is installed
];

// Utility functions for testing
export const rbacMockUtils = {
  // Reset mock data to initial state
  resetMockData: () => {
    mockRoles = [...SYSTEM_ROLES];
    mockUserRoleAssignments = [
      {
        userId: 'user1',
        roleIds: ['tenant-owner'],
        tenantId: 'tenant1',
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'system',
      },
      {
        userId: 'user2',
        roleIds: ['workspace-admin'],
        tenantId: 'tenant1',
        workspaceId: 'workspace1',
        assignedAt: '2024-01-02T00:00:00Z',
        assignedBy: 'user1',
      },
    ];
  },

  // Get current mock data
  getMockData: () => ({
    roles: mockRoles,
    assignments: mockUserRoleAssignments,
  }),

  // Add test user with specific roles
  addTestUser: (userId: string, roleIds: string[], context?: Partial<AccessContext>) => {
    const assignment: MockUserRoleAssignment = {
      userId,
      roleIds,
      tenantId: context?.tenantId,
      workspaceId: context?.workspaceId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'test',
    };
    mockUserRoleAssignments.push(assignment);
  },

  // Generate user permissions for testing
  generateUserPermissions,
};

export default RBACMockHandlers;