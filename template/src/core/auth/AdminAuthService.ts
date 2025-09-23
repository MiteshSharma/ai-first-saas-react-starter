/**
 * @fileoverview Admin Authentication Service
 *
 * Handles admin token validation and admin-specific authentication logic
 */

import { AdminAuthBackendHelper } from '../api/auth';

export interface AdminLoginResponse {
  user: {
    id: string;
    email: string;
    profile: {
      displayName: string;
      firstName: string;
      lastName: string;
    };
    isAdminUser: boolean;
    permissions: string[];
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface AdminTokenRequest {
  token: string;
  tenantId?: string;
}

/**
 * Admin Authentication Service
 */
class AdminAuthService {
  /**
   * Validate admin token with backend or mock
   */
  async validateAdminToken(token: string, tenantId?: string): Promise<AdminLoginResponse> {
    try {
      return await AdminAuthBackendHelper.validateAdminToken(token, tenantId);
    } catch (error) {
      throw new Error('Invalid admin token');
    }
  }

  /**
   * Get available mock tokens (only for development/testing)
   */
  async getMockTokens(): Promise<string[]> {
    return await AdminAuthBackendHelper.getMockTokens();
  }

  /**
   * Check if current URL contains admin parameters
   */
  isAdminUrl(url: string): boolean {
    const params = new URLSearchParams(url.split('?')[1] || '');
    return params.has('token') || url.includes('/admin');
  }

  /**
   * Extract admin parameters from URL
   */
  extractAdminParams(url: string): { token: string | null; tenantId: string | null } {
    const params = new URLSearchParams(url.split('?')[1] || '');
    return {
      token: params.get('token'),
      tenantId: params.get('tenant')
    };
  }

  /**
   * Clean admin parameters from URL
   */
  cleanUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('tenant');

    // Use replaceState to avoid adding to browser history
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Check if admin token format is valid (basic validation)
   */
  isValidTokenFormat(token: string): boolean {
    // Basic validation: token should be non-empty and reasonable length
    return token.length >= 10 && token.length <= 100 && /^[A-Za-z0-9_-]+$/.test(token);
  }
}

// Export singleton instance
export const adminAuthService = new AdminAuthService();
export default adminAuthService;