/**
 * @fileoverview Plugin-Aware Router (Plan 3)
 *
 * Router that integrates with the plugin system to dynamically register routes
 */

import React, { ReactElement, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { pluginManager } from '../plugin-system/PluginManager';

const LazyWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
);

/**
 * Component that renders all plugin-registered routes
 */
export const PluginRoutes: React.FC = () => {
  const pluginRoutes = pluginManager.getRegisteredRoutes();

  return (
    <Routes>
      {Array.from(pluginRoutes.entries()).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <LazyWrapper>
              <Component />
            </LazyWrapper>
          }
        />
      ))}
    </Routes>
  );
};

/**
 * Hook to get all plugin routes for navigation menus
 */
export const usePluginRoutes = () => {
  const pluginRoutes = pluginManager.getRegisteredRoutes();

  return Array.from(pluginRoutes.entries()).map(([path, Component]) => ({
    path,
    component: Component
  }));
};

export default PluginRoutes;