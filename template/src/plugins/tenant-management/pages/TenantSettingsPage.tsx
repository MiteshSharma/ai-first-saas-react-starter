/**
 * @fileoverview Tenant Settings Page
 *
 * Comprehensive tenant management interface for settings and members
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Tabs,
  Space,
  message,
  Tooltip,
  Row,
  Col,
  Avatar,
  Table,
  Tag,
  Badge,
  Dropdown,
  Modal,
  Form,
  Select,
  Statistic,
  Checkbox,
  Divider
} from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  UserOutlined,
  TeamOutlined,
  PlusOutlined,
  MoreOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  MailOutlined,
  SearchOutlined,
  FilterOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useTenantStore } from '../stores/tenantStore';
import { useAuthStore } from '../../../core/auth/AuthStore';
import { analytics } from '../../../analytics';
import { TenantMember, WorkspaceMembership } from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;

// Using TenantMember from types which extends TenantUser with UI fields

interface InviteMemberForm {
  emails: string[];
  role: 'admin' | 'member';
}

interface WorkspacePermission {
  workspaceId: string;
  role: 'admin' | 'member';
}

interface WorkspacePermissionsForm {
  memberEmail: string;
  tenantRole: 'admin' | 'member';
  workspaces: WorkspacePermission[];
}

/**
 * Workspace Permissions Modal Component
 */
interface WorkspacePermissionsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: WorkspacePermissionsForm) => void;
  member: TenantMember | null;
  allWorkspaces: WorkspaceMembership[];
  form: FormInstance;
}

