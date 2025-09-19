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
    const { loadPermissions } = usePermissionStore.getState();
    act(() => {
      loadPermissions();
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('loadPermissions', () => {
    it('should load system permissions', async () => {
      const { result } = renderHook(() => usePermissionStore());

      await act(async () => {
        await result.current.loadPermissions();
      });

      expect(result.current.permissions).toEqual(SYSTEM_PERMISSIONS);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => usePermissionStore());

      // Force an error in loadPermissions
      const originalPermissions = SYSTEM_PERMISSIONS;
      (global as any).SYSTEM_PERMISSIONS = undefined;

      await act(async () => {
        try {
          await result.current.loadPermissions();
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load permissions');

      // Restore
      (global as any).SYSTEM_PERMISSIONS = originalPermissions;
      consoleSpy.mockRestore();
    });
  });

  describe('loadUserPermissions', () => {
    const mockContext: AccessContext = {
      userId: 'user1',
      tenantId: 'tenant1',
      workspaceId: 'workspace1',
    };

    it('should load user permissions successfully', async () => {
      const mockPermissions = [
        {
          ...SYSTEM_PERMISSIONS[0],
          granted: true,
          tenantId: 'tenant1',
          workspaceId: 'workspace1',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPermissions),
      });

      const { result } = renderHook(() => usePermissionStore());

      await act(async () => {
        await result.current.loadUserPermissions(mockContext);
      });

      expect(result.current.userPermissions).toEqual(mockPermissions);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should fall back to mock permissions on API error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => usePermissionStore());

      await act(async () => {
        await result.current.loadUserPermissions(mockContext);
      });

      expect(result.current.userPermissions.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('checkPermission', () => {
    const mockContext: AccessContext = {
      userId: 'user1',
      tenantId: 'tenant1',
      workspaceId: 'workspace1',
    };

    beforeEach(async () => {
      const { result } = renderHook(() => usePermissionStore());

      // Set up mock user permissions
      const mockPermissions = [
        {
          ...SYSTEM_PERMISSIONS[0],
          granted: true,
          tenantId: 'tenant1',
          workspaceId: 'workspace1',
        },
        {
          ...SYSTEM_PERMISSIONS[1],
          granted: false,
          tenantId: 'tenant1',
          workspaceId: 'workspace1',
        },
      ];

      await act(async () => {
        result.current.userPermissions = mockPermissions;
      });
    });

    it('should return true for granted permissions', async () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasPermission = await result.current.checkPermission(
        SYSTEM_PERMISSIONS[0].id,
        mockContext
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false for denied permissions', async () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasPermission = await result.current.checkPermission(
        SYSTEM_PERMISSIONS[1].id,
        mockContext
      );

      expect(hasPermission).toBe(false);
    });

    it('should return false for non-existent permissions', async () => {
      const { result } = renderHook(() => usePermissionStore());

      const hasPermission = await result.current.checkPermission(
        'non.existent',
        mockContext
      );

      expect(hasPermission).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePermissionStore());

      // Force an error by passing invalid data
      const hasPermission = await result.current.checkPermission(
        null as any,
        mockContext
      );

      expect(hasPermission).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('checkMultiplePermissions', () => {
    const mockContext: AccessContext = {
      userId: 'user1',
      tenantId: 'tenant1',
      workspaceId: 'workspace1',
    };

    beforeEach(async () => {
      const { result } = renderHook(() => usePermissionStore());

      const mockPermissions = [
        {
          ...SYSTEM_PERMISSIONS[0],
          granted: true,
          tenantId: 'tenant1',
          workspaceId: 'workspace1',
        },
        {
          ...SYSTEM_PERMISSIONS[1],
          granted: false,
          tenantId: 'tenant1',
          workspaceId: 'workspace1',
        },
      ];

      await act(async () => {
        result.current.userPermissions = mockPermissions;
      });
    });

    it('should check multiple permissions with OR operator', async () => {
      const { result } = renderHook(() => usePermissionStore());

      const bulkCheck: BulkPermissionCheck = {
        permissions: [SYSTEM_PERMISSIONS[0].id, SYSTEM_PERMISSIONS[1].id],
        context: mockContext,
        operator: 'OR',
      };

      const results = await result.current.checkMultiplePermissions(bulkCheck);

      expect(results).toHaveLength(2);
      expect(results[0].granted).toBe(true);
      expect(results[1].granted).toBe(false);
    });

    it('should check multiple permissions with AND operator', async () => {
      const { result } = renderHook(() => usePermissionStore());

      const bulkCheck: BulkPermissionCheck = {
        permissions: [SYSTEM_PERMISSIONS[0].id, SYSTEM_PERMISSIONS[1].id],
        context: mockContext,
        operator: 'AND',
      };

      const results = await result.current.checkMultiplePermissions(bulkCheck);

      expect(results).toHaveLength(2);
      expect(results[0].granted).toBe(true);
      expect(results[1].granted).toBe(false);
    });

    it('should handle errors in bulk check', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePermissionStore());

      // Force an error
      const originalCheck = result.current.checkPermission;
      result.current.checkPermission = jest.fn().mockRejectedValue(new Error('Test error'));

      const bulkCheck: BulkPermissionCheck = {
        permissions: ['test.permission'],
        context: mockContext,
        operator: 'OR',
      };

      const results = await result.current.checkMultiplePermissions(bulkCheck);

      expect(results).toHaveLength(1);
      expect(results[0].granted).toBe(false);
      expect(results[0].reason).toBe('Error checking permission');

      // Restore
      result.current.checkPermission = originalCheck;
      consoleSpy.mockRestore();
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
    it('should initialize permissions', async () => {
      const loadPermissionsSpy = jest.spyOn(usePermissionStore.getState(), 'loadPermissions');

      await permissionStoreUtils.initialize();

      expect(loadPermissionsSpy).toHaveBeenCalled();
    });
  });

  describe('refreshUserPermissions', () => {
    it('should refresh user permissions', async () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const loadUserPermissionsSpy = jest.spyOn(
        usePermissionStore.getState(),
        'loadUserPermissions'
      );

      await permissionStoreUtils.refreshUserPermissions(mockContext);

      expect(loadUserPermissionsSpy).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('canPerformAction', () => {
    it('should check action permission', async () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkPermissionSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkPermission'
      ).mockResolvedValue(true);

      const result = await permissionStoreUtils.canPerformAction(
        'read',
        'workspace',
        mockContext
      );

      expect(checkPermissionSpy).toHaveBeenCalledWith('workspace.read', mockContext);
      expect(result).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any permission', async () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkPermissionSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkPermission'
      )
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await permissionStoreUtils.hasAnyPermission(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(result).toBe(true);
    });

    it('should return false if user has no permissions', async () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkPermissionSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkPermission'
      ).mockResolvedValue(false);

      const result = await permissionStoreUtils.hasAnyPermission(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkPermissionSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkPermission'
      ).mockResolvedValue(true);

      const result = await permissionStoreUtils.hasAllPermissions(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(result).toBe(true);
    });

    it('should return false if user missing any permission', async () => {
      const mockContext: AccessContext = {
        userId: 'user1',
        tenantId: 'tenant1',
      };

      const checkPermissionSpy = jest.spyOn(
        usePermissionStore.getState(),
        'checkPermission'
      )
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await permissionStoreUtils.hasAllPermissions(
        ['permission1', 'permission2'],
        mockContext
      );

      expect(result).toBe(false);
    });
  });
});