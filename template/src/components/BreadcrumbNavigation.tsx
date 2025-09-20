/**
 * @fileoverview Breadcrumb Navigation Component
 *
 * Provides tenant and workspace navigation in breadcrumb format
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Button, Typography, Space } from 'antd';
import {
  DownOutlined,
  CheckOutlined,
  PlusOutlined,
  TeamOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useTenantStore } from '../plugins/tenant-management/stores/tenantStore';
import { useWorkspaceStore } from '../plugins/workspace-management/stores/workspaceStore';
import { useLayout } from '../layout/LayoutContext';
import type { MenuProps } from 'antd';

const { Text } = Typography;

interface BreadcrumbNavigationProps {
  onCreateTenant?: () => void;
  onCreateWorkspace?: () => void;
}

/**
 * Breadcrumb navigation component for tenant and workspace switching
 */
export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  onCreateTenant,
  onCreateWorkspace
}) => {
  const navigate = useNavigate();
  const { theme } = useLayout();
  const {
    currentTenant,
    userTenants,
    switchTenant,
    loading: tenantLoading
  } = useTenantStore();

  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    loading: workspaceLoading
  } = useWorkspaceStore();

  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const textColor = theme === 'dark' ? '#fff' : '#000';
  const mutedColor = theme === 'dark' ? '#ccc' : '#666';

  const handleTenantSelect = async (tenantId: string) => {
    if (tenantId !== currentTenant?.id) {
      await switchTenant(tenantId);
    }
    setTenantDropdownOpen(false);
  };

  const handleWorkspaceSelect = async (workspaceId: string) => {
    if (workspaceId !== currentWorkspace?.id) {
      await switchWorkspace(workspaceId);
    }
    setWorkspaceDropdownOpen(false);
  };

  const handleCreateTenant = () => {
    setTenantDropdownOpen(false);
    navigate('/tenants/create');
  };

  const handleCreateWorkspace = () => {
    setWorkspaceDropdownOpen(false);
    navigate('/workspaces/create');
  };

  // Tenant dropdown menu items
  const tenantMenuItems: MenuProps['items'] = [
    ...userTenants.map(tenant => ({
      key: tenant.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 200 }}>
          <Space>
            <TeamOutlined />
            <span>{tenant.name}</span>
          </Space>
          {tenant.id === currentTenant?.id && <CheckOutlined style={{ color: '#52c41a' }} />}
        </div>
      ),
      onClick: () => handleTenantSelect(tenant.id)
    })),
    {
      type: 'divider'
    },
    {
      key: 'create-tenant',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusOutlined />
          <span>Create Tenant</span>
        </div>
      ),
      onClick: handleCreateTenant
    }
  ];

  // Workspace dropdown menu items
  const workspaceMenuItems: MenuProps['items'] = [
    ...workspaces.map(workspace => ({
      key: workspace.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 200 }}>
          <Space>
            <AppstoreOutlined />
            <span>{workspace.name}</span>
          </Space>
          {workspace.id === currentWorkspace?.id && <CheckOutlined style={{ color: '#52c41a' }} />}
        </div>
      ),
      onClick: () => handleWorkspaceSelect(workspace.id)
    })),
    {
      type: 'divider'
    },
    {
      key: 'create-workspace',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusOutlined />
          <span>Create Workspace</span>
        </div>
      ),
      onClick: handleCreateWorkspace
    }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
      {/* Separator */}
      <Text style={{ color: mutedColor, fontSize: 16 }}>/</Text>

      {/* Tenant Selector */}
      <Dropdown
        menu={{ items: tenantMenuItems }}
        trigger={['click']}
        open={tenantDropdownOpen}
        onOpenChange={setTenantDropdownOpen}
        placement="bottomLeft"
      >
        <Button
          type="text"
          loading={tenantLoading}
          style={{
            color: textColor,
            border: 'none',
            padding: '4px 8px',
            height: 'auto',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          <Space size={4}>
            <TeamOutlined />
            <span>{currentTenant?.name || 'Select Tenant'}</span>
            <DownOutlined style={{ fontSize: 10 }} />
          </Space>
        </Button>
      </Dropdown>

      {/* Separator */}
      {currentTenant && (
        <>
          <Text style={{ color: mutedColor, fontSize: 16 }}>/</Text>

          {/* Workspace Selector */}
          <Dropdown
            menu={{ items: workspaceMenuItems }}
            trigger={['click']}
            open={workspaceDropdownOpen}
            onOpenChange={setWorkspaceDropdownOpen}
            placement="bottomLeft"
          >
            <Button
              type="text"
              loading={workspaceLoading}
              style={{
                color: textColor,
                border: 'none',
                padding: '4px 8px',
                height: 'auto',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              <Space size={4}>
                <AppstoreOutlined />
                <span>{currentWorkspace?.name || 'Select Workspace'}</span>
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>
        </>
      )}
    </div>
  );
};

export default BreadcrumbNavigation;