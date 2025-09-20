/**
 * @fileoverview User Settings Page
 *
 * Comprehensive user account and security settings management interface
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Tabs,
  Row,
  Col,
  Avatar,
  Space,
  Collapse,
  Alert,
  Badge,
  Tag,
  Table,
  message,
  Modal,
  Upload,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  EditOutlined,
  LogoutOutlined,
  CameraOutlined,
  SettingOutlined,
  TeamOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useUserManagementStore } from '../stores/userManagementStore';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { confirm } = Modal;

interface WorkspaceRole {
  resource: string;
  role: string;
  permissions: string[];
}

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  roles: WorkspaceRole[];
}

const UserSettingsPage: React.FC = () => {
  const [passwordForm] = Form.useForm();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const {
    currentUser,
    securitySettings,
    updateProfile,
    updateSecuritySettings,
    enableTwoFactor,
    uploadAvatar,
    isUpdatingProfile,
    isUpdatingSecuritySettings,
    isUploadingAvatar
  } = useUserManagementStore();

  useEffect(() => {
    if (currentUser?.profile?.displayName) {
      setEditedName(currentUser.profile.displayName);
    }
    if (currentUser?.profile?.avatar) {
      setAvatarUrl(currentUser.profile.avatar);
    }
  }, [currentUser]);

  // Mock data for workspaces and roles
  const mockWorkspaces = [
    {
      id: '1',
      name: 'Production Workspace',
      emoji: '🚀',
      roles: [
        { resource: 'Billing', role: 'Admin', permissions: ['read', 'write', 'update', 'delete'] }
      ]
    },
    {
      id: '2',
      name: 'Staging Workspace',
      emoji: '🧪',
      roles: [
        { resource: 'Deployments', role: 'Editor', permissions: ['read', 'write', 'update'] },
        { resource: 'Analytics', role: 'Viewer', permissions: ['read'] }
      ]
    }
  ];

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== currentUser?.profile?.displayName) {
      try {
        await updateProfile({ displayName: editedName });
        message.success('Display name updated successfully');
      } catch (error) {
        message.error('Failed to update display name');
      }
    }
    setIsEditingName(false);
  };

  const handlePasswordChange = async (values: any) => {
    try {
      await updateSecuritySettings({
        password: values.newPassword
      });
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to update password');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const result = await enableTwoFactor();
      // Show QR code and backup codes in modal
      Modal.success({
        title: 'Two-Factor Authentication Enabled',
        content: (
          <div>
            <Alert
              message="Scan this QR code with your authenticator app"
              type="info"
              style={{ marginBottom: 16 }}
            />
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {/* QR Code would be displayed here */}
              <div style={{
                width: 200,
                height: 200,
                background: '#f0f0f0',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                QR Code
              </div>
            </div>
            <Alert
              message="Save these backup codes"
              description="Keep these codes in a safe place. You can use them to access your account if you lose your device."
              type="warning"
            />
            <div style={{ marginTop: 16 }}>
              <Text code>{result.backupCodes?.join(', ')}</Text>
            </div>
          </div>
        ),
        width: 500
      });
    } catch (error) {
      message.error('Failed to enable two-factor authentication');
    }
  };

  const roleColumns: ColumnsType<WorkspaceRole> = [
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource) => (
        <Space>
          <SettingOutlined />
          <Text strong>{resource}</Text>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const color = role === 'Admin' ? 'red' : role === 'Editor' ? 'blue' : 'default';
        return <Tag color={color}>{role}</Tag>;
      }
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map(perm => (
            <Tag key={perm} color="processing">
              {perm}
            </Tag>
          ))}
        </Space>
      )
    }
  ];

  const mockUser = currentUser || {
    id: '1',
    email: 'user@example.com',
    profile: {
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null
    },
    tenantRole: 'Member'
  };

  const mockTenant = {
    name: 'Tenant 1',
    role: 'Member'
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Section */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center" size="large">
              <Avatar
                size={80}
                src={avatarUrl}
                icon={!avatarUrl && <UserOutlined />}
              >
                {!avatarUrl && mockUser.profile.firstName?.[0]}
              </Avatar>
              <div>
                <Space align="baseline">
                  {isEditingName ? (
                    <Space>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onPressEnter={handleNameSave}
                        style={{ width: 200 }}
                        autoFocus
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={handleNameSave}
                        loading={isUpdatingProfile}
                      />
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setEditedName(mockUser.profile.displayName || '');
                          setIsEditingName(false);
                        }}
                      />
                    </Space>
                  ) : (
                    <>
                      <Title level={3} style={{ margin: 0 }}>
                        {mockUser.profile.displayName}
                      </Title>
                      <Tooltip title="Edit display name">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => setIsEditingName(true)}
                        />
                      </Tooltip>
                    </>
                  )}
                </Space>
                <div>
                  <Text type="secondary">{mockUser.email}</Text>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabs Section */}
      <Card>
        <Tabs defaultActiveKey="account" size="large">
          <TabPane
            tab={
              <span>
                <LockOutlined />
                Account Security
              </span>
            }
            key="account"
          >
            <Collapse
              defaultActiveKey={['security']}
              expandIconPosition="end"
              style={{ background: 'transparent' }}
            >
              <Panel
                header={
                  <Space>
                    <SafetyOutlined />
                    <Text strong>Security Settings</Text>
                  </Space>
                }
                key="security"
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Change Password Section */}
                  <Card>
                    <Space
                      align="center"
                      style={{ width: '100%', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => setShowChangePassword(!showChangePassword)}
                    >
                      <Space>
                        <LockOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                        <div>
                          <Text strong>Change Password</Text>
                          <br />
                          <Text type="secondary">Update your account password</Text>
                        </div>
                      </Space>
                      <Button
                        type="text"
                        icon={showChangePassword ? <UpOutlined /> : <DownOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowChangePassword(!showChangePassword);
                        }}
                      />
                    </Space>

                    {showChangePassword && (
                      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                        <Form
                          form={passwordForm}
                          layout="vertical"
                          onFinish={handlePasswordChange}
                        >
                          <Row gutter={16}>
                            <Col xs={24} md={8}>
                              <Form.Item
                                label="Current Password"
                                name="currentPassword"
                                rules={[{ required: true, message: 'Please input your current password' }]}
                              >
                                <Input.Password
                                  prefix={<LockOutlined />}
                                  placeholder="Enter current password"
                                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                              <Form.Item
                                label="New Password"
                                name="newPassword"
                                rules={[
                                  { required: true, message: 'Please input your new password' },
                                  { min: 8, message: 'Password must be at least 8 characters' }
                                ]}
                              >
                                <Input.Password
                                  prefix={<LockOutlined />}
                                  placeholder="Enter new password"
                                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                              <Form.Item
                                label="Confirm New Password"
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                rules={[
                                  { required: true, message: 'Please confirm your password' },
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                      }
                                      return Promise.reject(new Error('Passwords do not match'));
                                    },
                                  }),
                                ]}
                              >
                                <Input.Password
                                  prefix={<LockOutlined />}
                                  placeholder="Confirm new password"
                                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Space>
                            <Button type="primary" htmlType="submit" loading={isUpdatingSecuritySettings}>
                              Update Password
                            </Button>
                            <Button onClick={() => passwordForm.resetFields()}>
                              Reset
                            </Button>
                          </Space>

                          <div style={{ marginTop: 16 }}>
                            <a href="/auth/forgot-password">Forgot password?</a>
                          </div>
                        </Form>
                      </div>
                    )}
                  </Card>

                  {/* Two-Factor Authentication Section */}
                  <Card>
                    <Space
                      align="center"
                      style={{ width: '100%', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => setShowTwoFactor(!showTwoFactor)}
                    >
                      <Space>
                        <SafetyOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                        <div>
                          <Text strong>Two-Factor Authentication</Text>
                          <br />
                          <Space>
                            <Text type="secondary">Enhanced account security</Text>
                            {securitySettings?.twoFactorEnabled ? (
                              <Badge status="success" text="Enabled" />
                            ) : (
                              <Badge status="default" text="Disabled" />
                            )}
                          </Space>
                        </div>
                      </Space>
                      <Button
                        type="text"
                        icon={showTwoFactor ? <UpOutlined /> : <DownOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTwoFactor(!showTwoFactor);
                        }}
                      />
                    </Space>

                    {showTwoFactor && (
                      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                          <Alert
                            message="Enhanced Security"
                            description="Add an additional layer of security to your account during login by requiring more than just a password."
                            type="info"
                            showIcon
                          />

                          <Row gutter={16} align="middle">
                            <Col xs={24} md={12}>
                              <Space>
                                <SafetyOutlined style={{ fontSize: 24 }} />
                                <div>
                                  <Text strong>2FA Status</Text>
                                  <br />
                                  {securitySettings?.twoFactorEnabled ? (
                                    <Badge status="success" text="Two-factor authentication is enabled" />
                                  ) : (
                                    <Badge status="default" text="Two-factor authentication is disabled" />
                                  )}
                                </div>
                              </Space>
                            </Col>
                            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                              {!securitySettings?.twoFactorEnabled ? (
                                <Button type="primary" onClick={handleEnable2FA} size="large">
                                  Enable 2FA
                                </Button>
                              ) : (
                                <Button danger onClick={() => {/* Handle disable 2FA */}}>
                                  Disable 2FA
                                </Button>
                              )}
                            </Col>
                          </Row>

                          {securitySettings?.twoFactorEnabled && (
                            <Alert
                              message="Two-factor authentication is active"
                              description="Your account is protected with an additional security layer."
                              type="success"
                              showIcon
                            />
                          )}
                        </Space>
                      </div>
                    )}
                  </Card>
                </Space>
              </Panel>
            </Collapse>
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Access Policy
              </span>
            }
            key="access"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Organization Access */}
              <div>
                <Title level={4}>
                  <GlobalOutlined /> Organization Access Role
                </Title>
                <Paragraph type="secondary">
                  This role defines the permissions granted to you in the workspaces of your organization.
                </Paragraph>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Card>
                      <Text type="secondary">Tenant Name</Text>
                      <Title level={5} style={{ margin: '8px 0 0 0' }}>
                        {mockTenant.name}
                      </Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card>
                      <Text type="secondary">Tenant Role</Text>
                      <div style={{ marginTop: 8 }}>
                        <Space>
                          <Title level={5} style={{ margin: 0 }}>
                            {mockTenant.role}
                          </Title>
                          <Tag color="blue">Limited Access</Tag>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Workspace Permissions */}
              <div>
                <Title level={4}>
                  <SettingOutlined /> Workspace Roles and Permissions
                </Title>
                <Paragraph type="secondary">
                  Your organization role determines your permissions in workspaces.
                  Each workspace has its own specific roles and permissions.
                </Paragraph>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {mockWorkspaces.map(workspace => (
                    <Card key={workspace.id} title={
                      <Space>
                        <span style={{ fontSize: '20px' }}>{workspace.emoji}</span>
                        <Title level={5} style={{ margin: 0 }}>{workspace.name}</Title>
                      </Space>
                    }>
                      <Table
                        columns={roleColumns}
                        dataSource={workspace.roles}
                        rowKey="resource"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  ))}
                </Space>
              </div>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default UserSettingsPage;