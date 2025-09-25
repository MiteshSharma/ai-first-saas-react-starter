/**
 * @fileoverview Admin URL Handler Component
 *
 * Handles automatic admin login when URL contains admin token parameters
 */

import React, { useEffect, useCallback, useRef } from 'react';
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
  const hasProcessedRef = useRef(false);

  // Memoize the admin login handler to avoid recreation
  const handleAdminLogin = useCallback(async (token: string, tenantId?: string) => {
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
  }, [loginWithAdminToken, navigate, location.pathname]);

  useEffect(() => {
    // Early exit if:
    // 1. Already an admin session
    // 2. No query parameters
    // 3. Already processed this URL
    if (isAdminSession || !location.search || hasProcessedRef.current) {
      return;
    }

    const urlString = location.search;

    // Quick check - if URL doesn't contain 'adminToken', exit early
    if (!urlString.includes('adminToken')) {
      return;
    }

    console.log('🔍 AdminUrlHandler: Potential admin URL detected');
    console.log('  - Current URL:', urlString);

    // Detailed check for admin URL
    if (adminAuthService.isAdminUrl(urlString)) {
      console.log('✅ AdminUrlHandler: Confirmed admin URL');
      const { token, tenantId } = adminAuthService.extractAdminParams(urlString);
      console.log('📦 AdminUrlHandler: Extracted params:', { token, tenantId });

      if (token) {
        // Mark as processed to avoid re-processing
        hasProcessedRef.current = true;

        // Validate token format first
        if (!adminAuthService.isValidTokenFormat(token)) {
          message.error('Invalid token format');
          navigate('/login', { replace: true });
          return;
        }

        // If already authenticated with normal account, show warning
        if (isAuthenticated && !isAdminSession) {
          message.warning('Logging out current session for admin access');
        }

        // Attempt admin login
        handleAdminLogin(token, tenantId || undefined);
      } else {
        message.error('No admin token provided');
        navigate('/login', { replace: true });
      }
    }
  }, [location.search, isAdminSession, isAuthenticated, navigate, handleAdminLogin]);

  // Reset the processed flag when location changes (but not query params)
  useEffect(() => {
    hasProcessedRef.current = false;
  }, [location.pathname]);

  return <>{children}</>;
};

export default AdminUrlHandler;