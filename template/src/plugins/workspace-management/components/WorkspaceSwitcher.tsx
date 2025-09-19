/**
 * @fileoverview Workspace Switcher Component
 *
 * Dropdown component for switching between workspaces
 */

import React, { useState, useEffect } from 'react';
import {
  Select,
  Button,
  Space,
  Tag,
  Badge,
  Divider,
  Typography,
  Tooltip,
  Modal,
  Form,
  Input,
  message
} from 'antd';
import {
  PlusOutlined,
  FolderOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useCoreContext } from '../../../core/context/CoreContext';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { CreateWorkspacePayload, WorkspaceType } from '../types';

const { Option, OptGroup } = Select;
const { Text } = Typography;
const { TextArea } = Input;

/**
 * Icon mapping for workspace types
 */
const WORKSPACE_TYPE_ICONS = {
  project: <ProjectOutlined />,
  department: <TeamOutlined />,
  team: <UserOutlined />,
  client: <FolderOutlined />
};

/**
 * Color mapping for workspace types
 */
const WORKSPACE_TYPE_COLORS = {
  project: 'blue',
  department: 'green',
  team: 'orange',
  client: 'purple'
};

/**
 * Props for WorkspaceSwitcher component
 */
interface WorkspaceSwitcherProps {
  style?: React.CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  showCreateButton?: boolean;
  onWorkspaceChange?: (workspaceId: string) => void;
}

/**
 * WorkspaceSwitcher Component
 */
export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  style,
  placeholder = "Select workspace",
  disabled = false,
  showCreateButton = true,
  onWorkspaceChange
}) => {
  const { state: { currentTenant, currentWorkspace } } = useCoreContext();
  const {
    workspaces,
    loading,
    error,
    loadWorkspaces,
    switchWorkspace,
    createWorkspace,
    clearError
  } = useWorkspaceStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Load workspaces when tenant changes
  useEffect(() => {
    if (currentTenant) {
      loadWorkspaces(currentTenant.id);
    }
  }, [currentTenant, loadWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      console.log(currentWorkspace);
    }
  }, [currentWorkspace]);


  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  /**
   * Handle workspace switch
   */
  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      onWorkspaceChange?.(workspaceId);
      message.success('Workspace switched successfully');
    } catch (error) {
      message.error('Failed to switch workspace');
    }
  };

  /**
   * Handle workspace creation
   */
  const handleCreateWorkspace = async (values: CreateWorkspacePayload) => {
    if (!currentTenant) {
      message.error('No tenant selected');
      return;
    }

    try {
      const workspace = await createWorkspace(currentTenant.id, values);
      setCreateModalVisible(false);
      form.resetFields();
      message.success('Workspace created successfully');

      // Switch to the new workspace
      await switchWorkspace(workspace.id);
    } catch (error) {
      message.error('Failed to create workspace');
    }
  };

  /**
   * Group workspaces by type
   */
  const groupedWorkspaces = workspaces.reduce((groups, workspace) => {
    const type = workspace.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(workspace);
    return groups;
  }, {} as Record<WorkspaceType, typeof workspaces>);

  /**
   * Render workspace option
   */
  const renderWorkspaceOption = (workspace: typeof workspaces[0]) => {
    const isArchived = workspace.status === 'archived';
    const memberCount = workspace.memberCount || 0;

    return (
      <Option key={workspace.id} value={workspace.id} disabled={isArchived}>
        <Space>
          <Text style={{ opacity: isArchived ? 0.5 : 1 }}>
            {workspace.name}
          </Text>
          {memberCount > 1 && (
            <Badge count={memberCount} size="small" />
          )}
        </Space>
      </Option>
    );
  };

  if (!currentTenant) {
    return (
      <Select
        placeholder="No tenant selected"
        disabled
        style={style}
      />
    );
  }

  return (
    <>
      <Space.Compact style={style}>
        <Select
          value={currentWorkspace?.id}
          placeholder={placeholder}
          onChange={handleWorkspaceSwitch}
          loading={loading}
          disabled={disabled}
          style={{ minWidth: 200, flex: 1 }}
          dropdownRender={menu => (
            <div>
              {menu}
              {showCreateButton && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '8px 12px' }}>
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      Create New Workspace
                    </Button>
                  </Space>
                </>
              )}
            </div>
          )}
        >
          {Object.entries(groupedWorkspaces).map(([type, workspaceList]) => (
            <OptGroup
              key={type}
              label={
                <Space>
                  {WORKSPACE_TYPE_ICONS[type as WorkspaceType]}
                  <Text style={{ textTransform: 'capitalize' }}>{type}</Text>
                  <Tag
                    color={WORKSPACE_TYPE_COLORS[type as WorkspaceType]}
                  >
                    {workspaceList.length}
                  </Tag>
                </Space>
              }
            >
              {workspaceList.map(renderWorkspaceOption)}
            </OptGroup>
          ))}
        </Select>

        {showCreateButton && (
          <Tooltip title="Create new workspace">
            <Button
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              disabled={disabled}
            />
          </Tooltip>
        )}
      </Space.Compact>

      {/* Create Workspace Modal */}
      <Modal
        title="Create New Workspace"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
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
              { required: true, message: 'Please enter workspace name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 50, message: 'Name cannot exceed 50 characters' }
            ]}
          >
            <Input placeholder="e.g., Project Alpha, Marketing Team" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Workspace Type"
            rules={[{ required: true, message: 'Please select workspace type' }]}
          >
            <Select placeholder="Select workspace type">
              <Option value="project">
                <Space>
                  <ProjectOutlined />
                  Project - For specific projects and initiatives
                </Space>
              </Option>
              <Option value="department">
                <Space>
                  <TeamOutlined />
                  Department - For organizational departments
                </Space>
              </Option>
              <Option value="team">
                <Space>
                  <UserOutlined />
                  Team - For cross-functional teams
                </Space>
              </Option>
              <Option value="client">
                <Space>
                  <FolderOutlined />
                  Client - For client-specific work
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Brief description of the workspace purpose"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Workspace
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Error Display */}
      {error && (
        <Text type="danger" style={{ fontSize: '12px' }}>
          {error}
        </Text>
      )}
    </>
  );
};

export default WorkspaceSwitcher;