/**
 * @fileoverview Tenant Switcher Component
 *
 * Dropdown component for switching between user's tenants
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown, Avatar, Typography, Space, Tag, Tooltip } from 'antd';
import { DownOutlined, CheckOutlined, PlusOutlined, TeamOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { useTenantStore } from '../stores/tenantStore';
import { useAuthStore } from '../../../core/auth/AuthStore';
import { Tenant } from '../types';
import type { MenuProps } from 'antd';

const { Text } = Typography;

interface TenantSwitcherProps {
  className?: string;
  size?: 'small' | 'middle' | 'large';
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  className,
  size = 'middle'
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    currentTenant,
    userTenants,
    loading,
    switchTenant,
    isAdminMode,
    getAdminForcedTenant
  } = useTenantStore();

  const { isAdminSession } = useAuthStore();

  const handleTenantSelect = async (tenantId: string) => {
    // Prevent tenant switching if admin is restricted to a specific tenant
    const adminForcedTenant = getAdminForcedTenant();
    if (isAdminMode() && adminForcedTenant && tenantId !== adminForcedTenant) {
      setOpen(false);
      return;
    }

    if (tenantId !== currentTenant?.id) {
      await switchTenant(tenantId);
    }
    setOpen(false);
  };

  const handleCreateTenant = () => {
    setOpen(false);
    navigate('/tenants/create');
  };

  // Check if admin is restricted to current tenant
  const adminForcedTenant = getAdminForcedTenant();
  const isRestrictedAdmin = isAdminMode() && !!adminForcedTenant;

  const menuItems: MenuProps['items'] = [
    ...userTenants.map((tenant: Tenant) => ({
      key: tenant.id,
      disabled: isRestrictedAdmin && tenant.id !== adminForcedTenant,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 250 }}>
          <Space>
            <Avatar
              size="small"
              style={{
                backgroundColor: tenant.settings?.branding?.primaryColor || '#1890ff',
                color: '#fff'
              }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Space align="center">
                <Text strong>{tenant.name}</Text>
                {isAdminMode() && tenant.id === adminForcedTenant && (
                  <Tag color="orange" icon={<LockOutlined />}>
                    Locked
                  </Tag>
                )}
              </Space>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {tenant.subscription?.plan || 'Basic'} • {tenant.subscription?.status || 'Active'}
              </Text>
            </div>
          </Space>
          {tenant.id === currentTenant?.id && <CheckOutlined style={{ color: '#52c41a' }} />}
        </div>
      ),
      onClick: () => handleTenantSelect(tenant.id)
    })),
    // Hide create tenant option for admin users
    ...(!isAdminMode() ? [
      {
        type: 'divider' as const
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
    ] : [])
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      className={className}
      disabled={isRestrictedAdmin} // Disable dropdown for restricted admin
    >
      <Tooltip
        title={isRestrictedAdmin ? 'Admin session is locked to this tenant' : undefined}
        placement="bottom"
      >
        <Button
          size={size}
          loading={loading}
          style={{ minWidth: 200 }}
          disabled={isRestrictedAdmin}
        >
          <Space>
            {isAdminMode() ? <EyeOutlined /> : <TeamOutlined />}
            {currentTenant ? (
              <div style={{ textAlign: 'left' }}>
                <Space align="center">
                  <Text strong>{currentTenant.name}</Text>
                  {isAdminMode() && (
                    <Tag color="blue">
                      Admin View
                    </Tag>
                  )}
                </Space>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {currentTenant.subscription?.plan || 'Basic'}
                  {isRestrictedAdmin && ' • Locked'}
                </Text>
              </div>
            ) : (
              'Select tenant...'
            )}
            {!isRestrictedAdmin && <DownOutlined />}
            {isRestrictedAdmin && <LockOutlined />}
          </Space>
        </Button>
      </Tooltip>
    </Dropdown>
  );
};

export default TenantSwitcher;