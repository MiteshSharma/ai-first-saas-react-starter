/**
 * @fileoverview Tenant Switcher Component
 *
 * Dropdown component for switching between user's tenants
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown, Avatar, Typography, Space } from 'antd';
import { DownOutlined, CheckOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useTenantStore } from '../stores/tenantStore';
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
    switchTenant
  } = useTenantStore();

  const handleTenantSelect = async (tenantId: string) => {
    if (tenantId !== currentTenant?.id) {
      await switchTenant(tenantId);
    }
    setOpen(false);
  };

  const handleCreateTenant = () => {
    setOpen(false);
    navigate('/tenants/create');
  };

  const menuItems: MenuProps['items'] = [
    ...userTenants.map((tenant: Tenant) => ({
      key: tenant.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 250 }}>
          <Space>
            <Avatar
              size="small"
              style={{
                backgroundColor: tenant.settings.branding.primaryColor,
                color: '#fff'
              }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong>{tenant.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {tenant.subscription.plan} • {tenant.subscription.status}
              </Text>
            </div>
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

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      className={className}
    >
      <Button
        size={size}
        loading={loading}
        style={{ minWidth: 200 }}
      >
        <Space>
          <TeamOutlined />
          {currentTenant ? (
            <div style={{ textAlign: 'left' }}>
              <Text strong>{currentTenant.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentTenant.subscription.plan}
              </Text>
            </div>
          ) : (
            'Select tenant...'
          )}
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default TenantSwitcher;