const WorkspacePermissionsModal: React.FC<WorkspacePermissionsModalProps> = ({
  visible,
  onCancel,
  onSave,
  member,
  allWorkspaces,
  form
}) => {
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Update selected workspaces when member changes
  useEffect(() => {
    if (member) {
      const workspaceIds = member.workspaces.map(ws => ws.workspaceId);
      setSelectedWorkspaceIds(workspaceIds);
      setSelectAll(workspaceIds.length === allWorkspaces.length);
    }
  }, [member, allWorkspaces]);

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedWorkspaceIds(allWorkspaces.map(ws => ws.workspaceId));
      // Set all workspaces with default 'member' role
      const allWorkspacePermissions = allWorkspaces.map(ws => ({
        workspaceId: ws.workspaceId,
        role: 'member' as const
      }));
      form.setFieldValue('workspaces', allWorkspacePermissions);
    } else {
      setSelectedWorkspaceIds([]);
      form.setFieldValue('workspaces', []);
    }
  };

  const handleWorkspaceSelect = (workspaceId: string, checked: boolean) => {
    let newSelectedIds: string[];
    if (checked) {
      newSelectedIds = [...selectedWorkspaceIds, workspaceId];
      // Add to form with default 'member' role
      const currentWorkspaces = form.getFieldValue('workspaces') || [];
      const newWorkspace = { workspaceId, role: 'member' as const };
      form.setFieldValue('workspaces', [...currentWorkspaces, newWorkspace]);
    } else {
      newSelectedIds = selectedWorkspaceIds.filter(id => id !== workspaceId);
      // Remove from form
      const currentWorkspaces = form.getFieldValue('workspaces') || [];
      form.setFieldValue('workspaces', currentWorkspaces.filter((ws: WorkspacePermission) => ws.workspaceId !== workspaceId));
    }

    setSelectedWorkspaceIds(newSelectedIds);
    setSelectAll(newSelectedIds.length === allWorkspaces.length);
  };

  const handleRoleChange = (workspaceId: string, role: 'admin' | 'member') => {
    const currentWorkspaces = form.getFieldValue('workspaces') || [];
    const updatedWorkspaces = currentWorkspaces.map((ws: WorkspacePermission) =>
      ws.workspaceId === workspaceId ? { ...ws, role } : ws
    );
    form.setFieldValue('workspaces', updatedWorkspaces);
  };

  const getCurrentRole = (workspaceId: string): 'admin' | 'member' => {
    const currentWorkspaces = form.getFieldValue('workspaces') || [];
    const workspace = currentWorkspaces.find((ws: WorkspacePermission) => ws.workspaceId === workspaceId);
    return workspace?.role || 'member';
  };

  const handleChangeTenantRole = () => {
    analytics.track('button_click', { button_name: 'Change Tenant Role' });
    // TODO: Implement role change functionality
  };

  const handleCancelPermissions = () => {
    analytics.track('button_click', { button_name: 'Cancel Permissions' });
    onCancel();
  };

  const handleSaveWorkspaces = (values: any) => {
    analytics.track('button_click', { button_name: 'Add Workspaces' });
    onSave(values);
  };

  if (!member) return null;

  return (
    <Modal
      title="Add member to new workspace(s)"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveWorkspaces}
        initialValues={{
          memberEmail: member.email,
          tenantRole: member.tenantRole,
          workspaces: member.workspaces.map(ws => ({
            workspaceId: ws.workspaceId,
            role: ws.role
          }))
        }}
      >
        {/* User Information Section */}
        <div style={{ marginBottom: 24 }}>
          <Space direction="vertical" size={4}>
            <Text strong>{member.email}</Text>
            <Space>
              <Text type="secondary">Tenant role:</Text>
              <Tag color={member.tenantRole === 'admin' ? 'red' : 'blue'} style={{ textTransform: 'capitalize' }}>
                {member.tenantRole}
              </Tag>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={handleChangeTenantRole}>
                Change
              </Button>
            </Space>
          </Space>
        </div>

        <Divider />

        {/* Instructions */}
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Choose the workspace(s) you would like to invite this member to. The tenant role defaults each workspace to read-only.
            You can customize permissions for each within the user's access policy.
          </Text>
        </div>

        {/* Select All Workspaces */}
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={selectAll}
            onChange={(e) => handleSelectAllChange(e.target.checked)}
          >
            <Text strong>Select all workspaces</Text>
          </Checkbox>
        </div>

        {/* Workspace Selection */}
        <div style={{ marginBottom: 24 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {allWorkspaces.map(workspace => {
              const isSelected = selectedWorkspaceIds.includes(workspace.workspaceId);
              const currentRole = getCurrentRole(workspace.workspaceId);

              return (
                <Row key={workspace.workspaceId} align="middle" justify="space-between" style={{ width: '100%' }}>
                  <Col>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleWorkspaceSelect(workspace.workspaceId, e.target.checked)}
                    >
                      <Text strong>{workspace.workspaceName}</Text>
                    </Checkbox>
                  </Col>
                  {isSelected && (
                    <Col>
                      <Space>
                        <Text type="secondary">Role:</Text>
                        <Select
                          value={currentRole}
                          onChange={(role) => handleRoleChange(workspace.workspaceId, role)}
                          style={{ width: 100 }}
                          size="small"
                        >
                          <Option value="member">Member</Option>
                          <Option value="admin">Admin</Option>
                        </Select>
                      </Space>
                    </Col>
                  )}
                </Row>
              );
            })}
          </Space>
        </div>

        {/* Form Fields (Hidden) */}
        <Form.Item name="memberEmail" style={{ display: 'none' }}>
          <Input />
        </Form.Item>

        <Form.Item name="tenantRole" style={{ display: 'none' }}>
          <Input />
        </Form.Item>

        <Form.Item name="workspaces" style={{ display: 'none' }}>
          <Input />
        </Form.Item>

        {/* Footer Actions */}
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancelPermissions}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={selectedWorkspaceIds.length === 0}
            >
              Add workspace(s)
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

/**
 * Tenant Settings Page Component
 */
