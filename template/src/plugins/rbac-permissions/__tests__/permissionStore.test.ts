/**
 * @fileoverview Permission Store Tests
 *
 * Test suite for permission store functionality
 */

import { renderHook, act } from '@testing-library/react';
import { usePermissionStore, permissionStoreUtils } from '../stores/permissionStore';
import { AccessContext, BulkPermissionCheck } from '../types';
import { SYSTEM_PERMISSIONS } from '../constants';

// Mock fetch for testing
global.fetch = jest.fn();

describe('PermissionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { setPermissions } = usePermissionStore.getState();
    act(() => {
      setPermissions([]);
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('setPermissions', () => {
    it('should set system permissions', () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setPermissions(SYSTEM_PERMISSIONS);
      });

      expect(result.current.permissions).toEqual(SYSTEM_PERMISSIONS);
    });
  });

  describe('setUserPermissionsFromEvent', () => {
    const mockContext: AccessContext = {
      userId: 'user1',
      tenantId: 'tenant1',
      workspaceId: 'workspace1',
    };

    it('should set user permissions from event data', () => {
      const { result } = renderHook(() => usePermissionStore());
      const mockPermissions = ['tenant.read', 'workspace.create'];

      act(() => {
        result.current.setUserPermissionsFromEvent(mockPermissions, 'admin', mockContext);
      });

      expect(result.current.userPermissions).toHaveLength(2);
      expect(result.current.userPermissions[0].id).toBe('tenant.read');
      expect(result.current.userPermissions[0].granted).toBe(true);
      expect(result.current.userPermissions[0].tenantId).toBe('tenant1');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('checkPermission', () => {
    const mockContext: AccessContext = {
      userId: 'user1',
      tenantId: 'tenant1',
      workspaceId: 'workspace1',
    };

    beforeEach(() => {
      const { result } = renderHook(() => usePermissionStore());

      // Set up mock user permissions using the event method
      act(() => {
        result.current.setUserPermissionsFromEvent(
          [SYSTEM_PERMISSIONS[0].id, SYSTEM_PERMISSIONS[1].id],
          'admin',
          mockContext
        );

        // Manually set one permission as denied for testing
        const permissions = result.current.userPermissions;
        if (permissions.length > 1) {
          permissions[1].granted = false;
        }
      });
    });

    it('should return true for granted permissions', () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasPermission = result.current.checkPermission(
        SYSTEM_PERMISSIONS[0].id,
        mockContext
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false for denied permissions', () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasPermission = result.current.checkPermission(
        SYSTEM_PERMISSIONS[1].id,
        mockContext
      );

      expect(hasPermission).toBe(false);
    });

    it('should return false for non-existent permissions', () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasPermission = result.current.checkPermission(
        'non.existent',
        mockContext
      );

      expect(hasPermission).toBe(false);
    });

    it('should handle errors gracefully', () => {
      const { result } = renderHook(() => usePermissionStore());

      // For invalid data, it should return false
      const hasPermission = result.current.checkPermission(
        null as any,
        mockContext
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('checkMultiplePermissions', () => {
    const mockContext: AccessContext = {
      userId: 'user1',
      tenantId: 'tenant1',
      workspaceId: 'workspace1',
    };

    beforeEach(() => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUserPermissionsFromEvent(
          [SYSTEM_PERMISSIONS[0].id, SYSTEM_PERMISSIONS[1].id],
          'admin',
          mockContext
        );

        // Manually set one permission as denied for testing
        const permissions = result.current.userPermissions;
        if (permissions.length > 1) {
          permissions[1].granted = false;
        }
      });
    });

    it('should check multiple permissions with OR operator', () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasAnyPermission = result.current.checkMultiplePermissions(
        [SYSTEM_PERMISSIONS[0].id, SYSTEM_PERMISSIONS[1].id],
        mockContext,
        false // OR logic
      );

      expect(hasAnyPermission).toBe(true); // At least one permission granted
    });

    it('should check multiple permissions with AND operator', () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasAllPermissions = result.current.checkMultiplePermissions(
        [SYSTEM_PERMISSIONS[0].id, SYSTEM_PERMISSIONS[1].id],
        mockContext,
        true // AND logic
      );

      expect(hasAllPermissions).toBe(false); // Not all permissions granted
    });

    it('should handle errors in bulk check', () => {
      const { result } = renderHook(() => usePermissionStore());

      // Test with invalid permissions should return false
      const hasPermissions = result.current.checkMultiplePermissions(
        ['non.existent.permission'],
        mockContext,
        false
      );

      expect(hasPermissions).toBe(false);
    });
  });

  describe('isPermissionApplicableToContext', () => {
    const { result } = renderHook(() => usePermissionStore());

    it('should return true for system scope permissions', () => {
      const permission = {
        ...SYSTEM_PERMISSIONS[0],
        scope: 'system' as const,
        tenantId: 'tenant1',
      };

      const context: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant2',
      };

      const isApplicable = result.current.isPermissionApplicableToContext(permission, context);
      expect(isApplicable).toBe(true);
    });

    it('should check tenant scope correctly', () => {
      const permission = {
        ...SYSTEM_PERMISSIONS[0],
        scope: 'tenant' as const,
        tenantId: 'tenant1',
      };

      const context: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const isApplicable = result.current.isPermissionApplicableToContext(permission, context);
      expect(isApplicable).toBe(true);

      // Test mismatch
      const contextMismatch: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant2',
      };

      const isNotApplicable = result.current.isPermissionApplicableToContext(permission, contextMismatch);
      expect(isNotApplicable).toBe(false);
    });

    it('should check workspace scope correctly', () => {
      const permission = {
        ...SYSTEM_PERMISSIONS[0],
        scope: 'workspace' as const,
        workspaceId: 'workspace1',
      };

      const context: AccessContext = {
        userId: 'user1',
        workspaceId: 'workspace1',
      };

      const isApplicable = result.current.isPermissionApplicableToContext(permission, context);
      expect(isApplicable).toBe(true);
    });

    it('should check resource scope correctly', () => {
      const permission = {
        ...SYSTEM_PERMISSIONS[0],
        scope: 'resource' as const,
        resourceId: 'resource1',
      };

      const context: AccessContext = {
        userId: 'user1',
        resourceId: 'resource1',
      };

      const isApplicable = result.current.isPermissionApplicableToContext(permission, context);
      expect(isApplicable).toBe(true);
    });

    it('should return false for unknown scope', () => {
      const permission = {
        ...SYSTEM_PERMISSIONS[0],
        scope: 'unknown' as any,
      };

      const context: AccessContext = {
        userId: 'user1',
      };

      const isApplicable = result.current.isPermissionApplicableToContext(permission, context);
      expect(isApplicable).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        // Set an error
        usePermissionStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});

describe('PermissionStoreUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize permissions', () => {
      const setPermissionsSpy = jest.spyOn(usePermissionStore.getState(), 'setPermissions');

      permissionStoreUtils.initialize();

      expect(setPermissionsSpy).toHaveBeenCalled();
    });
  });

  describe('canPerformAction', () => {
    it('should check action permission', () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkPermissionSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkPermission'
      ).mockReturnValue(true);

      const result = permissionStoreUtils.canPerformAction(
        'read',
        'workspace',
        mockContext
      );

      expect(checkPermissionSpy).toHaveBeenCalledWith('workspace.read', mockContext);
      expect(result).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any permission', () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkMultiplePermissionsSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkMultiplePermissions'
      ).mockReturnValue(true);

      const result = permissionStoreUtils.hasAnyPermission(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(checkMultiplePermissionsSpy).toHaveBeenCalledWith(['permission1', 'permission2'], mockContext, false);
      expect(result).toBe(true);
    });

    it('should return false if user has no permissions', () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkMultiplePermissionsSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkMultiplePermissions'
      ).mockReturnValue(false);

      const result = permissionStoreUtils.hasAnyPermission(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkMultiplePermissionsSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkMultiplePermissions'
      ).mockReturnValue(true);

      const result = permissionStoreUtils.hasAllPermissions(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(checkMultiplePermissionsSpy).toHaveBeenCalledWith(['permission1', 'permission2'], mockContext, true);
      expect(result).toBe(true);
    });

    it('should return false if user missing any permission', () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkMultiplePermissionsSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkMultiplePermissions'
      ).mockReturnValue(false);

      const result = permissionStoreUtils.hasAllPermissions(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(result).toBe(false);
    });
  });
});