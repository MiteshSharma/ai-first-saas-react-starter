/**
 * @fileoverview Admin URL Handler Component
 *
 * Handles automatic admin login when URL contains admin token parameters
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuthStore } from './AuthStore';
import { adminAuthService } from './AdminAuthService';

interface AdminUrlHandlerProps {
  children: React.ReactNode;
}

/**
 * AdminUrlHandler Component
 *
 * Monitors URL for admin token parameters and handles auto-login
 */
export const AdminUrlHandler: React.FC<AdminUrlHandlerProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithAdminToken, isAuthenticated, isAdminSession } = useAuthStore();

  useEffect(() => {
    console.log('🔍 AdminUrlHandler: Checking URL for admin params');
    console.log('  - Current URL:', location.search);
    console.log('  - Is admin session:', isAdminSession);

    const handleAdminLogin = async (token: string, tenantId?: string) => {
      console.log('🚀 AdminUrlHandler: Starting admin login');
      console.log('  - Token:', token);
      console.log('  - TenantId:', tenantId);

      try {
        await loginWithAdminToken(token, tenantId || undefined);
        message.success('Admin access granted');

        // Navigate to current path without query params
        const cleanPath = location.pathname;
        navigate(cleanPath, { replace: true });
      } catch (error) {
        console.error('❌ Admin login failed:', error);
        message.error('Invalid admin access token');
        navigate('/login', { replace: true });
      }
    };

    // Only process admin URLs if not already authenticated as admin
    if (!isAdminSession) {
      const urlString = location.search;
      console.log('🔍 AdminUrlHandler: Checking if admin URL:', urlString);

      if (adminAuthService.isAdminUrl(urlString)) {
        console.log('✅ AdminUrlHandler: Is admin URL!');
        const { token, tenantId } = adminAuthService.extractAdminParams(urlString);
        console.log('📦 AdminUrlHandler: Extracted params:', { token, tenantId });

        if (token) {
          // Validate token format first
          if (!adminAuthService.isValidTokenFormat(token)) {
            message.error('Invalid token format');
            navigate('/login', { replace: true });
            return;
          }

          // If already authenticated with normal account, logout first
          if (isAuthenticated && !isAdminSession) {
            message.warning('Logging out current session for admin access');
            // Note: We could add a logout call here if needed
          }

          // Attempt admin login
          handleAdminLogin(token, tenantId || undefined);
        } else {
          message.error('No admin token provided');
          navigate('/login', { replace: true });
        }
      }
    }
  }, [location, loginWithAdminToken, isAuthenticated, isAdminSession, navigate]);

  return <>{children}</>;
};

export default AdminUrlHandler;