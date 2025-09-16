import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/AuthStore';
import type { PasswordResetRequestData } from '../../core/auth/types';

const { Title, Text } = Typography;

export const PasswordResetRequestPage: React.FC = () => {
  const [form] = Form.useForm();
  const [emailSent, setEmailSent] = useState(false);
  const { requestPasswordReset, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (values: PasswordResetRequestData) => {
    try {
      clearError();
      await requestPasswordReset(values);
      setEmailSent(true);
    } catch (error) {
      // Error is already handled by the store
    }
  };

  if (emailSent) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <MailOutlined style={{ fontSize: '3rem', color: '#52c41a', marginBottom: '1rem' }} />
            <Title level={3}>Check Your Email</Title>
            <Text>
              We've sent you a password reset link. Please check your inbox and click the link to reset your password.
            </Text>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/auth/login">
                <Button type="link">Back to Login</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Reset Your Password
        </Title>
        
        <Text style={{ display: 'block', textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        {error && (
          <Alert
            message="Error"
            description={error?.message}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email address"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Send Reset Link
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/auth/login">
              <Button type="link">Back to Login</Button>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PasswordResetRequestPage;