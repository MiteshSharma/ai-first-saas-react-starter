/**
 * @fileoverview Route Guard (Plan 3)
 *
 * Simple route protection for authenticated and unauthenticated routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../auth/AuthStore';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  redirectTo?: string;
}

/**
 * Route guard component integrated with auth system
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiresAuth = false,
  redirectTo = '/auth/login'
}) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (requiresAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!requiresAuth && isAuthenticated) {
    // If user is logged in but trying to access auth pages, redirect to dashboard
    const publicPaths = ['/auth/login', '/auth/register', '/auth/signup-with-email'];
    if (publicPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default RouteGuard;