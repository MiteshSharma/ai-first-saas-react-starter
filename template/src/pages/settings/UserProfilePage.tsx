/**
 * @fileoverview User Profile Settings Page
 *
 * Allows users to manage their personal profile and preferences
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Space,
  Typography,
  Select,
  Switch,
  Divider,
  Row,
  Col,
  message
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SaveOutlined,
  SecurityScanOutlined,
  BellOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

export const UserProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();

  // Mock user data
  const [userProfile] = useState<UserProfile>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    language: 'en',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorEnabled: false
  });

  const handleSubmit = async (values: UserProfile) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Profile updated successfully!');
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG files!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must smaller than 2MB!');
        return false;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);

      return false; // Prevent auto upload
    },
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <UserOutlined style={{ marginRight: 8 }} />
          User Profile
        </Title>
        <Text type="secondary">
          Manage your personal information and preferences
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={userProfile}
        onFinish={handleSubmit}
      >
        {/* Profile Picture */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar
              size={120}
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <div>
              <Upload {...uploadProps}>
                <Button icon={<CameraOutlined />}>
                  Change Avatar
                </Button>
              </Upload>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card title="Personal Information" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please enter your first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please enter your last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email address" disabled />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
        </Card>

        {/* Preferences */}
        <Card title={<><GlobalOutlined style={{ marginRight: 8 }} />Preferences</>} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Timezone" name="timezone">
                <Select placeholder="Select timezone">
                  <Option value="America/New_York">Eastern Time</Option>
                  <Option value="America/Chicago">Central Time</Option>
                  <Option value="America/Denver">Mountain Time</Option>
                  <Option value="America/Los_Angeles">Pacific Time</Option>
                  <Option value="UTC">UTC</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Language" name="language">
                <Select placeholder="Select language">
                  <Option value="en">English</Option>
                  <Option value="es">Spanish</Option>
                  <Option value="fr">French</Option>
                  <Option value="de">German</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Theme" name="theme">
            <Select placeholder="Select theme">
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
              <Option value="auto">Auto</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* Notifications */}
        <Card title={<><BellOutlined style={{ marginRight: 8 }} />Notifications</>} style={{ marginBottom: 24 }}>
          <Form.Item
            label="Email Notifications"
            name="emailNotifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Receive notifications via email for important updates
          </Text>

          <Form.Item
            label="Push Notifications"
            name="pushNotifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ display: 'block' }}>
            Receive push notifications in your browser
          </Text>
        </Card>

        {/* Security */}
        <Card title={<><SecurityScanOutlined style={{ marginRight: 8 }} />Security</>} style={{ marginBottom: 24 }}>
          <Form.Item
            label="Two-Factor Authentication"
            name="twoFactorEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Add an extra layer of security to your account
          </Text>

          <Divider />

          <Space>
            <Button type="link" style={{ padding: 0 }}>
              Change Password
            </Button>
            <Button type="link" style={{ padding: 0 }}>
              Download Security Report
            </Button>
          </Space>
        </Card>

        {/* Submit Button */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Save Changes
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserProfilePage;