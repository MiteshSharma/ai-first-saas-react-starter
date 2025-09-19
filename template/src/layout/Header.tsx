/**
 * @fileoverview Main Header component for the layout system
 */

import React from 'react';
import { Layout, Space, Button, Avatar, Dropdown, Typography, Switch } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../core/auth/AuthStore';
import { useLayout } from './LayoutContext';
import { BreadcrumbNavigation } from '../components/BreadcrumbNavigation';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Main application header with user menu, theme toggle, and plugin widget support
 */
export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, theme, setTheme } = useLayout();

  const handleToggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    onToggleSidebar?.();
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
    }
  };

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        // Navigate to profile page
      }
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        // Navigate to settings page
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  return (
    <AntHeader
      style={{
        background: theme === 'dark' ? '#001529' : '#fff',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Left section */}
      <Space align="center">
        {/* Sidebar toggle */}
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleSidebar}
          style={{
            fontSize: '16px',
            width: 40,
            height: 40,
            color: theme === 'dark' ? '#fff' : '#000'
          }}
        />

        {/* App logo/title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text
            strong
            style={{
              fontSize: '18px',
              color: theme === 'dark' ? '#fff' : '#000',
              marginLeft: '8px'
            }}
          >
            SaaS App
          </Text>
        </div>

        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          onCreateTenant={() => {
            // TODO: Open create tenant modal
            // eslint-disable-next-line no-console
            console.log('Create tenant requested');
          }}
          onCreateWorkspace={() => {
            // TODO: Open create workspace modal
            // eslint-disable-next-line no-console
            console.log('Create workspace requested');
          }}
        />
      </Space>

      {/* Right section */}
      <Space align="center" size="middle">
        {/* Theme toggle */}
        <Space align="center">
          <BulbOutlined style={{ color: theme === 'dark' ? '#fff' : '#000' }} />
          <Switch
            checked={theme === 'dark'}
            onChange={handleThemeToggle}
            size="small"
          />
        </Space>

        {/* User info and dropdown */}
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button
              type="text"
              style={{
                height: 40,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Avatar
                size={32}
                src={user.profile?.avatar}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: '#1677ff'
                }}
              >
                {user.profile?.displayName ? user.profile.displayName.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme === 'dark' ? '#fff' : '#000'
                }}>
                  {user.profile?.displayName || 'User'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#ccc' : '#666'
                }}>
                  {user.email}
                </div>
              </div>
            </Button>
          </Dropdown>
        ) : (
          <Button type="primary" href="/auth/login">
            Login
          </Button>
        )}
      </Space>
    </AntHeader>
  );
};

export default Header;