import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/AuthStore';
import type { SignupCompleteData } from '../../core/auth/types';

const { Title } = Typography;

export const SignupCompletePage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeSignup, loading, error, clearError } = useAuthStore();
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      navigate('/auth/signup');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, navigate]);

  const handleSubmit = async (values: Omit<SignupCompleteData, 'token'>) => {
    if (!token) return;
    
    try {
      clearError();
      await completeSignup({ ...values, token });
      // Navigate to dashboard or home page after successful signup
      navigate('/');
    } catch (error) {
      // Error is already handled by the store
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
        <Alert
          message="Invalid Link"
          description="This signup link is invalid or expired. Please request a new one."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Complete Your Registration
        </Title>
        
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
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: 'Please enter your full name' },
              { min: 2, message: 'Name must be at least 2 characters long' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters long' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Create a password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="tenantName"
            label="Organization Name (Optional)"
            help="You can create an organization for your team"
          >
            <Input
              prefix={<TeamOutlined />}
              placeholder="Enter your organization name"
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
              Complete Registration
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SignupCompletePage;