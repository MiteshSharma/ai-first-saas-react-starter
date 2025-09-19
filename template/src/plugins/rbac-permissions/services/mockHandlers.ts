/**
 * @fileoverview Mock API Handlers for RBAC & Permissions
 *
 * Mock handlers for development and testing of the permission system
 */

// import { rest } from 'msw';
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

/**
 * Mock API Handlers
 */
// TODO: Add MSW handlers when MSW is installed
export const rbacMockHandlers: any[] = [
  // All handlers commented out until MSW is installed
  /*
  // Get all permissions
  rest.get('/api/permissions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(SYSTEM_PERMISSIONS)
    );
  }),

  // Get user permissions for context
  rest.post('/api/permissions/user', async (req, res, ctx) => {
    const context = await req.json() as AccessContext;
    const userPermissions = generateUserPermissions(context);

    return res(
      ctx.status(200),
      ctx.json(userPermissions)
    );
  }),

  // Check single permission
  rest.post('/api/permissions/check', async (req, res, ctx) => {
    const { permission, context } = await req.json() as {
      permission: string;
      context: AccessContext;
    };

    const userPermissions = generateUserPermissions(context);
    const hasPermission = userPermissions.some(p =>
      p.id === permission &&
      p.granted &&
      isPermissionApplicableToContext(p, context)
    );

    return res(
      ctx.status(200),
      ctx.json({ hasPermission })
    );
  }),

  // Check multiple permissions
  rest.post('/api/permissions/check-bulk', async (req, res, ctx) => {
    const bulkCheck = await req.json() as BulkPermissionCheck;
    const userPermissions = generateUserPermissions(bulkCheck.context);

    const results: PermissionCheckResult[] = bulkCheck.permissions.map(permissionId => {
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

    return res(
      ctx.status(200),
      ctx.json(results)
    );
  }),

  // Get all roles
  rest.get('/api/roles', (req, res, ctx) => {
    const tenantId = req.url.searchParams.get('tenantId');
    const workspaceId = req.url.searchParams.get('workspaceId');

    let filteredRoles = mockRoles;

    if (tenantId) {
      filteredRoles = filteredRoles.filter(role =>
        !role.tenantId || role.tenantId === tenantId
      );
    }

    if (workspaceId) {
      filteredRoles = filteredRoles.filter(role =>
        !role.workspaceId || role.workspaceId === workspaceId
      );
    }

    return res(
      ctx.status(200),
      ctx.json(filteredRoles)
    );
  }),

  // Create role
  rest.post('/api/roles', async (req, res, ctx) => {
    const roleData = await req.json() as Partial<Role>;

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleData.name || '',
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      isSystem: false,
      isActive: roleData.isActive ?? true,
      tenantId: roleData.tenantId,
      workspaceId: roleData.workspaceId,
      userCount: 0,
      inheritedFrom: roleData.inheritedFrom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockRoles.push(newRole);

    return res(
      ctx.status(201),
      ctx.json(newRole)
    );
  }),

  // Update role
  rest.put('/api/roles/:roleId', async (req, res, ctx) => {
    const { roleId } = req.params;
    const updates = await req.json() as Partial<Role>;

    const roleIndex = mockRoles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Role not found' })
      );
    }

    const updatedRole = {
      ...mockRoles[roleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockRoles[roleIndex] = updatedRole;

    return res(
      ctx.status(200),
      ctx.json(updatedRole)
    );
  }),

  // Delete role
  rest.delete('/api/roles/:roleId', (req, res, ctx) => {
    const { roleId } = req.params;

    const roleIndex = mockRoles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Role not found' })
      );
    }

    // Check if role is system role
    if (mockRoles[roleIndex].isSystem) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Cannot delete system role' })
      );
    }

    // Check if role has assigned users
    const hasAssignedUsers = mockUserRoleAssignments.some(assignment =>
      assignment.roleIds.includes(roleId as string)
    );

    if (hasAssignedUsers) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Cannot delete role with assigned users' })
      );
    }

    mockRoles.splice(roleIndex, 1);

    return res(
      ctx.status(204)
    );
  }),

  // Get user role assignments
  rest.get('/api/users/roles', (req, res, ctx) => {
    const tenantId = req.url.searchParams.get('tenantId');
    const workspaceId = req.url.searchParams.get('workspaceId');
    const userId = req.url.searchParams.get('userId');

    let filteredAssignments = mockUserRoleAssignments;

    if (tenantId) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.tenantId === tenantId
      );
    }

    if (workspaceId) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.workspaceId === workspaceId
      );
    }

    if (userId) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.userId === userId
      );
    }

    return res(
      ctx.status(200),
      ctx.json(filteredAssignments)
    );
  }),

  // Assign roles to user
  rest.post('/api/users/:userId/roles', async (req, res, ctx) => {
    const { userId } = req.params;
    const { roleIds, tenantId, workspaceId } = await req.json() as {
      roleIds: string[];
      tenantId?: string;
      workspaceId?: string;
    };

    // Remove existing assignments for this context
    mockUserRoleAssignments = mockUserRoleAssignments.filter(assignment =>
      !(assignment.userId === userId &&
        assignment.tenantId === tenantId &&
        assignment.workspaceId === workspaceId)
    );

    // Add new assignment
    const newAssignment: MockUserRoleAssignment = {
      userId: userId as string,
      roleIds,
      tenantId,
      workspaceId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'current-user', // Would be actual user ID
    };

    mockUserRoleAssignments.push(newAssignment);

    // Update role user counts
    roleIds.forEach(roleId => {
      const role = mockRoles.find(r => r.id === roleId);
      if (role) {
        role.userCount = mockUserRoleAssignments.filter(assignment =>
          assignment.roleIds.includes(roleId)
        ).length;
      }
    });

    return res(
      ctx.status(200),
      ctx.json(newAssignment)
    );
  }),

  // Remove role from user
  rest.delete('/api/users/:userId/roles/:roleId', (req, res, ctx) => {
    const { userId, roleId } = req.params;

    // Find and update assignment
    const assignmentIndex = mockUserRoleAssignments.findIndex(assignment =>
      assignment.userId === userId && assignment.roleIds.includes(roleId as string)
    );

    if (assignmentIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Role assignment not found' })
      );
    }

    const assignment = mockUserRoleAssignments[assignmentIndex];
    assignment.roleIds = assignment.roleIds.filter(id => id !== roleId);

    // Remove assignment if no roles left
    if (assignment.roleIds.length === 0) {
      mockUserRoleAssignments.splice(assignmentIndex, 1);
    }

    // Update role user count
    const role = mockRoles.find(r => r.id === roleId);
    if (role) {
      role.userCount = mockUserRoleAssignments.filter(assignment =>
        assignment.roleIds.includes(roleId as string)
      ).length;
    }

    return res(
      ctx.status(204)
    );
  }),

  // Get role templates
  rest.get('/api/role-templates', (req, res, ctx) => {
    // Role templates would be predefined templates
    const templates = [
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

    return res(
      ctx.status(200),
      ctx.json(templates)
    );
  }),

  // Export RBAC configuration
  rest.get('/api/rbac/export', (req, res, ctx) => {
    const exportData = {
      roles: mockRoles,
      assignments: mockUserRoleAssignments,
      permissions: SYSTEM_PERMISSIONS,
      exportedAt: new Date().toISOString(),
    };

    return res(
      ctx.status(200),
      ctx.json(exportData)
    );
  }),

  // Import RBAC configuration
  rest.post('/api/rbac/import', async (req, res, ctx) => {
    const importData = await req.json();

    // Validate import data structure
    if (!importData.roles || !importData.assignments) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Invalid import data structure' })
      );
    }

    // Replace mock data with imported data
    mockRoles = [...SYSTEM_ROLES, ...importData.roles.filter((role: Role) => !role.isSystem)];
    mockUserRoleAssignments = importData.assignments;

    return res(
      ctx.status(200),
      ctx.json({ message: 'RBAC configuration imported successfully' })
    );
  }),
  */
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

export default rbacMockHandlers;