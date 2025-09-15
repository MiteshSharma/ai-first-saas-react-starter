import { lazy, ReactElement, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { pluginManager } from '../core/plugin-system/PluginManager';

const HomePage = lazy(() => import('../pages/HomePage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const SignupWithEmailPage = lazy(() => import('../pages/auth/SignupWithEmailPage'));
const SignupCompletePage = lazy(() => import('../pages/auth/SignupCompletePage'));
const PasswordResetRequestPage = lazy(() => import('../pages/auth/PasswordResetRequestPage'));
const PasswordResetCompletePage = lazy(() => import('../pages/auth/PasswordResetCompletePage'));

const LazyWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
);

// Function to get dynamic routes with plugin routes included
const getDynamicRoutes = (): RouteObject[] => {
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

// Export dynamic routes
export const routes = getDynamicRoutes();

export default routes;