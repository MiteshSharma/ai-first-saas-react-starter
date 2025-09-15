import React from 'react';
import { Select, Avatar, Typography, Space, Spin } from 'antd';
import { SwapOutlined, TeamOutlined } from '@ant-design/icons';
import { useTenantStore } from '../../../stores/tenant/tenantStore';
import type { Tenant } from '../../../stores/tenant/types';

const { Option } = Select;
const { Text } = Typography;

interface TenantSwitcherProps {
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
  showLabel?: boolean;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

/**
 * @component TenantSwitcher
 * @description Dropdown component for switching between user's tenants
 */
export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  style,
  size = 'middle',
  showLabel = false,
  placement = 'bottomLeft'
}) => {
  const {
    tenants,
    currentTenant,
    loading,
    error,
    switchTenant,
    fetchTenants
  } = useTenantStore();

  // Fetch tenants on component mount if not already loaded
  React.useEffect(() => {
    if (tenants.length === 0 && !loading && !error) {
      fetchTenants();
    }
  }, [tenants.length, loading, error, fetchTenants]);

  const handleTenantChange = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  };

  const getAvatarColor = (tenantName: string): string => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#ff6b35'];
    const index = tenantName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderTenantOption = (tenant: Tenant) => (
    <Option key={tenant.id} value={tenant.id}>
      <Space>
        <Avatar
          size="small"
          style={{ 
            backgroundColor: getAvatarColor(tenant.name),
            fontSize: '12px'
          }}
        >
          {tenant.name.charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <div style={{ fontWeight: 500 }}>{tenant.name}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} Plan
          </Text>
        </div>
      </Space>
    </Option>
  );

  const dropdownRender = (menu: React.ReactElement) => (
    <div>
      {menu}
      {tenants.length > 0 && (
        <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {tenants.length} workspace{tenants.length !== 1 ? 's' : ''} available
          </Text>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div style={style}>
        <Text type="danger" style={{ fontSize: '12px' }}>
          Failed to load tenants
        </Text>
      </div>
    );
  }

  if (loading && tenants.length === 0) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center' }}>
        <Spin size="small" />
        <Text style={{ marginLeft: 8, fontSize: '12px' }}>Loading...</Text>
      </div>
    );
  }

  return (
    <div style={style}>
      {showLabel && (
        <Text 
          type="secondary" 
          style={{ 
            fontSize: '11px', 
            display: 'block', 
            marginBottom: 4 
          }}
        >
          Current Workspace
        </Text>
      )}
      
      <Select
        value={currentTenant?.id}
        onChange={handleTenantChange}
        style={{ width: '100%', minWidth: 200 }}
        size={size}
        placeholder="Select workspace"
        suffixIcon={<SwapOutlined />}
        loading={loading}
        dropdownRender={dropdownRender}
        placement={placement}
        optionLabelProp="label"
      >
        {tenants.map(tenant => (
          <Option 
            key={tenant.id} 
            value={tenant.id}
            label={
              <Space>
                <Avatar
                  size="small"
                  style={{ 
                    backgroundColor: getAvatarColor(tenant.name),
                    fontSize: '10px'
                  }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </Avatar>
                <span>{tenant.name}</span>
              </Space>
            }
          >
            <Space>
              <Avatar
                size="small"
                style={{ 
                  backgroundColor: getAvatarColor(tenant.name),
                  fontSize: '12px'
                }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div style={{ fontWeight: 500 }}>{tenant.name}</div>
                <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                  <TeamOutlined style={{ marginRight: 4 }} />
                  {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} Plan
                </div>
              </div>
            </Space>
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default TenantSwitcher;