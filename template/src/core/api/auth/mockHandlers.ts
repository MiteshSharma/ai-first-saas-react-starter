/**
 * @fileoverview Admin Auth Mock Handlers
 *
 * Mock implementations for admin authentication operations
 */

import { AdminLoginResponse, AdminTokenRequest } from '../../auth/AdminAuthService';

// Mock API delay simulation
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// Mock admin user data
const mockAdminUsers = {
  'valid-admin-token': {
    user: {
      id: 'admin-user-1',
      email: 'admin@example.com',
      profile: {
        displayName: 'Admin User',
        firstName: 'Admin',
        lastName: 'User'
      },
      isAdminUser: true,
      permissions: ['tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete', 'user:manage', 'system:admin']
    },
    tenant: {
      id: 'tenant-1',
      name: 'System Admin Tenant',
      slug: 'system-admin'
    },
    accessToken: 'mock-access-token-12345',
    refreshToken: 'mock-refresh-token-67890'
  },
  'valid-tenant-admin-token': {
    user: {
      id: 'tenant-admin-1',
      email: 'tenant.admin@acme.com',
      profile: {
        displayName: 'Tenant Admin',
        firstName: 'Tenant',
        lastName: 'Admin'
      },
      isAdminUser: true,
      permissions: ['tenant:read', 'tenant:update', 'user:manage']
    },
    tenant: {
      id: 'tenant-1',
      name: 'Acme Corporation',
      slug: 'acme-corp'
    },
    accessToken: 'mock-tenant-access-token-12345',
    refreshToken: 'mock-tenant-refresh-token-67890'
  }
};

/**
 * Mock handlers for admin auth operations
 */
class AdminAuthMockHandlers {
  /**
   * Validate admin token - mock implementation
   */
  static async validateAdminToken(request: AdminTokenRequest): Promise<AdminLoginResponse> {
    await mockApiDelay();

    const { token, tenantId } = request;

    // Check if token exists in mock data
    if (token in mockAdminUsers) {
      const mockUser = mockAdminUsers[token as keyof typeof mockAdminUsers];

      // If tenantId is specified, validate it matches
      if (tenantId && mockUser.tenant.id !== tenantId) {
        throw new Error('Invalid tenant for this admin token');
      }

      return mockUser;
    }

    // Invalid token
    throw new Error('Invalid admin token');
  }

  /**
   * Get mock admin tokens for testing
   */
  static getMockTokens() {
    return Object.keys(mockAdminUsers);
  }
}

export default AdminAuthMockHandlers;