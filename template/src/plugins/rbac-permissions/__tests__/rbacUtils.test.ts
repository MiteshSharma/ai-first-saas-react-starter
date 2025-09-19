/**
 * @fileoverview RBAC Utilities Tests
 *
 * Test suite for RBAC utility functions
 */

import rbacUtils from '../utils/rbacUtils';
import { Permission, Role, ContextualPermission, AccessContext } from '../types';

const {
  PermissionHierarchy,
  RoleHierarchy,
  PermissionValidator,
  PermissionMatcher,
  ContextUtils,
  RoleAssignmentUtils,
  AuditUtils,
} = rbacUtils;

describe('PermissionHierarchy', () => {
  describe('scopeContains', () => {
    it('should return true when parent scope contains child scope', () => {
      expect(PermissionHierarchy.scopeContains('system', 'tenant')).toBe(true);
      expect(PermissionHierarchy.scopeContains('tenant', 'workspace')).toBe(true);
      expect(PermissionHierarchy.scopeContains('workspace', 'resource')).toBe(true);
      expect(PermissionHierarchy.scopeContains('system', 'resource')).toBe(true);
    });

    it('should return false when parent scope does not contain child scope', () => {
      expect(PermissionHierarchy.scopeContains('tenant', 'system')).toBe(false);
      expect(PermissionHierarchy.scopeContains('workspace', 'tenant')).toBe(false);
      expect(PermissionHierarchy.scopeContains('resource', 'workspace')).toBe(false);
    });

    it('should return true for same scope', () => {
      expect(PermissionHierarchy.scopeContains('system', 'system')).toBe(true);
      expect(PermissionHierarchy.scopeContains('tenant', 'tenant')).toBe(true);
      expect(PermissionHierarchy.scopeContains('workspace', 'workspace')).toBe(true);
      expect(PermissionHierarchy.scopeContains('resource', 'resource')).toBe(true);
    });
  });

  describe('getInheritedPermissions', () => {
    const mockPermissions: ContextualPermission[] = [
      {
        id: 'system.manage',
        name: 'System Management',
        description: 'System level management',
        action: 'manage',
        resource: 'system',
        scope: 'system',
        category: 'System',
        isSystem: true,
        granted: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'tenant.read',
        name: 'Tenant Read',
        description: 'Read tenant data',
        action: 'read',
        resource: 'tenant',
        scope: 'tenant',
        category: 'Tenant',
        isSystem: true,
        granted: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'workspace.read',
        name: 'Workspace Read',
        description: 'Read workspace data',
        action: 'read',
        resource: 'workspace',
        scope: 'workspace',
        category: 'Workspace',
        isSystem: true,
        granted: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should return permissions that apply to target scope', () => {
      const inherited = PermissionHierarchy.getInheritedPermissions(mockPermissions, 'workspace');
      expect(inherited).toHaveLength(3); // All permissions apply to workspace or higher
    });

    it('should return only system permissions for system scope', () => {
      const inherited = PermissionHierarchy.getInheritedPermissions(mockPermissions, 'system');
      expect(inherited).toHaveLength(1);
      expect(inherited[0].scope).toBe('system');
    });
  });

  describe('calculateEffectivePermissions', () => {
    const mockPermissions: ContextualPermission[] = [
      {
        id: 'system.manage',
        name: 'System Management',
        description: 'System level management',
        action: 'manage',
        resource: 'system',
        scope: 'system',
        category: 'System',
        isSystem: true,
        granted: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'tenant.read',
        name: 'Tenant Read',
        description: 'Read tenant data',
        action: 'read',
        resource: 'tenant',
        scope: 'tenant',
        category: 'Tenant',
        isSystem: true,
        granted: true,
        tenantId: 'tenant1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should return permissions applicable to context', () => {
      const context: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const effective = PermissionHierarchy.calculateEffectivePermissions(mockPermissions, context);
      expect(effective).toHaveLength(2); // Both permissions apply
    });

    it('should filter out permissions not applicable to context', () => {
      const context: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant2',
      };

      const effective = PermissionHierarchy.calculateEffectivePermissions(mockPermissions, context);
      expect(effective).toHaveLength(1); // Only system permission applies
      expect(effective[0].scope).toBe('system');
    });
  });
});

