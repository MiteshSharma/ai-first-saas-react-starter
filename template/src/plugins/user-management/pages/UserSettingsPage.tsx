/**
 * @fileoverview User Settings Page
 *
 * Comprehensive user account and security settings management interface
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Tag,
  message,
  Tooltip,
  Alert
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  EditOutlined,
  SettingOutlined,
  TeamOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  FolderOutlined,
  EyeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useUserManagementStore, useUserManagementData } from '../stores/userManagementStore';
import { useAuthStore } from '../../../core/auth/AuthStore';
import { analytics } from '../../../analytics';
import type { WorkspacePermission } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;


const UserSettingsPage: React.FC = () => {
  const [passwordForm] = Form.useForm();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspacePermission[]>([]);

  const {
    updateProfile,
    updateSecuritySettings
  } = useUserManagementStore();

  const {
    currentUser,
    userPermissions,
    isUpdatingProfile,
    isUpdatingSecuritySettings
  } = useUserManagementData();

  const { isAdminSession, user: authUser } = useAuthStore();

  // Use currentUser from store, or fall back to authUser if currentUser is not loaded yet
  const displayUser = useMemo(() => {
    return currentUser || (authUser ? {
      id: authUser.id,
      email: authUser.email,
      profile: {
        displayName: authUser.profile?.displayName ||
                     `${authUser.profile?.firstName || ''} ${authUser.profile?.lastName || ''}`.trim() ||
                     'User',
        firstName: authUser.profile?.firstName || '',
        lastName: authUser.profile?.lastName || '',
        avatar: authUser.profile?.avatar || null
      },
      tenantRole: 'Member'
    } : null);
  }, [currentUser, authUser]);

  // Only initialize editedName when component mounts or when user data actually changes
  useEffect(() => {
    if (displayUser?.profile?.displayName && !isEditingName) {
      setEditedName(displayUser.profile.displayName);
    }
  }, [displayUser?.profile?.displayName, isEditingName]);

  useEffect(() => {
    if (displayUser?.profile?.avatar) {
      setAvatarUrl(displayUser.profile.avatar);
    }
  }, [displayUser?.profile?.avatar]);

  useEffect(() => {
    if (userPermissions?.workspaces) {
      setWorkspaces(userPermissions.workspaces);
    }
  }, [userPermissions]);

  const handleNameSave = async () => {
    analytics.track('button_click', { button_name: 'Save Name' });

    if (!editedName.trim()) {
      message.error('Display name cannot be empty');
      return;
    }

    if (editedName.trim() !== displayUser?.profile?.displayName) {
      try {
        await updateProfile({ displayName: editedName.trim() });
        message.success('Display name updated successfully');
      } catch (error) {
        message.error('Failed to update display name');
      }
    }
    setIsEditingName(false);
  };

  const handlePasswordChange = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    analytics.track('button_click', { button_name: 'Update Password' });

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

  const handleCancelEditName = () => {
    analytics.track('button_click', { button_name: 'Cancel Edit Name' });
    setEditedName(displayUser?.profile?.displayName || '');
    setIsEditingName(false);
  };

  const handleEditName = () => {
    analytics.track('button_click', { button_name: 'Edit Name' });
    setEditedName(displayUser?.profile?.displayName || '');
    setIsEditingName(true);
  };

  const handleTogglePasswordForm = () => {
    analytics.track('button_click', { button_name: showChangePassword ? 'Hide Password Form' : 'Show Password Form' });
    setShowChangePassword(!showChangePassword);
  };

  const handleResetPasswordForm = () => {
    analytics.track('button_click', { button_name: 'Reset Password Form' });
    passwordForm.resetFields();
  };

  // Early return if no user data available
  if (!displayUser) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">Loading user data...</Text>
      </div>
    );
  }

  // Get tenant information from user permissions
  const tenantInfo = {
    name: userPermissions?.tenantName || 'No tenant assigned',
    role: userPermissions?.tenantRole || 'Member'
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Admin Session Alert */}
      {isAdminSession && (
        <Alert
          message="Internal Support View"
          description={
            <div>
              <Space direction="vertical" size={4}>
                <Text>
                  You are viewing this user's settings in read-only mode as an internal support user.
                </Text>
                <Space>
                  <Text type="secondary">Support User:</Text>
                  <Tag color="orange" icon={<EyeOutlined />}>
                    {authUser?.profile?.displayName || authUser?.email}
                  </Tag>
                </Space>
                <Space>
                  <Text type="secondary">Access Level:</Text>
                  <Tag color="red" icon={<WarningOutlined />}>
                    Read-Only Access
                  </Tag>
                </Space>
              </Space>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

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
                {!avatarUrl && displayUser.profile?.firstName?.[0]}
              </Avatar>
              <div>
                <Space align="baseline">
                  {isEditingName ? (
                    <div>
                      <Space>
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onPressEnter={handleNameSave}
                          style={{
                            width: 200,
                            borderColor: !editedName.trim() ? '#ff4d4f' : undefined
                          }}
                          status={!editedName.trim() ? 'error' : undefined}
                          autoFocus
                          placeholder="Enter display name"
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={handleNameSave}
                          loading={isUpdatingProfile}
                          disabled={!editedName.trim()}
                        />
                        <Button
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={handleCancelEditName}
                        />
                      </Space>
                      {!editedName.trim() && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                          Display name cannot be empty
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Title level={3} style={{ margin: 0 }}>
                        {displayUser.profile?.displayName || 'No name set'}
                      </Title>
                      {!isAdminSession && (
                        <Tooltip title="Edit display name">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={handleEditName}
                          />
                        </Tooltip>
                      )}
                    </>
                  )}
                </Space>
                <div>
                  <Text type="secondary">{displayUser.email}</Text>
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
                  {/* Change Password Section - Hide for admin users */}
                  {!isAdminSession && (
                    <Card>
                      <Space
                        align="center"
                        style={{ width: '100%', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={handleTogglePasswordForm}
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
                          handleTogglePasswordForm();
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
                            <Button onClick={handleResetPasswordForm}>
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
                  )}

                  {/* Admin Access Message */}
                  {isAdminSession && (
                    <Card>
                      <Alert
                        message="Password Management Unavailable"
                        description="Password changes are not available in admin view mode for security reasons. Normal users can change their passwords through this interface."
                        type="info"
                        showIcon
                        icon={<LockOutlined />}
                      />
                    </Card>
                  )}

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
              {/* Tenant Access */}
              <div>
                <Title level={4}>
                  <GlobalOutlined /> Tenant Access Role
                </Title>
                <Paragraph type="secondary">
                  This role defines the permissions granted to you in the workspaces of your tenant.
                </Paragraph>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Card>
                      <Text type="secondary">Tenant Name</Text>
                      <Title level={5} style={{ margin: '8px 0 0 0' }}>
                        {tenantInfo.name}
                      </Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card>
                      <Text type="secondary">Tenant Role</Text>
                      <div style={{ marginTop: 8 }}>
                        <Space>
                          <Title level={5} style={{ margin: 0 }}>
                            {tenantInfo.role}
                          </Title>
                          <Tag color={tenantInfo.role === 'admin' ? 'red' : tenantInfo.role === 'owner' ? 'purple' : 'blue'}>
                            {tenantInfo.role === 'admin' ? 'Full Access' : tenantInfo.role === 'owner' ? 'Owner Access' : 'Limited Access'}
                          </Tag>
                          {isAdminSession && (
                            <Tag color="orange" icon={<EyeOutlined />}>
                              Admin View
                            </Tag>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Workspace Permissions */}
              <div>
                <Title level={4}>
                  <SettingOutlined /> Workspace Roles
                </Title>
                <Paragraph type="secondary">
                  Your tenant role determines your base permissions, while each workspace may have specific roles assigned to you.
                </Paragraph>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {workspaces.length > 0 ? (
                    workspaces.map((workspace: WorkspacePermission) => (
                      <Card key={workspace.workspaceId} title={
                        <Space>
                          <FolderOutlined style={{ color: '#1677ff' }} />
                          <Title level={5} style={{ margin: 0 }}>{workspace.workspaceName}</Title>
                        </Space>
                      }>
                        <Space direction="vertical" style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">
                            <Col>
                              <Text type="secondary">Workspace ID:</Text>
                            </Col>
                            <Col>
                              <Text code style={{ fontSize: '12px' }}>{workspace.workspaceId}</Text>
                            </Col>
                          </Row>
                          <Row justify="space-between" align="middle">
                            <Col>
                              <Text type="secondary">Workspace Role:</Text>
                            </Col>
                            <Col>
                              <Tag color={workspace.role === 'admin' ? 'red' : 'blue'} style={{ textTransform: 'capitalize' }}>
                                {workspace.role}
                              </Tag>
                            </Col>
                          </Row>
                        </Space>
                      </Card>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text type="secondary">No workspace access assigned</Text>
                    </div>
                  )}
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