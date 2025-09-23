/**
 * @fileoverview Tests for Admin Auth Backend Helper
 */

import { AdminAuthBackendHelper } from '../backendHelper';

// Mock environment variable
const originalEnv = process.env.REACT_APP_USE_MOCK_API;

describe('AdminAuthBackendHelper', () => {
  afterEach(() => {
    process.env.REACT_APP_USE_MOCK_API = originalEnv;
  });

  describe('Mock Mode', () => {
    beforeEach(() => {
      process.env.REACT_APP_USE_MOCK_API = 'true';
    });

    it('should validate valid admin token in mock mode', async () => {
      const result = await AdminAuthBackendHelper.validateAdminToken('valid-admin-token');

      expect(result).toEqual({
        user: {
          id: 'admin-user-1',
          email: 'admin@example.com',
          profile: {
            displayName: 'Admin User',
            firstName: 'Admin',
            lastName: 'User'
          },
          isAdminUser: true,
          permissions: expect.arrayContaining(['tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete', 'user:manage', 'system:admin'])
        },
        tenant: {
          id: 'tenant-1',
          name: 'System Admin Tenant',
          slug: 'system-admin'
        },
        accessToken: 'mock-access-token-12345',
        refreshToken: 'mock-refresh-token-67890'
      });
    });

    it('should reject invalid token in mock mode', async () => {
      await expect(AdminAuthBackendHelper.validateAdminToken('invalid-token'))
        .rejects.toThrow('Invalid admin token');
    });

    it('should validate tenant-specific token in mock mode', async () => {
      const result = await AdminAuthBackendHelper.validateAdminToken('valid-tenant-admin-token', 'tenant-1');

      expect(result.user.email).toBe('tenant.admin@acme.com');
      expect(result.tenant.id).toBe('tenant-1');
    });

    it('should reject mismatched tenant in mock mode', async () => {
      await expect(AdminAuthBackendHelper.validateAdminToken('valid-tenant-admin-token', 'wrong-tenant'))
        .rejects.toThrow('Invalid tenant for this admin token');
    });

    it('should return mock tokens list', async () => {
      const tokens = await AdminAuthBackendHelper.getMockTokens();

      expect(tokens).toEqual(['valid-admin-token', 'valid-tenant-admin-token']);
    });
  });

  describe('Non-Mock Mode', () => {
    beforeEach(() => {
      process.env.REACT_APP_USE_MOCK_API = 'false';
    });

    it('should throw error when requesting mock tokens in non-mock mode', async () => {
      await expect(AdminAuthBackendHelper.getMockTokens())
        .rejects.toThrow('Mock tokens are only available in mock mode');
    });
  });
});