describe('RoleHierarchy', () => {
  const mockRoles: Role[] = [
    {
      id: 'admin',
      name: 'Admin',
      description: 'Administrator role',
      permissions: ['system.manage', 'tenant.manage'],
      isSystem: true,
      isActive: true,
      userCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Manager role',
      permissions: ['workspace.manage'],
      isSystem: false,
      isActive: true,
      userCount: 2,
      inheritedFrom: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'user',
      name: 'User',
      description: 'Basic user role',
      permissions: ['workspace.read'],
      isSystem: false,
      isActive: true,
      userCount: 10,
      inheritedFrom: 'manager',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  describe('inheritsFrom', () => {
    it('should return true when role inherits from parent', () => {
      const managerRole = mockRoles.find(r => r.id === 'manager')!;
      expect(RoleHierarchy.inheritsFrom(managerRole, 'admin')).toBe(true);
    });

    it('should return false when role does not inherit from parent', () => {
      const adminRole = mockRoles.find(r => r.id === 'admin')!;
      expect(RoleHierarchy.inheritsFrom(adminRole, 'manager')).toBe(false);
    });
  });

  describe('getAllRolePermissions', () => {
    it('should return all permissions including inherited ones', () => {
      const userRole = mockRoles.find(r => r.id === 'user')!;
      const allPermissions = RoleHierarchy.getAllRolePermissions(userRole, mockRoles);

      expect(allPermissions).toContain('workspace.read'); // Own permission
      expect(allPermissions).toContain('workspace.manage'); // From manager
      expect(allPermissions).toContain('system.manage'); // From admin
      expect(allPermissions).toContain('tenant.manage'); // From admin
    });

    it('should handle roles without inheritance', () => {
      const adminRole = mockRoles.find(r => r.id === 'admin')!;
      const allPermissions = RoleHierarchy.getAllRolePermissions(adminRole, mockRoles);

      expect(allPermissions).toEqual(['system.manage', 'tenant.manage']);
    });
  });

  describe('hasCircularInheritance', () => {
    it('should detect circular inheritance', () => {
      const circularRoles: Role[] = [
        {
          ...mockRoles[0],
          id: 'role1',
          inheritedFrom: 'role2',
        },
        {
          ...mockRoles[1],
          id: 'role2',
          inheritedFrom: 'role1',
        },
      ];

      expect(RoleHierarchy.hasCircularInheritance(circularRoles[0], circularRoles)).toBe(true);
    });

    it('should return false for valid inheritance chain', () => {
      const userRole = mockRoles.find(r => r.id === 'user')!;
      expect(RoleHierarchy.hasCircularInheritance(userRole, mockRoles)).toBe(false);
    });
  });
});

describe('PermissionValidator', () => {
  describe('isValidPermissionId', () => {
    it('should validate correct permission ID format', () => {
      expect(PermissionValidator.isValidPermissionId('tenant.read')).toBe(true);
      expect(PermissionValidator.isValidPermissionId('workspace.manage')).toBe(true);
    });

    it('should reject invalid permission ID format', () => {
      expect(PermissionValidator.isValidPermissionId('invalid')).toBe(false);
      expect(PermissionValidator.isValidPermissionId('too.many.parts')).toBe(false);
      expect(PermissionValidator.isValidPermissionId('')).toBe(false);
    });
  });

  describe('isValidAction', () => {
    it('should validate correct actions', () => {
      expect(PermissionValidator.isValidAction('create')).toBe(true);
      expect(PermissionValidator.isValidAction('read')).toBe(true);
      expect(PermissionValidator.isValidAction('update')).toBe(true);
      expect(PermissionValidator.isValidAction('delete')).toBe(true);
      expect(PermissionValidator.isValidAction('manage')).toBe(true);
    });

    it('should reject invalid actions', () => {
      expect(PermissionValidator.isValidAction('invalid')).toBe(false);
      expect(PermissionValidator.isValidAction('')).toBe(false);
    });
  });

  describe('validatePermission', () => {
    it('should return no errors for valid permission', () => {
      const validPermission: Partial<Permission> = {
        id: 'tenant.read',
        name: 'Tenant Read',
        action: 'read',
        resource: 'tenant',
        scope: 'tenant',
      };

      const errors = PermissionValidator.validatePermission(validPermission);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid permission', () => {
      const invalidPermission: Partial<Permission> = {
        id: 'invalid-id',
        name: '',
        action: 'invalid' as any,
        resource: 'invalid' as any,
        scope: 'invalid' as any,
      };

      const errors = PermissionValidator.validatePermission(invalidPermission);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('PermissionMatcher', () => {
  describe('matches', () => {
    it('should match exact permissions', () => {
      expect(PermissionMatcher.matches('tenant.read', 'tenant.read')).toBe(true);
    });

    it('should match wildcard permissions', () => {
      expect(PermissionMatcher.matches('tenant.read', '*')).toBe(true);
      expect(PermissionMatcher.matches('tenant.read', 'tenant.*')).toBe(true);
    });

    it('should not match different permissions', () => {
      expect(PermissionMatcher.matches('tenant.read', 'workspace.read')).toBe(false);
      expect(PermissionMatcher.matches('tenant.read', 'workspace.*')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    const userPermissions = ['tenant.read', 'workspace.*', 'user.create'];

    it('should return true for exact match', () => {
      expect(PermissionMatcher.hasPermission(userPermissions, 'tenant.read')).toBe(true);
    });

    it('should return true for wildcard match', () => {
      expect(PermissionMatcher.hasPermission(userPermissions, 'workspace.read')).toBe(true);
      expect(PermissionMatcher.hasPermission(userPermissions, 'workspace.manage')).toBe(true);
    });

    it('should return false for no match', () => {
      expect(PermissionMatcher.hasPermission(userPermissions, 'system.manage')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    const userPermissions = ['tenant.read', 'workspace.manage'];

    it('should return true if user has any required permission', () => {
      expect(PermissionMatcher.hasAnyPermission(
        userPermissions,
        ['tenant.read', 'system.manage']
      )).toBe(true);
    });

    it('should return false if user has no required permissions', () => {
      expect(PermissionMatcher.hasAnyPermission(
        userPermissions,
        ['system.manage', 'user.delete']
      )).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    const userPermissions = ['tenant.read', 'workspace.manage'];

    it('should return true if user has all required permissions', () => {
      expect(PermissionMatcher.hasAllPermissions(
        userPermissions,
        ['tenant.read', 'workspace.manage']
      )).toBe(true);
    });

    it('should return false if user is missing any required permission', () => {
      expect(PermissionMatcher.hasAllPermissions(
        userPermissions,
        ['tenant.read', 'system.manage']
      )).toBe(false);
    });
  });
});

describe('ContextUtils', () => {
  describe('buildContext', () => {
    it('should build context with defaults and overrides', () => {
      const base = { userId: 'user1', tenantId: 'tenant1' };
      const overrides = { workspaceId: 'workspace1' };

      const context = ContextUtils.buildContext(base, overrides);

      expect(context).toEqual({
        userId: 'user1',
        tenantId: 'tenant1',
        workspaceId: 'workspace1',
        resourceId: undefined,
        resourceType: undefined,
      });
    });

    it('should override base values', () => {
      const base = { userId: 'user1', tenantId: 'tenant1' };
      const overrides = { tenantId: 'tenant2' };

      const context = ContextUtils.buildContext(base, overrides);

      expect(context.tenantId).toBe('tenant2');
    });
  });

  describe('getScope', () => {
    it('should return resource scope for resource context', () => {
      const context: AccessContext = {
        userId: 'user1',
        resourceId: 'resource1',
        resourceType: 'document',
      };

      expect(ContextUtils.getScope(context)).toBe('resource');
    });

    it('should return workspace scope for workspace context', () => {
      const context: AccessContext = {
        userId: 'user1',
        workspaceId: 'workspace1',
      };

      expect(ContextUtils.getScope(context)).toBe('workspace');
    });

    it('should return tenant scope for tenant context', () => {
      const context: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      expect(ContextUtils.getScope(context)).toBe('tenant');
    });

    it('should return system scope for minimal context', () => {
      const context: AccessContext = {
        userId: 'user1',
      };

      expect(ContextUtils.getScope(context)).toBe('system');
    });
  });

  describe('isWithin', () => {
    it('should return true when child context is within parent context', () => {
      const parent: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const child: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        workspaceId: 'workspace1',
      };

      expect(ContextUtils.isWithin(child, parent)).toBe(true);
    });

    it('should return false when child context is not within parent context', () => {
      const parent: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const child: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant2',
      };

      expect(ContextUtils.isWithin(child, parent)).toBe(false);
    });
  });
});

describe('AuditUtils', () => {
  describe('createPermissionAuditEntry', () => {
    it('should create permission audit entry', () => {
      const context: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const entry = AuditUtils.createPermissionAuditEntry(
        'granted',
        'tenant.read',
        context,
        'admin1',
        true
      );

      expect(entry.type).toBe('permission');
      expect(entry.action).toBe('granted');
      expect(entry.permission).toBe('tenant.read');
      expect(entry.context).toBe(context);
      expect(entry.actorId).toBe('admin1');
      expect(entry.result).toBe(true);
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe('createRoleAuditEntry', () => {
    it('should create role audit entry', () => {
      const entry = AuditUtils.createRoleAuditEntry(
        'assigned',
        'admin',
        'user1',
        'admin1',
        { roleAdded: 'admin' }
      );

      expect(entry.type).toBe('role');
      expect(entry.action).toBe('assigned');
      expect(entry.roleId).toBe('admin');
      expect(entry.targetUserId).toBe('user1');
      expect(entry.actorId).toBe('admin1');
      expect(entry.changes).toEqual({ roleAdded: 'admin' });
      expect(entry.timestamp).toBeDefined();
    });
  });
});