/**
 * @fileoverview Workspace Switcher Component
 *
 * Dropdown component for switching between workspaces
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  Button,
  Space,
  Tag,
  Badge,
  Divider,
  Typography,
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
import { WorkspaceType } from '../types';

const { Option, OptGroup } = Select;
const { Text } = Typography;

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
  const navigate = useNavigate();
  const { state: { currentTenant, currentWorkspace } } = useCoreContext();
  const {
    workspaces,
    loading,
    error,
    loadWorkspaces,
    switchWorkspace,
    clearError
  } = useWorkspaceStore();


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
  const handleCreateWorkspace = () => {
    console.log('🎯 Create Workspace button clicked!');
    navigate('/workspaces/create');
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
        style={{ minWidth: 200, ...style }}
      />
    );
  }

  return (
    <>
      <Select
        value={currentWorkspace?.id}
        placeholder={placeholder}
        onChange={handleWorkspaceSwitch}
        loading={loading}
        disabled={disabled}
        style={{ minWidth: 200, ...style }}
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
                    onClick={handleCreateWorkspace}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    Create New Workspacew
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