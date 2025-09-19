/**
 * @fileoverview PermissionGuard Component Tests
 *
 * Test suite for permission guard components
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  PermissionGuard,
  EnhancedPermissionGuard,
  ActionPermissionGuard,
  RoleGuard,
  WorkspacePermissionGuard,
  TenantPermissionGuard,
} from '../components/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

// Mock the usePermissions hook
jest.mock('../hooks/usePermissions');
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

// Mock Ant Design components to avoid CSS-in-JS issues in tests
jest.mock('antd', () => ({
  Alert: ({ children, ...props }: any) => <div data-testid="alert" {...props}>{children}</div>,
  Spin: ({ children, ...props }: any) => <div data-testid="spin" {...props}>{children}</div>,
}));

// Mock icons
jest.mock('@ant-design/icons', () => ({
  LockOutlined: () => <span data-testid="lock-icon">🔒</span>,
}));

describe('PermissionGuard', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  describe('basic functionality', () => {
    it('should render children when permission is granted', async () => {
      mockPermissions.hasPermission.mockResolvedValue(true);

      render(
        <PermissionGuard permission="test.permission">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should show access denied when permission is not granted', async () => {
      mockPermissions.hasPermission.mockResolvedValue(false);

      render(
        <PermissionGuard permission="test.permission">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockUsePermissions.mockReturnValue({
        ...mockPermissions,
        loading: true,
      } as any);

      render(
        <PermissionGuard permission="test.permission">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('spin')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUsePermissions.mockReturnValue({
        ...mockPermissions,
        error: 'Permission check failed',
      } as any);

      render(
        <PermissionGuard permission="test.permission">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not show loader when showLoader is false', () => {
      mockUsePermissions.mockReturnValue({
        ...mockPermissions,
        loading: true,
      } as any);

      render(
        <PermissionGuard permission="test.permission" showLoader={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('spin')).not.toBeInTheDocument();
    });

    it('should not show fallback when showFallback is false', async () => {
      mockPermissions.hasPermission.mockResolvedValue(false);

      render(
        <PermissionGuard permission="test.permission" showFallback={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('multiple permissions', () => {
    it('should grant access with OR operator when any permission is granted', async () => {
      mockPermissions.hasAnyPermission.mockResolvedValue(true);

      render(
        <PermissionGuard
          permissions={['test.permission1', 'test.permission2']}
          operator="OR"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockPermissions.hasAnyPermission).toHaveBeenCalledWith(
        ['test.permission1', 'test.permission2'],
        undefined
      );
    });

    it('should grant access with AND operator when all permissions are granted', async () => {
      mockPermissions.hasAllPermissions.mockResolvedValue(true);

      render(
        <PermissionGuard
          permissions={['test.permission1', 'test.permission2']}
          operator="AND"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockPermissions.hasAllPermissions).toHaveBeenCalledWith(
        ['test.permission1', 'test.permission2'],
        undefined
      );
    });

    it('should deny access with AND operator when not all permissions are granted', async () => {
      mockPermissions.hasAllPermissions.mockResolvedValue(false);

      render(
        <PermissionGuard
          permissions={['test.permission1', 'test.permission2']}
          operator="AND"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('roles', () => {
    it('should grant access when roles are specified', async () => {
      render(
        <PermissionGuard roles={['admin', 'manager']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('fallback content', () => {
    it('should show custom fallback when permission is denied', async () => {
      mockPermissions.hasPermission.mockResolvedValue(false);

      render(
        <PermissionGuard
          permission="test.permission"
          fallback={<div data-testid="custom-fallback">Custom Fallback</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should show custom fallback when error occurs', () => {
      mockUsePermissions.mockReturnValue({
        ...mockPermissions,
        error: 'Permission check failed',
      } as any);

      render(
        <PermissionGuard
          permission="test.permission"
          fallback={<div data-testid="custom-fallback">Custom Fallback</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  describe('context passing', () => {
    it('should pass context to permission check', async () => {
      mockPermissions.hasPermission.mockResolvedValue(true);

      const context = { tenantId: 'tenant1', workspaceId: 'workspace1' };

      render(
        <PermissionGuard permission="test.permission" context={context}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      );

      await waitFor(() => {
        expect(mockPermissions.hasPermission).toHaveBeenCalledWith('test.permission', context);
      });
    });
  });
});

describe('EnhancedPermissionGuard', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should render with enhanced fallback message', async () => {
    mockPermissions.hasPermission.mockResolvedValue(false);

    render(
      <EnhancedPermissionGuard permission="test.permission">
        <div data-testid="protected-content">Protected Content</div>
      </EnhancedPermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  it('should use custom fallback when provided', async () => {
    mockPermissions.hasPermission.mockResolvedValue(false);

    render(
      <EnhancedPermissionGuard
        permission="test.permission"
        fallback={<div data-testid="custom-fallback">Custom</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </EnhancedPermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });
});

describe('ActionPermissionGuard', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should construct permission from action and resource', async () => {
    mockPermissions.hasPermission.mockResolvedValue(true);

    render(
      <ActionPermissionGuard action="read" resource="workspace">
        <div data-testid="protected-content">Protected Content</div>
      </ActionPermissionGuard>
    );

    await waitFor(() => {
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith('workspace.read', undefined);
    });
  });
});

describe('RoleGuard', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should pass roles to PermissionGuard', async () => {
    render(
      <RoleGuard roles={['admin', 'manager']}>
        <div data-testid="protected-content">Protected Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should use AND operator when specified', async () => {
    render(
      <RoleGuard roles={['admin', 'manager']} operator="AND">
        <div data-testid="protected-content">Protected Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});

describe('WorkspacePermissionGuard', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should pass workspace context', async () => {
    mockPermissions.hasPermission.mockResolvedValue(true);

    render(
      <WorkspacePermissionGuard permission="test.permission" workspaceId="workspace1">
        <div data-testid="protected-content">Protected Content</div>
      </WorkspacePermissionGuard>
    );

    await waitFor(() => {
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        'test.permission',
        { workspaceId: 'workspace1' }
      );
    });
  });
});

describe('TenantPermissionGuard', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should pass tenant context', async () => {
    mockPermissions.hasPermission.mockResolvedValue(true);

    render(
      <TenantPermissionGuard permission="test.permission" tenantId="tenant1">
        <div data-testid="protected-content">Protected Content</div>
      </TenantPermissionGuard>
    );

    await waitFor(() => {
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        'test.permission',
        { tenantId: 'tenant1' }
      );
    });
  });
});

describe('Permission Guard Error Handling', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should handle permission check errors gracefully', async () => {
    mockPermissions.hasPermission.mockRejectedValue(new Error('Permission check failed'));

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <PermissionGuard permission="test.permission">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle null permission gracefully', async () => {
    render(
      <PermissionGuard permission={null as any}>
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should handle empty permissions array', async () => {
    render(
      <PermissionGuard permissions={[]}>
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});

describe('Permission Guard Performance', () => {
  const mockPermissions = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(mockPermissions as any);
  });

  it('should not re-check permissions when dependencies do not change', async () => {
    mockPermissions.hasPermission.mockResolvedValue(true);

    const { rerender } = render(
      <PermissionGuard permission="test.permission">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    const callCount = mockPermissions.hasPermission.mock.calls.length;

    // Re-render with same props
    rerender(
      <PermissionGuard permission="test.permission">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    // Should not have made additional calls
    expect(mockPermissions.hasPermission.mock.calls.length).toBe(callCount);
  });

  it('should re-check permissions when permission changes', async () => {
    mockPermissions.hasPermission.mockResolvedValue(true);

    const { rerender } = render(
      <PermissionGuard permission="test.permission1">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    const callCount = mockPermissions.hasPermission.mock.calls.length;

    // Re-render with different permission
    rerender(
      <PermissionGuard permission="test.permission2">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    await waitFor(() => {
      // Should have made additional calls
      expect(mockPermissions.hasPermission.mock.calls.length).toBeGreaterThan(callCount);
    });
  });
});