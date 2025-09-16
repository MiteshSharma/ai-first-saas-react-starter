import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../core/auth/AuthStore';
import type { SignupWithEmailData } from '../../core/auth/types';

const { Title, Text } = Typography;

export const SignupWithEmailPage: React.FC = () => {
  const [form] = Form.useForm();
  const [emailSent, setEmailSent] = useState(false);
  const { signupWithEmail, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (values: SignupWithEmailData) => {
    try {
      clearError();
      await signupWithEmail(values);
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
              We've sent you a signup link. Please check your inbox and click the link to complete your registration.
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Sign Up
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
              Send Signup Link
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SignupWithEmailPage;