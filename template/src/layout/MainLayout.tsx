/**
 * @fileoverview Main Layout component that wraps the entire application
 */

import React from 'react';
import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { useLocation } from 'react-router-dom';
import { LayoutProvider, useLayout } from './LayoutContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { RouteGuard } from '../core/routing/RouteGuard';

const { Content } = Layout;

interface MainLayoutInnerProps {
  children: React.ReactNode;
}

/**
 * Inner layout component that uses the layout context
 */
const MainLayoutInner: React.FC<MainLayoutInnerProps> = ({ children }) => {
  const location = useLocation();
  const { sidebarCollapsed, theme, setSidebarCollapsed } = useLayout();

  // Auth pages don't need the full layout
  const isAuthPage = location.pathname.startsWith('/auth');

  // Configure Ant Design theme
  const antdThemeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 6,
    }
  };

  // For auth pages, render minimal layout
  if (isAuthPage) {
    return (
      <ConfigProvider theme={antdThemeConfig}>
        <Layout style={{ minHeight: '100vh', background: theme === 'dark' ? '#001529' : '#f5f5f5' }}>
          <Content>
            {children}
          </Content>
        </Layout>
      </ConfigProvider>
    );
  }

  // For main app pages, render full layout with sidebar and header
  return (
    <ConfigProvider theme={antdThemeConfig}>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <Layout>
          {/* Sidebar */}
          <Sidebar collapsed={sidebarCollapsed} />

          {/* Main Content */}
          <Layout
            style={{
              marginLeft: sidebarCollapsed ? 80 : 256,
              transition: 'margin-left 0.2s',
              marginTop: 0, // Header is fixed, so no top margin needed
            }}
          >
            <Content
              style={{
                padding: '24px',
                margin: 0,
                minHeight: 'calc(100vh - 64px)', // Account for header height
                background: theme === 'dark' ? '#141414' : '#f5f5f5',
                overflow: 'auto'
              }}
            >
              <div
                style={{
                  background: theme === 'dark' ? '#1f1f1f' : '#fff',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  minHeight: 'calc(100vh - 112px)' // Account for header + content padding
                }}
              >
                {children}
              </div>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

/**
 * Main Layout component with Layout Provider
 */
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LayoutProvider>
      <MainLayoutInner>
        {children}
      </MainLayoutInner>
    </LayoutProvider>
  );
};

/**
 * Layout wrapper for protected routes
 */
export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard requiresAuth>
      <MainLayout>
        {children}
      </MainLayout>
    </RouteGuard>
  );
};

/**
 * Layout wrapper for public routes
 */
export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard requiresAuth={false}>
      <MainLayout>
        {children}
      </MainLayout>
    </RouteGuard>
  );
};

export default MainLayout;