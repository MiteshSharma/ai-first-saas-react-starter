/**
 * @fileoverview Protected Route Component
 *
 * A clean, reusable wrapper for protecting plugin routes with authentication
 */

import React from 'react';
import { RouteGuard } from './RouteGuard';

interface ProtectedRouteProps {
  component: React.ComponentType;
}

/**
 * Higher-order component that wraps any component with authentication protection
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component }) => {
  return (
    <RouteGuard requiresAuth={true}>
      <Component />
    </RouteGuard>
  );
};

/**
 * Factory function to create protected route components
 * This is the clean API for plugins to use
 */
export const createProtectedRoute = (Component: React.ComponentType): React.ComponentType => {
  const ProtectedComponent: React.FC = () => (
    <ProtectedRoute component={Component} />
  );

  // Set display name for debugging
  ProtectedComponent.displayName = `ProtectedRoute(${Component.displayName || Component.name || 'Component'})`;

  return ProtectedComponent;
};

export default ProtectedRoute;