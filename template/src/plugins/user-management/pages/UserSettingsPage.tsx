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

  const {
    updateProfile
  } = useUserManagementStore();

  const {
    currentUser,
    userPermissions,
    isUpdatingProfile
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
      // Import the change password API from core
      const { postChangePassword } = await import('../../../core/api/backendHelper');

      await postChangePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      message.success('Password updated successfully');
      passwordForm.resetFields();
      setShowChangePassword(false);
    } catch (error) {
      message.error('Failed to update password. Please check your current password and try again.');
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

  // Early return if no user data available
  if (!displayUser) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">Loading user data...</Text>
      </div>
    );
  }


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

                          <Form.Item style={{ marginTop: 24 }}>
                            <Button
                              type="primary"
                              htmlType="submit"
                              size="large"
                              style={{ marginRight: 8 }}
                            >
                              Update Password
                            </Button>
                            <Button
                              onClick={() => {
                                setShowChangePassword(false);
                                passwordForm.resetFields();
                              }}
                              size="large"
                            >
                              Cancel
                            </Button>
                          </Form.Item>
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
        </Tabs>
      </Card>
    </div>
  );
};

export default UserSettingsPage;