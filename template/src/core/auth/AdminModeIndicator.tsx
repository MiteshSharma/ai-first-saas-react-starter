/**
 * @fileoverview Admin Mode Indicator Component
 *
 * Visual indicator for admin session with tenant context and logout option
 */

import React from 'react';
import { Alert, Button, Space, Typography, Tooltip } from 'antd';
import { LogoutOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from './AuthStore';
import { useTenantStore } from '../../plugins/tenant-management/stores/tenantStore';

const { Text } = Typography;

interface AdminModeIndicatorProps {
  className?: string;
  onLogout?: () => void;
}

/**
 * AdminModeIndicator Component
 *
 * Shows admin session status with tenant context and provides logout functionality
 */
export const AdminModeIndicator: React.FC<AdminModeIndicatorProps> = ({
  className,
  onLogout
}) => {
  const {
    isAdminSession,
    adminMetadata,
    user,
    logout
  } = useAuthStore();

  const {
    currentTenant,
    getAdminForcedTenant
  } = useTenantStore();

  // Don't render if not in admin mode
  if (!isAdminSession || !adminMetadata) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const forcedTenantId = getAdminForcedTenant();
  const isRestrictedToTenant = !!forcedTenantId;

  const message = (
    <Space size="small" align="center">
      <EyeOutlined />
      <Text strong>Admin Mode</Text>
      <Text type="secondary">|</Text>
      <Text>{user?.profile.displayName || user?.email}</Text>
      {currentTenant && (
        <>
          <Text type="secondary">viewing</Text>
          <Text strong>{currentTenant.name}</Text>
        </>
      )}
      {isRestrictedToTenant && (
        <Tooltip title="Admin session is restricted to this tenant only">
          <LockOutlined style={{ color: '#faad14' }} />
        </Tooltip>
      )}
    </Space>
  );

  const action = (
    <Button
      type="link"
      size="small"
      icon={<LogoutOutlined />}
      onClick={handleLogout}
      style={{ height: 'auto', padding: '0 4px' }}
    >
      Exit Admin Mode
    </Button>
  );

  return (
    <Alert
      message={message}
      type="info"
      showIcon={false}
      action={action}
      className={className}
      style={{
        marginBottom: 16,
        border: '1px solid #1890ff',
        backgroundColor: '#f0f8ff'
      }}
    />
  );
};

export default AdminModeIndicator;