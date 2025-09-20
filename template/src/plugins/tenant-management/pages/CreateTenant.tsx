/**
 * @fileoverview Create Tenant Page
 *
 * Full-screen page for creating a new tenant
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Card,
  Typography,
  Space,
  message,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTenantStore } from '../stores/tenantStore';
import { tenantService } from '../services/tenantService';

const { Title, Text, Paragraph } = Typography;

/**
 * Full-screen create tenant page
 */
export const CreateTenant: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { switchTenant } = useTenantStore();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (values: { name: string }) => {
    setLoading(true);
    try {
      // Create the tenant
      const newTenant = await tenantService.createTenant({
        name: values.name,
        slug: values.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      });

      // Switch to the new tenant
      await switchTenant(newTenant.id);

      message.success('Tenant created successfully!');

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error?.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const validateTenantName = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Please enter tenant name');
    }
    if (value.length < 2) {
      return Promise.reject('Name must be at least 2 characters');
    }
    if (value.length > 50) {
      return Promise.reject('Name cannot exceed 50 characters');
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
      return Promise.reject('Only letters, numbers, spaces, hyphens, and underscores are allowed');
    }
    return Promise.resolve();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 600,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          borderRadius: 16,
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          padding: '32px 32px 24px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ alignSelf: 'flex-start', marginLeft: -8 }}
            >
              Back
            </Button>

            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={80}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  marginBottom: 16
                }}
                icon={<TeamOutlined />}
              />
              <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                Create a new tenant
              </Title>
              <Paragraph style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 16 }}>
                Set up a tenant to organize your organization
              </Paragraph>
            </div>
          </Space>
        </div>

        {/* Form */}
        <div style={{ padding: '32px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            requiredMark={false}
          >
            {/* Tenant Name */}
            <Form.Item
              name="name"
              label={
                <Text strong style={{ fontSize: 16 }}>
                  Tenant Name
                </Text>
              }
              rules={[{ validator: validateTenantName }]}
            >
              <Input
                placeholder="Enter tenant name"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            {/* Submit Button */}
            <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                {loading ? 'Creating Tenant...' : 'Create Tenant'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default CreateTenant;