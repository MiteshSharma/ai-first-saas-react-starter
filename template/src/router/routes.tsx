import { lazy, ReactElement, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { pluginManager } from '../core/plugin-system/PluginManager';

const HomePage = lazy(() => import('../pages/HomePage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const UserProfilePage = lazy(() => import('../pages/settings/UserProfilePage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const SignupWithEmailPage = lazy(() => import('../pages/auth/SignupWithEmailPage'));
const SignupCompletePage = lazy(() => import('../pages/auth/SignupCompletePage'));
const PasswordResetRequestPage = lazy(() => import('../pages/auth/PasswordResetRequestPage'));
const PasswordResetCompletePage = lazy(() => import('../pages/auth/PasswordResetCompletePage'));

const LazyWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
);

// Base routes that are always available
const baseRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <LazyWrapper>
        <HomePage />
      </LazyWrapper>
    ),
    index: true,
  },
  {
    path: '/dashboard',
    element: (
      <LazyWrapper>
        <DashboardPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/projects',
    element: (
      <LazyWrapper>
        <ProjectsPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/settings',
    element: (
      <LazyWrapper>
        <SettingsPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/settings/profile',
    element: (
      <LazyWrapper>
        <UserProfilePage />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: (
          <LazyWrapper>
            <LoginPage />
          </LazyWrapper>
        ),
      },
      {
        path: 'register',
        element: (
          <LazyWrapper>
            <RegisterPage />
          </LazyWrapper>
        ),
      },
      {
        path: 'signup-with-email',
        element: (
          <LazyWrapper>
            <SignupWithEmailPage />
          </LazyWrapper>
        ),
      },
      {
        path: 'signup-complete',
        element: (
          <LazyWrapper>
            <SignupCompletePage />
          </LazyWrapper>
        ),
      },
      {
        path: 'password-reset-request',
        element: (
          <LazyWrapper>
            <PasswordResetRequestPage />
          </LazyWrapper>
        ),
      },
      {
        path: 'password-reset-complete',
        element: (
          <LazyWrapper>
            <PasswordResetCompletePage />
          </LazyWrapper>
        ),
      },
    ],
  },
];

// Function to get dynamic routes with plugin routes included
export const getDynamicRoutes = (): RouteObject[] => {
  // Get plugin routes and add them to base routes
  const pluginRoutes = pluginManager.getRegisteredRoutes();
  const pluginRouteObjects: RouteObject[] = [];

  pluginRoutes.forEach((Component, path) => {
    pluginRouteObjects.push({
      path,
      element: (
        <LazyWrapper>
          <Component />
        </LazyWrapper>
      )
    });
  });

  return [...baseRoutes, ...pluginRouteObjects];
};

// Function to get standalone routes (full-screen, bypass layout)
export const getStandaloneRoutes = (): RouteObject[] => {
  const standaloneRoutes = pluginManager.getStandaloneRoutes();
  const standaloneRouteObjects: RouteObject[] = [];

  standaloneRoutes.forEach((Component, path) => {
    standaloneRouteObjects.push({
      path,
      element: (
        <LazyWrapper>
          <Component />
        </LazyWrapper>
      )
    });
  });

  return standaloneRouteObjects;
};

// Export dynamic routes function (not static routes)
export const routes = getDynamicRoutes();

export default routes;