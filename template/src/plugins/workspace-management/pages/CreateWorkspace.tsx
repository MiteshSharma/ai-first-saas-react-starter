/**
 * @fileoverview Create Workspace Page
 *
 * Full-screen standalone page for creating new workspaces
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
  ProjectOutlined
} from '@ant-design/icons';
import { useCoreContext } from '../../../core/context/CoreContext';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { CreateWorkspacePayload } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;


/**
 * CreateWorkspace Component
 */
export const CreateWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { state: { currentTenant } } = useCoreContext();
  const { createWorkspace, switchWorkspace } = useWorkspaceStore();

  // Redirect to tenant creation if no tenant is selected
  React.useEffect(() => {
    if (!currentTenant) {
      message.info('Please create or select a tenant first');
      navigate('/tenants/create');
    }
  }, [currentTenant, navigate]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: { name: string; description?: string }) => {
    if (!currentTenant) {
      message.error('No tenant selected');
      return;
    }

    setLoading(true);
    try {
      // Create the workspace with default type
      const payload: CreateWorkspacePayload = {
        name: values.name,
        type: 'project', // Default type
        description: values.description
      };
      const workspace = await createWorkspace(currentTenant.id, payload);

      // Switch to the new workspace
      await switchWorkspace(workspace.id);

      message.success('Workspace created successfully!');

      // Navigate to workspace dashboard
      navigate('/dashboard');
    } catch (error) {
      message.error('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * Validate workspace name
   */
  const validateWorkspaceName = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Please enter workspace name');
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
                icon={<ProjectOutlined />}
              />
              <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                Create a new workspace
              </Title>
              <Paragraph style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 16 }}>
                Set up a workspace to organize your work
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

            {/* Workspace Name */}
            <Form.Item
              name="name"
              label={
                <Text strong style={{ fontSize: 16 }}>
                  Workspace Name
                </Text>
              }
              rules={[{ validator: validateWorkspaceName }]}
            >
              <Input
                placeholder="Enter workspace name"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            {/* Description */}
            <Form.Item
              name="description"
              label={
                <Text strong style={{ fontSize: 16 }}>
                  Description <Text type="secondary">(Optional)</Text>
                </Text>
              }
            >
              <TextArea
                rows={3}
                placeholder="Brief description of the workspace purpose"
                maxLength={200}
                showCount
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
                {loading ? 'Creating Workspace...' : 'Create Workspace'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default CreateWorkspace;