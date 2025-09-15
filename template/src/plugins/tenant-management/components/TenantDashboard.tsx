/**
 * @fileoverview Tenant Dashboard Component
 *
 * Main dashboard page for tenant management
 */

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Progress,
  Modal,
  Form,
  Input,
  Select,
  message
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useTenantStore } from '../TenantStore';
import { TenantRole } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const TenantDashboard: React.FC = () => {
  const {
    currentTenant,
    tenantUsers,
    loading,
    createTenant,
    inviteUser,
    loadTenantUsers,
    canAccessFeature,
    getCurrentUserRole
  } = useTenantStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [inviteForm] = Form.useForm();

  React.useEffect(() => {
    if (currentTenant) {
      loadTenantUsers(currentTenant.id);
    }
  }, [currentTenant, loadTenantUsers]);

  const handleCreateTenant = async (values: { name: string; slug: string; description?: string }) => {
    try {
      await createTenant({
        name: values.name,
        slug: values.slug,
        description: values.description
      });
      setCreateModalVisible(false);
      form.resetFields();
      message.success('Tenant created successfully');
    } catch (error) {
      message.error('Failed to create tenant');
    }
  };

  const handleInviteUser = async (values: { email: string; role: string }) => {
    if (!currentTenant) return;

    try {
      await inviteUser(currentTenant.id, values.email, values.role as TenantRole);
      setInviteModalVisible(false);
      inviteForm.resetFields();
      message.success('User invited successfully');
    } catch (error) {
      message.error('Failed to invite user');
    }
  };

  if (!currentTenant) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>No Tenant Selected</Title>
        <Text type="secondary">Please select a tenant to view the dashboard</Text>
        <br />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          style={{ marginTop: 16 }}
        >
          Create New Tenant
        </Button>
      </div>
    );
  }

  const userRole = getCurrentUserRole();
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const features = currentTenant.settings.features;
  const usageData = [
    {
      key: 'users',
      label: 'Users',
      current: tenantUsers.length,
      limit: features.userLimit,
      icon: <UserOutlined />,
      unit: 'users'
    },
    {
      key: 'storage',
      label: 'Storage',
      current: 250, // Mock current usage
      limit: features.storageLimit,
      icon: <DatabaseOutlined />,
      unit: 'MB'
    },
    {
      key: 'apiCalls',
      label: 'API Calls',
      current: 1250, // Mock current usage
      limit: features.apiCallsLimit,
      icon: <ApiOutlined />,
      unit: 'calls/month'
    }
  ];

  const userColumns = [
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => (
        <Space>
          <UserOutlined />
          <Text>User {userId}</Text>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: TenantRole) => {
        const colors = {
          owner: 'gold',
          admin: 'blue',
          member: 'green',
          guest: 'default'
        };
        const icons = {
          owner: <CrownOutlined />,
          admin: <SettingOutlined />,
          member: <UserOutlined />,
          guest: <UserOutlined />
        };
        return (
          <Tag color={colors[role]} icon={icons[role]}>
            {role.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{currentTenant.name}</Title>
        <Text type="secondary">{currentTenant.description}</Text>
        <div style={{ marginTop: 8 }}>
          <Tag color="blue">{currentTenant.subscription.plan}</Tag>
          <Tag color={currentTenant.subscription.status === 'active' ? 'green' : 'red'}>
            {currentTenant.subscription.status}
          </Tag>
        </div>
      </div>

      {/* Usage Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {usageData.map((item) => {
          const percentage = Math.round((item.current / item.limit) * 100);
          const isNearLimit = percentage > 80;

          return (
            <Col xs={24} sm={8} key={item.key}>
              <Card>
                <Statistic
                  title={
                    <Space>
                      {item.icon}
                      {item.label}
                    </Space>
                  }
                  value={item.current}
                  suffix={`/ ${item.limit} ${item.unit}`}
                />
                <Progress
                  percent={percentage}
                  status={isNearLimit ? 'exception' : 'normal'}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Feature Availability */}
      <Card title="Available Features" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text>
                <Tag color={canAccessFeature('customBranding') ? 'green' : 'default'}>
                  Custom Branding
                </Tag>
              </Text>
              <Text>
                <Tag color={canAccessFeature('ssoEnabled') ? 'green' : 'default'}>
                  Single Sign-On
                </Tag>
              </Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text>
                <Tag color={canAccessFeature('auditLogs') ? 'green' : 'default'}>
                  Audit Logs
                </Tag>
              </Text>
              <Text>
                <Tag color="blue">
                  {currentTenant.subscription.billingCycle} Billing
                </Tag>
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Team Management */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            Team Members
          </Space>
        }
        extra={
          isOwnerOrAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setInviteModalVisible(true)}
            >
              Invite User
            </Button>
          )
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={userColumns}
          dataSource={tenantUsers}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create New Tenant
          </Button>
          <Button icon={<SettingOutlined />}>
            Tenant Settings
          </Button>
          <Button icon={<DatabaseOutlined />}>
            Usage Reports
          </Button>
        </Space>
      </Card>

      {/* Create Tenant Modal */}
      <Modal
        title="Create New Tenant"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTenant}
        >
          <Form.Item
            name="name"
            label="Tenant Name"
            rules={[{ required: true, message: 'Please enter tenant name' }]}
          >
            <Input placeholder="e.g., My Company" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Tenant Slug"
            rules={[
              { required: true, message: 'Please enter tenant slug' },
              { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens allowed' }
            ]}
          >
            <Input placeholder="e.g., my-company" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={3}
              placeholder="Brief description of the tenant"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Tenant
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        title="Invite User"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteUser}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter valid email address' }
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role">
              <Option value="member">Member</Option>
              <Option value="admin">Admin</Option>
              {userRole === 'owner' && <Option value="owner">Owner</Option>}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setInviteModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Send Invitation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantDashboard;