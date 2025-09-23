/**
 * @fileoverview Admin Auth Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for admin authentication operations
 */

import { apiHelper } from '../apiHelper';
import { ADMIN_AUTH_ENDPOINTS } from './endpoints';
import { AdminLoginResponse, AdminTokenRequest } from '../../auth/AdminAuthService';

// Dynamic import for mock handlers to avoid circular dependencies
let AdminAuthMockHandlers: any = null;
const isMockMode = () => process.env.REACT_APP_USE_MOCK_API === 'true';

const getMockHandlers = async () => {
  if (!AdminAuthMockHandlers) {
    const module = await import('./mockHandlers');
    AdminAuthMockHandlers = module.default;
  }
  return AdminAuthMockHandlers;
};

/**
 * Backend helper for admin auth API calls
 */
export class AdminAuthBackendHelper {
  /**
   * Validate admin token with backend or mock
   */
  static async validateAdminToken(token: string, tenantId?: string): Promise<AdminLoginResponse> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.validateAdminToken({ token, tenantId });
    }

    const response = await apiHelper.post(ADMIN_AUTH_ENDPOINTS.VALIDATE_TOKEN, {
      token,
      tenantId
    });

    return (response.data as { data: AdminLoginResponse }).data;
  }

  /**
   * Get available mock tokens (only for development/testing)
   */
  static async getMockTokens(): Promise<string[]> {
    if (!isMockMode()) {
      throw new Error('Mock tokens are only available in mock mode');
    }

    const mockHandlers = await getMockHandlers();
    return mockHandlers.getMockTokens();
  }
}

export default AdminAuthBackendHelper;