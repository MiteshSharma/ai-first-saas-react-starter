/**
 * @fileoverview Tenant Switcher Component
 *
 * Dropdown component for switching between user's tenants
 */

import React from 'react';
import { Select, Avatar, Typography } from 'antd';
import { useTenantStore } from '../stores/tenantStore';
import { Tenant } from '../types';

const { Text } = Typography;
const { Option } = Select;

interface TenantSwitcherProps {
  className?: string;
  size?: 'small' | 'middle' | 'large';
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  className,
  size = 'middle'
}) => {
  const {
    currentTenant,
    userTenants,
    loading,
    switchTenant
  } = useTenantStore();

  const handleTenantChange = async (tenantId: string) => {
    if (tenantId !== currentTenant?.id) {
      await switchTenant(tenantId);
    }
  };

  return (
    <Select
      className={className}
      size={size}
      value={currentTenant?.id}
      loading={loading}
      onChange={handleTenantChange}
      style={{ minWidth: 200 }}
      dropdownStyle={{ minWidth: 250 }}
      placeholder="Select tenant..."
    >
      {userTenants.map((tenant: Tenant) => (
        <Option key={tenant.id} value={tenant.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              size="small"
              style={{
                backgroundColor: tenant.settings.branding.primaryColor,
                color: '#fff'
              }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text strong>{tenant.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {tenant.subscription.plan} • {tenant.subscription.status}
              </Text>
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default TenantSwitcher;