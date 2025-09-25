import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { LockOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/AuthStore';
import type { PasswordResetCompleteData } from '../../core/auth/types';

const { Title, Text } = Typography;

export const PasswordResetCompletePage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completePasswordReset, loading, error, clearError } = useAuthStore();
  const [token, setToken] = useState<string>('');
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      navigate('/auth/password-reset');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, navigate]);

  const handleSubmit = async (
    values: Omit<PasswordResetCompleteData, 'token'>
  ) => {
    if (!token) return;

    try {
      clearError();
      await completePasswordReset({ ...values, token });
      setResetComplete(true);
    } catch (error) {
      // Error is already handled by the store
    }
  };

  if (resetComplete) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <CheckOutlined
              style={{
                fontSize: '3rem',
                color: '#52c41a',
                marginBottom: '1rem',
              }}
            />
            <Title level={3}>Password Reset Successful</Title>
            <Text>
              Your password has been successfully reset. You can now log in with
              your new password.
            </Text>
            <div style={{ marginTop: '2rem' }}>
              <Link to='/auth/login'>
                <Button type='primary' size='large'>
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
        <Alert
          message='Invalid Link'
          description='This password reset link is invalid or expired. Please request a new one.'
          type='error'
          showIcon
          action={
            <Link to='/auth/password-reset'>
              <Button type='primary' size='small'>
                Request New Link
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Set New Password
        </Title>

        {error && (
          <Alert
            message='Error'
            description={error?.message}
            type='error'
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          autoComplete='off'
        >
          <Form.Item
            name='password'
            label='New Password'
            rules={[
              { required: true, message: 'Please enter your new password' },
              {
                min: 8,
                message: 'Password must be at least 8 characters long',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Enter your new password'
              size='large'
            />
          </Form.Item>

          <Form.Item
            name='confirmPassword'
            label='Confirm New Password'
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
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
              placeholder='Confirm your new password'
              size='large'
            />
          </Form.Item>

          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              size='large'
              block
              loading={loading}
            >
              Reset Password
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to='/auth/login'>
              <Button type='link'>Back to Login</Button>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PasswordResetCompletePage;