export const TenantSettingsPage: React.FC = () => {
  const {
    currentTenant,
    tenantUsers,
    updateTenant,
    loading,
    loadTenantUsers,
    inviteUser,
    removeUser,
    updateMemberWorkspacePermissions
  } = useTenantStore();

  // Permission checks - using admin mode detection instead
  const { isAdminSession } = useAuthStore();
  const canUpdateTenant = !isAdminSession; // Admin users cannot update
  const canInviteMembers = !isAdminSession; // Admin users cannot invite
  const canRemoveMembers = !isAdminSession; // Admin users cannot remove
  const canManagePermissions = !isAdminSession; // Admin users cannot manage permissions

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TenantMember | null>(null);
  const [inviteForm] = Form.useForm();
  const [permissionsForm] = Form.useForm();

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterWorkspace, setFilterWorkspace] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (currentTenant?.name) {
      setEditedName(currentTenant.name);
    }
  }, [currentTenant]);

  // Load tenant users when tenant changes
  useEffect(() => {
    if (currentTenant?.id) {
      loadTenantUsers(currentTenant.id);
    }
  }, [currentTenant?.id, loadTenantUsers]);

  /**
   * Handle tenant name save
   */
  const handleNameSave = async () => {
    analytics.track('button_click', { button_name: 'Save Tenant Name' });

    if (!currentTenant) {
      message.error('No tenant selected');
      setIsEditingName(false);
      setEditedName('');
      return;
    }

    if (!editedName.trim()) {
      message.error('Tenant name cannot be empty');
      return;
    }

    if (editedName === currentTenant.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateTenant(currentTenant.id, { name: editedName.trim() });
      message.success('Tenant name updated successfully');
      setIsEditingName(false);
    } catch (error) {
      message.error('Failed to update tenant name');
      setEditedName(currentTenant.name);
      setIsEditingName(false);
    }
  };

  /**
   * Handle copy tenant ID to clipboard
   */
  const handleCancelEditName = () => {
    analytics.track('button_click', { button_name: 'Cancel Edit Tenant Name' });
    setEditedName(currentTenant?.name || '');
    setIsEditingName(false);
  };

  const handleEditName = () => {
    analytics.track('button_click', { button_name: 'Edit Tenant Name' });
    setIsEditingName(true);
  };

  const handleCopyTenantId = async () => {
    analytics.track('button_click', { button_name: 'Copy Tenant ID' });

    if (!currentTenant?.id) return;

    try {
      await navigator.clipboard.writeText(currentTenant.id);
      message.success('Tenant ID copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = currentTenant.id;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          message.success('Tenant ID copied to clipboard');
        } else {
          message.error('Failed to copy tenant ID');
        }
      } catch (fallbackError) {
        message.error('Failed to copy tenant ID');
      }
    }
  };

  /**
   * Handle remove member
   */
  const handleRemoveMember = (member: TenantMember) => {
    if (!currentTenant?.id) {
      message.error('No tenant selected');
      return;
    }

    confirm({
      title: 'Remove member?',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to remove ${member.name || member.email} from this tenant? This action cannot be undone.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          await removeUser(currentTenant.id, member.userId);
          message.success(`${member.name || member.email} has been removed from the tenant`);

          // Reload tenant users to show updated list
          await loadTenantUsers(currentTenant.id);
        } catch (error) {
          message.error('Failed to remove member');
        }
      }
    });
  };

  /**
   * Handle invite members
   */
  const handleShowInviteModal = () => {
    analytics.track('button_click', { button_name: 'Invite Member' });
    setInviteModalVisible(true);
  };

  const handleCancelInviteModal = () => {
    analytics.track('button_click', { button_name: 'Cancel Invite' });
    setInviteModalVisible(false);
  };

  const handleInviteMembers = async (values: InviteMemberForm) => {
    analytics.track('button_click', { button_name: 'Send Invitations' });

    if (!currentTenant?.id) {
      message.error('No tenant selected');
      return;
    }

    try {
      // Send invitations for each email
      const invitePromises = values.emails.map(email =>
        inviteUser(currentTenant.id, email, values.role)
      );

      await Promise.all(invitePromises);
      message.success(`Invitations sent to ${values.emails.length} member(s)`);
      setInviteModalVisible(false);
      inviteForm.resetFields();

      // Reload tenant users to show updated list
      await loadTenantUsers(currentTenant.id);
    } catch (error) {
      message.error('Failed to send invitations');
    }
  };

  /**
   * Handle edit permissions
   */
  const handleEditPermissions = (member: TenantMember) => {
    setSelectedMember(member);
    setPermissionsModalVisible(true);

    // Pre-populate form with current workspace assignments
    const initialValues = {
      memberEmail: member.email,
      tenantRole: member.tenantRole,
      workspaces: member.workspaces.map(ws => ({
        workspaceId: ws.workspaceId,
        role: ws.role
      }))
    };

    permissionsForm.setFieldsValue(initialValues);
  };

  /**
   * Handle save workspace permissions
   */
  const handleSavePermissions = async (values: WorkspacePermissionsForm) => {
    if (!currentTenant?.id || !selectedMember) {
      message.error('No tenant or member selected');
      return;
    }

    try {
      // Call the actual service to update workspace permissions
      await updateMemberWorkspacePermissions(
        currentTenant.id,
        selectedMember.userId,
        values.workspaces || []
      );

      message.success(`Workspace permissions updated for ${selectedMember?.name}`);
      setPermissionsModalVisible(false);
      setSelectedMember(null);
      permissionsForm.resetFields();

      // Reload tenant users to show updated permissions
      await loadTenantUsers(currentTenant.id);
    } catch (error) {
      message.error('Failed to update workspace permissions');
    }
  };

  // Get all unique workspaces from all tenant users for modal
  const allWorkspaces: WorkspaceMembership[] = React.useMemo(() => {
    const workspaceMap = new Map<string, WorkspaceMembership>();

    tenantUsers.forEach(user => {
      user.workspaces.forEach(workspace => {
        if (!workspaceMap.has(workspace.workspaceId)) {
          workspaceMap.set(workspace.workspaceId, workspace);
        }
      });
    });

    return Array.from(workspaceMap.values());
  }, [tenantUsers]);

  // Get current user info
  const currentUser = useAuthStore(state => state.user);

  // Convert TenantUser to TenantMember for UI display
  const members: TenantMember[] = React.useMemo(() => {
    return tenantUsers.map(user => ({
      ...user,
      name: `User ${user.userId}`, // Generate name from userId
      email: `user-${user.userId}@example.com`, // Fallback email
      status: 'active' as const, // Default to active
      avatar: undefined
    }));
  }, [tenantUsers]);

  /**
   * Filter members based on current filter states
   */
  const filteredMembers = members.filter(member => {
    // Filter by name
    if (searchName && !member.name?.toLowerCase().includes(searchName.toLowerCase()) &&
        !member.email?.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }

    // Filter by role
    if (filterRole !== 'all' && member.tenantRole !== filterRole) {
      return false;
    }

    // Filter by workspace
    if (filterWorkspace !== 'all') {
      if (!member.workspaces.some(ws => ws.workspaceId === filterWorkspace)) {
        return false;
      }
    }

    // Filter by status
    if (filterStatus !== 'all' && member.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const adminCount = members.filter(m => m.tenantRole === 'admin').length;
  const memberCount = members.filter(m => m.tenantRole === 'member' && m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    analytics.track('button_click', { button_name: 'Clear Filters' });
    setSearchName('');
    setFilterRole('all');
    setFilterWorkspace('all');
    setFilterStatus('all');
  };

  const memberColumns: ColumnsType<TenantMember> = [
    {
      title: 'Team member',
      dataIndex: 'name',
      key: 'member',
      render: (name, record) => {
        const isCurrentUser = currentUser?.id === record.userId;
        return (
          <Space>
            <Avatar
              src={record.avatar}
              icon={<UserOutlined />}
              style={{
                border: isCurrentUser ? '2px solid #1677ff' : undefined
              }}
            >
              {!record.avatar && (name?.[0] || record.email?.[0] || 'U')}
            </Avatar>
            <div>
              <div>
                <Text strong>{name || record.email}</Text>
                {record.tenantRole === 'admin' && (
                  <CrownOutlined style={{ marginLeft: 8, color: '#faad14' }} />
                )}
                {isCurrentUser && (
                  <Tag color="blue" style={{ marginLeft: 8, fontSize: '12px' }}>
                    You
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.email}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Tenant role',
      dataIndex: 'tenantRole',
      key: 'tenantRole',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'} style={{ textTransform: 'capitalize' }}>
          {role}
        </Tag>
      )
    },
    {
      title: 'Workspace permissions',
      dataIndex: 'workspaces',
      key: 'workspaces',
      render: (workspaces: WorkspaceMembership[]) => (
        <Space wrap>
          {workspaces.length > 0 ? (
            workspaces.map(workspace => (
              <Tag
                key={workspace.workspaceId}
                color={workspace.role === 'admin' ? 'red' : 'blue'}
                style={{ margin: '2px' }}
              >
                {workspace.workspaceName} - {workspace.role}
              </Tag>
            ))
          ) : (
            <Text type="secondary">None</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default';
        return <Badge status={color} text={status} />;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const menuItems = [];

        if (canManagePermissions) {
          menuItems.push({
            key: 'edit-permissions',
            label: 'Edit permissions',
            icon: <SafetyOutlined />,
            onClick: () => handleEditPermissions(record)
          });
        }

        if (canRemoveMembers) {
          menuItems.push({
            key: 'remove',
            label: 'Remove member',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleRemoveMember(record)
          });
        }

        // If no permissions, don't show the actions column at all
        if (menuItems.length === 0) {
          return null;
        }

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      }
    }
  ];

  if (!currentTenant) {
    return (
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <Text type="secondary">No tenant selected</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Tenant Settings
        </Title>
      </div>

      {/* Tabs Section */}
      <Card>
        <Tabs defaultActiveKey="general" size="large">
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                General
              </span>
            }
            key="general"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Tenant Profile Card */}
              <Card
                title={
                  <Space>
                    <UserOutlined />
                    <Text strong>Tenant profile</Text>
                  </Space>
                }
                style={{ border: '1px solid #d9d9d9' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Tenant Name */}
                  <Row align="middle" justify="space-between">
                    <Col>
                      <Text type="secondary">Tenant name</Text>
                    </Col>
                    <Col>
                      {isEditingName ? (
                        <div>
                          <Space>
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onPressEnter={handleNameSave}
                              style={{
                                width: 200,
                                borderColor: !editedName.trim() ? '#ff4d4f' : undefined
                              }}
                              status={!editedName.trim() ? 'error' : undefined}
                              autoFocus
                              placeholder="Enter tenant name"
                            />
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={handleNameSave}
                              loading={loading}
                              disabled={!editedName.trim()}
                            />
                            <Button
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={handleCancelEditName}
                            />
                          </Space>
                          {!editedName.trim() && (
                            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginLeft: '0' }}>
                              Tenant name cannot be empty
                            </div>
                          )}
                        </div>
                      ) : (
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>
                            {currentTenant?.name}
                          </Text>
                          {canUpdateTenant && (
                            <Tooltip title="Edit tenant name">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={handleEditName}
                              />
                            </Tooltip>
                          )}
                        </Space>
                      )}
                    </Col>
                  </Row>

                  {/* Tenant ID */}
                  <Row align="middle" justify="space-between">
                    <Col>
                      <Text type="secondary">Tenant ID</Text>
                    </Col>
                    <Col>
                      <Space>
                        <Text code style={{ fontSize: '14px' }}>
                          {currentTenant?.id}
                        </Text>
                        <Tooltip title="Copy tenant ID">
                          <Button
                            type="text"
                            icon={<CopyOutlined />}
                            size="small"
                            onClick={handleCopyTenantId}
                          />
                        </Tooltip>
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Space>
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Members
              </span>
            }
            key="members"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>

              {/* Member Summary Cards */}
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Admin members"
                      value={adminCount}
                      prefix={<CrownOutlined style={{ color: '#faad14' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Regular members"
                      value={memberCount}
                      prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Inactive members"
                      value={inactiveCount}
                      prefix={<MailOutlined style={{ color: '#faad14' }} />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Filter Controls */}
              <Card
                title={
                  <Space>
                    <FilterOutlined />
                    <span>Filter Members</span>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={6}>
                    <Input
                      placeholder="Search by name or email"
                      prefix={<SearchOutlined />}
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Filter by role"
                      value={filterRole}
                      onChange={setFilterRole}
                    >
                      <Option value="all">All roles</Option>
                      <Option value="admin">Admin</Option>
                      <Option value="member">Member</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Filter by workspace"
                      value={filterWorkspace}
                      onChange={setFilterWorkspace}
                    >
                      <Option value="all">All workspaces</Option>
                      {allWorkspaces.map(workspace => (
                        <Option key={workspace.workspaceId} value={workspace.workspaceId}>
                          {workspace.workspaceName}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Space>
                      <Select
                        style={{ width: 120 }}
                        placeholder="Status"
                        value={filterStatus}
                        onChange={setFilterStatus}
                      >
                        <Option value="all">All status</Option>
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                        <Option value="suspended">Suspended</Option>
                      </Select>
                      <Button onClick={handleResetFilters}>
                        Clear
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* Members Table */}
              <Card
                title={
                  <Space>
                    <span>Team members</span>
                    <Badge
                      count={filteredMembers.length}
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  </Space>
                }
                extra={
                  canInviteMembers && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleShowInviteModal}
                    >
                      Invite member
                    </Button>
                  )
                }
              >
                <Table
                  columns={memberColumns}
                  dataSource={filteredMembers}
                  rowKey="id"
                  pagination={false}
                  locale={{
                    emptyText: filteredMembers.length === 0 && (searchName || filterRole !== 'all' || filterWorkspace !== 'all' || filterStatus !== 'all')
                      ? 'No members match the current filters'
                      : 'No members found'
                  }}
                />
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        title="Invite new members"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteMembers}
        >
          <Form.Item
            label="Email addresses"
            name="emails"
            rules={[{ required: true, message: 'Please enter at least one email address' }]}
          >
            <Select
              mode="tags"
              placeholder="Enter email addresses and press Enter"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            initialValue="member"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Option value="member">Member</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancelInviteModal}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Send invitations
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Workspace Permissions Modal */}
      <WorkspacePermissionsModal
        visible={permissionsModalVisible}
        onCancel={() => {
          setPermissionsModalVisible(false);
          setSelectedMember(null);
          permissionsForm.resetFields();
        }}
        onSave={handleSavePermissions}
        member={selectedMember}
        allWorkspaces={allWorkspaces}
        form={permissionsForm}
      />
    </div>
  );
};

export default TenantSettingsPage;