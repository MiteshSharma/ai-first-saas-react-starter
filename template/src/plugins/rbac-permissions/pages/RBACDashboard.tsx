/**
 * @fileoverview RBAC Dashboard Page
 *
 * Main dashboard for role-based access control management
 */

import React, { useState } from 'react';
import {
  Layout,
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  Typography,
  Button,
  Dropdown,
  Menu,
} from 'antd';
import {
  SecurityScanOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  EyeOutlined,
  DownOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { PermissionGuard } from '../components/PermissionGuard';
import { RoleManagement } from '../components/RoleManagement';
import { UserRoleAssignment } from '../components/UserRoleAssignment';
import { PermissionViewer } from '../components/PermissionViewer';
import { useCoreContext } from '../../../core/context/CoreContext';

const { Content } = Layout;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface RBACDashboardProps {
  defaultTab?: string;
}

export const RBACDashboard: React.FC<RBACDashboardProps> = ({
  defaultTab = 'overview',
}) => {
  const { state } = useCoreContext();
  const { currentTenant, currentWorkspace } = state;
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Mock statistics - in real implementation, these would come from API
  const stats = {
    totalRoles: 8,
    activeRoles: 6,
    totalUsers: 42,
    usersWithRoles: 38,
    totalPermissions: 25,
    systemPermissions: 15,
  };

  const handleExportConfig = () => {
    // Export RBAC configuration
    console.log('Exporting RBAC configuration...');
  };

  const handleImportConfig = () => {
    // Import RBAC configuration
    console.log('Importing RBAC configuration...');
  };

  const actionMenu = (
    <Menu>
      <Menu.Item key="export" icon={<ExportOutlined />} onClick={handleExportConfig}>
        Export Configuration
      </Menu.Item>
      <Menu.Item key="import" icon={<ImportOutlined />} onClick={handleImportConfig}>
        Import Configuration
      </Menu.Item>
    </Menu>
  );

  const OverviewTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Roles"
              value={stats.totalRoles}
              prefix={<SecurityScanOutlined />}
              suffix={
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ({stats.activeRoles} active)
                </Text>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ({stats.usersWithRoles} with roles)
                </Text>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Permissions"
              value={stats.totalPermissions}
              prefix={<EyeOutlined />}
              suffix={
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ({stats.systemPermissions} system)
                </Text>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Coverage"
              value={Math.round((stats.usersWithRoles / stats.totalUsers) * 100)}
              suffix="%"
              prefix={<TeamOutlined />}
              valueStyle={{
                color: stats.usersWithRoles / stats.totalUsers > 0.8 ? '#3f8600' : '#faad14'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Context Information */}
      <Alert
        message="Current Context"
        description={
          <Space direction="vertical">
            <Text>
              <strong>Tenant:</strong> {currentTenant?.name || 'Not selected'}
            </Text>
            {currentWorkspace && (
              <Text>
                <strong>Workspace:</strong> {currentWorkspace.name}
              </Text>
            )}
            <Text type="secondary">
              RBAC settings apply to the current tenant and workspace context.
            </Text>
          </Space>
        }
        type="info"
        showIcon
      />

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={16}>
          <Col span={6}>
            <PermissionGuard permission="role.create">
              <Card
                hoverable
                style={{ textAlign: 'center' }}
                onClick={() => setActiveTab('roles')}
              >
                <SecurityScanOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>Create Role</div>
              </Card>
            </PermissionGuard>
          </Col>
          <Col span={6}>
            <PermissionGuard permission="role.assign">
              <Card
                hoverable
                style={{ textAlign: 'center' }}
                onClick={() => setActiveTab('users')}
              >
                <UserOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>Assign Roles</div>
              </Card>
            </PermissionGuard>
          </Col>
          <Col span={6}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              onClick={() => setActiveTab('permissions')}
            >
              <EyeOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>View Permissions</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              onClick={() => setActiveTab('settings')}
            >
              <SettingOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>RBAC Settings</div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <Text type="secondary">2 hours ago:</Text> Role "Project Manager" created by John Doe
          </Text>
          <Text>
            <Text type="secondary">5 hours ago:</Text> User "jane.smith@example.com" assigned to "Workspace Admin"
          </Text>
          <Text>
            <Text type="secondary">1 day ago:</Text> Permission "workspace.settings.manage" updated
          </Text>
          <Text>
            <Text type="secondary">2 days ago:</Text> Role "Member" permissions modified
          </Text>
        </Space>
      </Card>
    </Space>
  );

  const SettingsTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="RBAC Settings"
        description="Configure global settings for role-based access control."
        type="info"
        showIcon
      />

      <Card title="Permission Inheritance">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <strong>Inheritance Order:</strong> System → Tenant → Workspace → Resource
          </Text>
          <Text type="secondary">
            Users inherit permissions from higher-level scopes automatically.
          </Text>
        </Space>
      </Card>

      <Card title="Role Templates">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Role templates provide predefined permission sets for common use cases.
          </Text>
          <Button type="primary">Manage Templates</Button>
        </Space>
      </Card>

      <Card title="Audit Configuration">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Enable audit logging for all permission and role changes.
          </Text>
          <Button type="primary">Configure Auditing</Button>
        </Space>
      </Card>
    </Space>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ background: '#fff', minHeight: '100%' }}>
          {/* Header */}
          <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <SecurityScanOutlined style={{ fontSize: 24 }} />
                  <Title level={2} style={{ margin: 0 }}>
                    RBAC Dashboard
                  </Title>
                </Space>
              </Col>
              <Col>
                <PermissionGuard permission="rbac.admin">
                  <Dropdown overlay={actionMenu} trigger={['click']}>
                    <Button>
                      Actions <DownOutlined />
                    </Button>
                  </Dropdown>
                </PermissionGuard>
              </Col>
            </Row>
          </div>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ padding: '0 24px' }}
            tabBarStyle={{ marginBottom: 0 }}
          >
            <TabPane
              tab={
                <Space>
                  <EyeOutlined />
                  Overview
                </Space>
              }
              key="overview"
            >
              <div style={{ padding: '24px 0' }}>
                <OverviewTab />
              </div>
            </TabPane>

            <TabPane
              tab={
                <PermissionGuard permission="role.read" fallback={null}>
                  <Space>
                    <SecurityScanOutlined />
                    Roles
                  </Space>
                </PermissionGuard>
              }
              key="roles"
            >
              <div style={{ padding: '24px 0' }}>
                <PermissionGuard
                  permission="role.read"
                  fallback={
                    <Alert
                      message="Access Denied"
                      description="You don't have permission to view roles."
                      type="warning"
                      showIcon
                    />
                  }
                >
                  <RoleManagement
                    tenantId={currentTenant?.id}
                    workspaceId={currentWorkspace?.id}
                  />
                </PermissionGuard>
              </div>
            </TabPane>

            <TabPane
              tab={
                <PermissionGuard permission="role.assign" fallback={null}>
                  <Space>
                    <TeamOutlined />
                    User Assignments
                  </Space>
                </PermissionGuard>
              }
              key="users"
            >
              <div style={{ padding: '24px 0' }}>
                <PermissionGuard
                  permission="role.assign"
                  fallback={
                    <Alert
                      message="Access Denied"
                      description="You don't have permission to manage user role assignments."
                      type="warning"
                      showIcon
                    />
                  }
                >
                  <UserRoleAssignment
                    tenantId={currentTenant?.id}
                    workspaceId={currentWorkspace?.id}
                  />
                </PermissionGuard>
              </div>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <EyeOutlined />
                  Permissions
                </Space>
              }
              key="permissions"
            >
              <div style={{ padding: '24px 0' }}>
                <PermissionViewer
                  context={{
                    tenantId: currentTenant?.id,
                    workspaceId: currentWorkspace?.id,
                  }}
                />
              </div>
            </TabPane>

            <TabPane
              tab={
                <PermissionGuard permission="rbac.admin" fallback={null}>
                  <Space>
                    <SettingOutlined />
                    Settings
                  </Space>
                </PermissionGuard>
              }
              key="settings"
            >
              <div style={{ padding: '24px 0' }}>
                <PermissionGuard
                  permission="rbac.admin"
                  fallback={
                    <Alert
                      message="Access Denied"
                      description="You don't have permission to access RBAC settings."
                      type="warning"
                      showIcon
                    />
                  }
                >
                  <SettingsTab />
                </PermissionGuard>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
};

export default RBACDashboard;