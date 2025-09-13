/**
 * @fileoverview Workspace switcher component for multi-workspace navigation
 * 
 * This component provides:
 * - Current workspace display
 * - Workspace selection dropdown
 * - Quick workspace creation
 * - Workspace status indicators
 * - Proper loading and error states
 */

import React, { useState, useEffect } from 'react';
import { 
  Select, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  Form, 
  Input, 
  Badge, 
  Avatar,
  Tooltip,
  Divider
} from 'antd';
import { 
  SwapOutlined, 
  PlusOutlined, 
  SettingOutlined, 
  TeamOutlined,
  CheckCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useTenantStore } from '../store/tenant/tenantStore';
import type { Workspace, CreateWorkspacePayload } from '../store/tenant/types';

const { Text } = Typography;

interface WorkspaceSwitcherProps {
  showCreateButton?: boolean;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  showCreateButton = true,
  size = 'middle',
  style
}) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const {
    currentWorkspace,
    workspaces,
    currentTenant,
    loading,
    error,
    setCurrentWorkspace,
    createWorkspace,
    fetchWorkspaces
  } = useTenantStore();

  // Fetch workspaces when tenant changes
  useEffect(() => {
    if (currentTenant) {
      fetchWorkspaces(currentTenant.id);
    }
  }, [currentTenant, fetchWorkspaces]);

  // Handle workspace change
  const handleWorkspaceChange = (workspaceId: string) => {
    const selectedWorkspace = workspaces.find(w => w.id === workspaceId);
    if (selectedWorkspace) {
      setCurrentWorkspace(selectedWorkspace);
    }
  };

  // Handle create workspace
  const handleCreateWorkspace = async (values: CreateWorkspacePayload) => {
    if (!currentTenant) return;

    try {
      const newWorkspace = await createWorkspace(currentTenant.id, values);
      setCurrentWorkspace(newWorkspace);
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  // Get workspace status badge
  const getStatusBadge = (workspace: Workspace) => {
    switch (workspace.status) {
      case 'active':
        return <Badge status="success" />;
      case 'archived':
        return <Badge status="default" />;
      default:
        return <Badge status="processing" />;
    }
  };

  // Get workspace icon
  const getWorkspaceIcon = (workspace: Workspace) => {
    if (workspace.status === 'archived') {
      return <InboxOutlined style={{ color: '#999' }} />;
    }
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  // Render workspace option
  const renderWorkspaceOption = (workspace: Workspace) => (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space>
        {getWorkspaceIcon(workspace)}
        <div>
          <div style={{ fontWeight: 500 }}>{workspace.name}</div>
          {workspace.description && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              {workspace.description}
            </div>
          )}
        </div>
      </Space>
      {getStatusBadge(workspace)}
    </Space>
  );

  // If no tenant is selected
  if (!currentTenant) {
    return (
      <Text type="secondary" style={style}>
        No tenant selected
      </Text>
    );
  }

  // If no workspaces available
  if (workspaces.length === 0) {
    return (
      <div style={style}>
        <Space>
          <Text type="secondary">No workspaces</Text>
          {showCreateButton && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              loading={loading}
            >
              Create Workspace
            </Button>
          )}
        </Space>
      </div>
    );
  }

  return (
    <div style={style}>
      <Space.Compact>
        <Select
          value={currentWorkspace?.id}
          onChange={handleWorkspaceChange}
          loading={loading}
          size={size}
          style={{ minWidth: 200 }}
          placeholder="Select workspace"
          optionLabelProp="label"
          dropdownRender={(menu) => (
            <div>
              {menu}
              {showCreateButton && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ padding: '8px' }}>
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                      style={{ width: '100%' }}
                    >
                      Create New Workspace
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        >
          {workspaces.map(workspace => (
            <Select.Option 
              key={workspace.id} 
              value={workspace.id}
              label={
                <Space>
                  {getWorkspaceIcon(workspace)}
                  <span>{workspace.name}</span>
                </Space>
              }
            >
              {renderWorkspaceOption(workspace)}
            </Select.Option>
          ))}
        </Select>

        {currentWorkspace && (
          <Tooltip title="Workspace Settings">
            <Button
              icon={<SettingOutlined />}
              size={size}
              disabled={currentWorkspace.status === 'archived'}
            />
          </Tooltip>
        )}
      </Space.Compact>

      {/* Current Workspace Info */}
      {currentWorkspace && (
        <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#666' }}>
          <Space split={<span>•</span>}>
            <span>{currentWorkspace.status.toUpperCase()}</span>
            <Space>
              <TeamOutlined />
              <span>Members</span>
            </Space>
          </Space>
        </div>
      )}

      {/* Create Workspace Modal */}
      <Modal
        title="Create New Workspace"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateWorkspace}
        >
          <Form.Item
            name="name"
            label="Workspace Name"
            rules={[
              { required: true, message: 'Please enter a workspace name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 50, message: 'Name must be less than 50 characters' }
            ]}
          >
            <Input 
              placeholder="Enter workspace name" 
              maxLength={50}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { max: 200, message: 'Description must be less than 200 characters' }
            ]}
          >
            <Input.TextArea 
              rows={3}
              placeholder="Enter workspace description (optional)"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="slug"
            label="URL Slug"
            extra="This will be used in the workspace URL. Leave empty to auto-generate."
            rules={[
              { 
                pattern: /^[a-z0-9-]+$/,
                message: 'Slug can only contain lowercase letters, numbers, and hyphens'
              },
              { min: 2, message: 'Slug must be at least 2 characters' },
              { max: 30, message: 'Slug must be less than 30 characters' }
            ]}
          >
            <Input 
              placeholder="workspace-slug" 
              maxLength={30}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Workspace
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkspaceSwitcher;