import React from 'react';
import { Form, Input, Button, Typography, Alert, Card, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/AuthStore';
import type { LoginCredentials } from '../../core/auth/types';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (values: LoginCredentials) => {
    try {
      clearError();
      await login(values);
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (error) {
      // Error is already handled by the store
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Welcome Back
        </Title>

        {error && (
          <Alert
            message="Login Failed"
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
              prefix={<UserOutlined />}
              placeholder="Enter your email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
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
              Sign In
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/auth/password-reset-request">
              <Button type="link">Forgot your password?</Button>
            </Link>
          </div>

          <Divider>Or</Divider>

          <div style={{ textAlign: 'center' }}>
            <Text>Don't have an account? </Text>
            <Link to="/auth/register">
              <Button type="link" style={{ padding: 0 }}>Sign up here</Button>
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Text>Sign up with email? </Text>
            <Link to="/auth/signup-with-email">
              <Button type="link" style={{ padding: 0 }}>Get signup link</Button>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;