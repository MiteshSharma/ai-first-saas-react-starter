/**
 * @fileoverview User Settings Page
 *
 * Main page component for user profile settings and password management
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Select,
  Switch,
  Divider,
  Typography,
  Space,
  Alert,
  Modal,
  Tabs,
  List,
  Tag,
  Badge,
  Popconfirm,
  message,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  LockOutlined,
  BellOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  DeleteOutlined,
  LogoutOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useUserSettingsStore } from '../stores/userSettingsStore';
import { TIMEZONES, LANGUAGES, ProfileUpdateRequest, PasswordChangeRequest } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const UserSettingsPage: React.FC = () => {
  const {
    profile,
    security,
    preferences,
    loading,
    saving,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    enableTwoFactor,
    disableTwoFactor,
    terminateSession,
    removeTrustedDevice,
    updateNotificationPreferences,
    clearError,
  } = useUserSettingsStore();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; secret: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      profileForm.setFieldsValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        timezone: profile.timezone,
        language: profile.language,
        theme: profile.theme,
      });
    }
  }, [profile, profileForm]);

  const handleProfileUpdate = async (values: ProfileUpdateRequest) => {
    const success = await updateProfile(values);
    if (success) {
      message.success('Profile updated successfully');
    }
  };

  const handlePasswordChange = async (values: PasswordChangeRequest) => {
    const success = await changePassword(values);
    if (success) {
      message.success('Password changed successfully');
      passwordForm.resetFields();
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const success = await uploadAvatar(file);
    if (success) {
      message.success('Avatar updated successfully');
    }
    return false; // Prevent default upload behavior
  };

  const handleEnableTwoFactor = async () => {
    const result = await enableTwoFactor();
    if (result) {
      setQrCodeData(result);
      setTwoFactorModal(true);
    }
  };

  const handleDisableTwoFactor = async () => {
    const success = await disableTwoFactor();
    if (success) {
      message.success('Two-factor authentication disabled');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    const success = await terminateSession(sessionId);
    if (success) {
      message.success('Session terminated successfully');
    }
  };

  const handleRemoveTrustedDevice = async (deviceId: string) => {
    const success = await removeTrustedDevice(deviceId);
    if (success) {
      message.success('Trusted device removed successfully');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <DesktopOutlined />;
      case 'mobile':
        return <MobileOutlined />;
      case 'tablet':
        return <TabletOutlined />;
      default:
        return <DesktopOutlined />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Title level={4}>Loading user settings...</Typography.Title>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description="Failed to load user profile"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>User Settings</Title>
      <Paragraph type="secondary">
        Manage your account settings and preferences
      </Paragraph>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 24 }}
        />
      )}

      <Tabs defaultActiveKey="profile" size="large">
        {/* Profile Tab */}
        <TabPane tab={<span><UserOutlined />Profile</span>} key="profile">
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card title="Profile Information">
                <Row gutter={24}>
                  {/* Avatar Section */}
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Avatar
                        size={120}
                        src={profile.avatar}
                        icon={<UserOutlined />}
                        style={{ marginBottom: 16 }}
                      />
                      <br />
                      <Upload
                        beforeUpload={handleAvatarUpload}
                        showUploadList={false}
                        accept="image/*"
                      >
                        <Button icon={<CameraOutlined />} loading={saving}>
                          Change Avatar
                        </Button>
                      </Upload>
                    </div>
                  </Col>

                  {/* Profile Form */}
                  <Col span={18}>
                    <Form
                      form={profileForm}
                      layout="vertical"
                      onFinish={handleProfileUpdate}
                      disabled={saving}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="First Name"
                            name="firstName"
                            rules={[
                              { required: true, message: 'Please enter your first name' },
                              { min: 2, message: 'First name must be at least 2 characters' },
                            ]}
                          >
                            <Input placeholder="Enter your first name" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Last Name"
                            name="lastName"
                            rules={[
                              { required: true, message: 'Please enter your last name' },
                              { min: 2, message: 'Last name must be at least 2 characters' },
                            ]}
                          >
                            <Input placeholder="Enter your last name" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Email Address"
                        name="email"
                      >
                        <Input disabled placeholder="Email address" />
                      </Form.Item>

                      <Form.Item
                        label="Phone Number"
                        name="phone"
                      >
                        <Input placeholder="Enter your phone number" />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Timezone"
                            name="timezone"
                          >
                            <Select placeholder="Select your timezone">
                              {TIMEZONES.map(tz => (
                                <Option key={tz.value} value={tz.value}>
                                  {tz.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Language"
                            name="language"
                          >
                            <Select placeholder="Select your language">
                              {LANGUAGES.map(lang => (
                                <Option key={lang.value} value={lang.value}>
                                  {lang.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Theme"
                        name="theme"
                      >
                        <Select placeholder="Select theme preference">
                          <Option value="light">Light</Option>
                          <Option value="dark">Dark</Option>
                          <Option value="auto">Auto (System)</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={saving}>
                          Update Profile
                        </Button>
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Security Tab */}
        <TabPane tab={<span><LockOutlined />Security</span>} key="security">
          <Row gutter={[24, 24]}>
            {/* Password Change */}
            <Col span={24}>
              <Card title="Change Password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                  disabled={saving}
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item
                    label="Current Password"
                    name="currentPassword"
                    rules={[{ required: true, message: 'Please enter your current password' }]}
                  >
                    <Input.Password
                      placeholder="Enter your current password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item
                    label="New Password"
                    name="newPassword"
                    rules={[
                      { required: true, message: 'Please enter your new password' },
                      { min: 8, message: 'Password must be at least 8 characters long' },
                    ]}
                  >
                    <Input.Password
                      placeholder="Enter your new password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Confirm New Password"
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Please confirm your new password' },
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
                      placeholder="Confirm your new password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* Two-Factor Authentication */}
            <Col span={24}>
              <Card title="Two-Factor Authentication">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Two-factor authentication adds an extra layer of security to your account.</Text>
                    <br />
                    <Text type="secondary">
                      When enabled, you'll need to enter a code from your authenticator app when signing in.
                    </Text>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Badge
                        status={security?.twoFactorEnabled ? 'success' : 'default'}
                        text={security?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      />
                    </div>
                    <div>
                      {security?.twoFactorEnabled ? (
                        <Popconfirm
                          title="Disable Two-Factor Authentication"
                          description="Are you sure you want to disable two-factor authentication?"
                          onConfirm={handleDisableTwoFactor}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button danger>Disable</Button>
                        </Popconfirm>
                      ) : (
                        <Button type="primary" onClick={handleEnableTwoFactor} loading={saving}>
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Active Sessions */}
            {security?.activeSessions && (
              <Col span={24}>
                <Card title="Active Sessions">
                  <List
                    itemLayout="horizontal"
                    dataSource={security.activeSessions}
                    renderItem={(session) => (
                      <List.Item
                        actions={[
                          session.current ? (
                            <Tag color="green">Current Session</Tag>
                          ) : (
                            <Popconfirm
                              title="Terminate Session"
                              description="Are you sure you want to terminate this session?"
                              onConfirm={() => handleTerminateSession(session.id)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                size="small"
                                danger
                                icon={<LogoutOutlined />}
                                loading={saving}
                              >
                                Terminate
                              </Button>
                            </Popconfirm>
                          ),
                        ]}
                      >
                        <List.Item.Meta
                          avatar={getDeviceIcon(session.deviceName.toLowerCase().includes('iphone') ? 'mobile' : 'desktop')}
                          title={session.deviceName}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">{session.browser} on {session.os}</Text>
                              <Text type="secondary">{session.location} • {session.ipAddress}</Text>
                              <Text type="secondary">Last active: {session.lastActiveAt.toLocaleString()}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            )}
          </Row>
        </TabPane>

        {/* Notifications Tab */}
        <TabPane tab={<span><BellOutlined />Notifications</span>} key="notifications">
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card title="Notification Preferences">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Title level={5}>Email Notifications</Title>
                    <Space direction="vertical" size="middle">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Security alerts</Text>
                          <br />
                          <Text type="secondary">Get notified about important security events</Text>
                        </div>
                        <Switch
                          checked={preferences?.email.security}
                          onChange={(checked) => updateNotificationPreferences({
                            email: {
                              security: checked,
                              updates: preferences?.email?.updates ?? false,
                              marketing: preferences?.email?.marketing ?? false,
                              digest: preferences?.email?.digest ?? false
                            }
                          })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Product updates</Text>
                          <br />
                          <Text type="secondary">Get notified about new features and updates</Text>
                        </div>
                        <Switch
                          checked={preferences?.email.updates}
                          onChange={(checked) => updateNotificationPreferences({
                            email: {
                              security: preferences?.email?.security ?? false,
                              updates: checked,
                              marketing: preferences?.email?.marketing ?? false,
                              digest: preferences?.email?.digest ?? false
                            }
                          })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Marketing emails</Text>
                          <br />
                          <Text type="secondary">Receive promotional content and newsletters</Text>
                        </div>
                        <Switch
                          checked={preferences?.email.marketing}
                          onChange={(checked) => updateNotificationPreferences({
                            email: {
                              security: preferences?.email?.security ?? false,
                              updates: preferences?.email?.updates ?? false,
                              marketing: checked,
                              digest: preferences?.email?.digest ?? false
                            }
                          })}
                        />
                      </div>
                    </Space>
                  </div>

                  <Divider />

                  <div>
                    <Title level={5}>Push Notifications</Title>
                    <Space direction="vertical" size="middle">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Security alerts</Text>
                          <br />
                          <Text type="secondary">Get push notifications for security events</Text>
                        </div>
                        <Switch
                          checked={preferences?.push.security}
                          onChange={(checked) => updateNotificationPreferences({
                            push: {
                              security: checked,
                              mentions: preferences?.push?.mentions ?? false,
                              updates: preferences?.push?.updates ?? false
                            }
                          })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Mentions</Text>
                          <br />
                          <Text type="secondary">Get notified when someone mentions you</Text>
                        </div>
                        <Switch
                          checked={preferences?.push.mentions}
                          onChange={(checked) => updateNotificationPreferences({
                            push: {
                              security: preferences?.push?.security ?? false,
                              mentions: checked,
                              updates: preferences?.push?.updates ?? false
                            }
                          })}
                        />
                      </div>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Two-Factor Authentication Setup Modal */}
      <Modal
        title="Enable Two-Factor Authentication"
        open={twoFactorModal}
        onCancel={() => setTwoFactorModal(false)}
        footer={[
          <Button key="close" onClick={() => setTwoFactorModal(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {qrCodeData && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={4}>Scan QR Code</Title>
              <Paragraph>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </Paragraph>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img
                src={qrCodeData.qrCode}
                alt="Two-Factor Authentication QR Code"
                style={{ width: 200, height: 200, border: '1px solid #d9d9d9' }}
              />
            </div>

            <div>
              <Title level={5}>Manual Entry</Title>
              <Paragraph>
                If you can't scan the QR code, enter this secret key manually:
              </Paragraph>
              <Input.TextArea
                value={qrCodeData.secret}
                readOnly
                rows={2}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <Alert
              message="Important"
              description="Save your backup codes in a safe place. You can use them to access your account if you lose your authenticator device."
              type="warning"
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default UserSettingsPage;