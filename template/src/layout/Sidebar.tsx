/**
 * @fileoverview Main Sidebar component for navigation and plugin widgets
 */

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Divider } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  HomeOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useLayout } from './LayoutContext';
import { MenuItem } from './types';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
}

/**
 * Main application sidebar with navigation and plugin widget support
 */
export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useLayout();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Update selected menu item based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    setSelectedKeys([currentPath]);
  }, [location.pathname]);

  // Default navigation items
  const defaultMenuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeOutlined />,
      path: '/',
      order: 0
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardOutlined />,
      path: '/dashboard',
      order: 1
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <ProjectOutlined />,
      path: '/projects',
      order: 2
    },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: <TeamOutlined />,
      path: '/tenants',
      order: 3,
      children: [
        {
          id: 'tenant-dashboard',
          label: 'Dashboard',
          path: '/tenants/dashboard',
          order: 0
        },
        {
          id: 'tenant-settings',
          label: 'Settings',
          path: '/tenants/settings',
          order: 1
        },
        {
          id: 'tenant-members',
          label: 'Members',
          path: '/tenants/members',
          order: 2
        }
      ]
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <FileTextOutlined />,
      path: '/audit-logs',
      order: 4
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      path: '/settings',
      order: 5,
      children: [
        {
          id: 'user-profile',
          label: 'User Profile',
          icon: <UserOutlined />,
          path: '/settings/profile',
          order: 0
        },
        {
          id: 'workspace-settings',
          label: 'Workspace Settings',
          path: '/workspaces/settings',
          order: 1
        },
        {
          id: 'tenant-settings',
          label: 'Tenant Settings',
          path: '/tenants/settings',
          order: 2
        },
        {
          id: 'user-management',
          label: 'User Management',
          path: '/users',
          order: 3
        }
      ]
    }
  ];

  // TODO: Get registered menu items from plugin system
  // const { menuItems } = useLayoutState();
  const pluginMenuItems: MenuItem[] = []; // Placeholder for now

  // Combine default and plugin menu items
  const allMenuItems = [...defaultMenuItems, ...pluginMenuItems]
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Convert MenuItem to Ant Design Menu items
  const convertToAntMenuItems = (items: MenuItem[]): MenuProps['items'] => {
    return items.map(item => ({
      key: item.path || item.id,
      icon: item.icon,
      label: item.label,
      disabled: item.disabled,
      children: item.children ? convertToAntMenuItems(item.children) : undefined,
      onClick: item.onClick || (item.path ? () => navigate(item.path!) : undefined)
    }));
  };

  const menuItems = convertToAntMenuItems(allMenuItems);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    // Find the menu item and handle click
    const findItem = (items: MenuItem[], targetKey: string): MenuItem | undefined => {
      for (const item of items) {
        if (item.path === targetKey || item.id === targetKey) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children, targetKey);
          if (found) return found;
        }
      }
      return undefined;
    };

    const clickedItem = findItem(allMenuItems, key);
    if (clickedItem) {
      if (clickedItem.onClick) {
        clickedItem.onClick();
      } else if (clickedItem.path) {
        navigate(clickedItem.path);
      }
    }
  };

  return (
    <Sider
      theme={theme}
      collapsed={collapsed}
      width={256}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64, // Account for header height
        overflow: 'auto',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        zIndex: 99
      }}
    >
      <div style={{ padding: '16px 0' }}>
        {/* Main Navigation Menu */}
        <Menu
          theme={theme}
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent'
          }}
        />

        {/* Plugin Sidebar Widgets */}
        {!collapsed && (
          <>
            <Divider style={{ margin: '16px 0', borderColor: theme === 'dark' ? '#434343' : '#f0f0f0' }} />

            {/* Top sidebar widgets */}
            <div style={{ padding: '0 16px' }}>
              {/* TODO: Render top sidebar widgets from plugins */}
            </div>

            {/* Bottom sidebar widgets */}
            <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, padding: '0 16px' }}>
              {/* TODO: Render bottom sidebar widgets from plugins */}
            </div>
          </>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;