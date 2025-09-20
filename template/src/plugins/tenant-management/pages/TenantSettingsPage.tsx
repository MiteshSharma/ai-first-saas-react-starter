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
  Statistic
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
  FilterOutlined
} from '@ant-design/icons';
import { useTenantStore } from '../stores/tenantStore';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;

interface TenantMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  workspaces: { id: string; name: string; }[];
  joinedAt: string;
  avatar?: string;
}

interface InviteMemberForm {
  emails: string[];
  role: 'admin' | 'member';
}

/**
 * Tenant Settings Page Component
 */
export const TenantSettingsPage: React.FC = () => {
  const { currentTenant, updateTenant, loading } = useTenantStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();

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

  /**
   * Handle tenant name save
   */
  const handleNameSave = async () => {
    if (!currentTenant || !editedName.trim()) {
      setIsEditingName(false);
      setEditedName(currentTenant?.name || '');
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
  const handleCopyTenantId = async () => {
    if (!currentTenant?.id) return;

    try {
      await navigator.clipboard.writeText(currentTenant.id);
      message.success('Tenant ID copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentTenant.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('Tenant ID copied to clipboard');
    }
  };

  /**
   * Handle remove member
   */
  const handleRemoveMember = (member: TenantMember) => {
    confirm({
      title: 'Remove member?',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to remove ${member.name} from this tenant? This action cannot be undone.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        // Handle remove member logic
        message.success(`${member.name} has been removed from the tenant`);
      }
    });
  };

  /**
   * Handle invite members
   */
  const handleInviteMembers = async (values: InviteMemberForm) => {
    try {
      // Handle invite logic
      message.success(`Invitations sent to ${values.emails.length} member(s)`);
      setInviteModalVisible(false);
      inviteForm.resetFields();
    } catch (error) {
      message.error('Failed to send invitations');
    }
  };

  // Mock data
  const mockTenant = currentTenant || {
    id: 'tenant_2ecd2f32dewd3e32',
    name: 'Acme Corporation',
    slug: 'acme-corp'
  };

  // All available workspaces
  const allWorkspaces = [
    { id: '1', name: 'Production' },
    { id: '2', name: 'Staging' },
    { id: '3', name: 'Development' },
    { id: '4', name: 'Marketing' },
    { id: '5', name: 'Analytics' }
  ];

  const mockMembers: TenantMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@acme.com',
      role: 'admin',
      status: 'active',
      workspaces: allWorkspaces, // Admin has access to all workspaces
      joinedAt: '2023-01-15',
      avatar: undefined
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@acme.com',
      role: 'member',
      status: 'active',
      workspaces: [
        { id: '1', name: 'Production' },
        { id: '2', name: 'Staging' },
        { id: '3', name: 'Development' }
      ],
      joinedAt: '2023-02-20',
      avatar: undefined
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@acme.com',
      role: 'member',
      status: 'pending',
      workspaces: [],
      joinedAt: '2023-03-10',
      avatar: undefined
    }
  ];

  /**
   * Filter members based on current filter states
   */
  const filteredMembers = mockMembers.filter(member => {
    // Filter by name
    if (searchName && !member.name.toLowerCase().includes(searchName.toLowerCase()) &&
        !member.email.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }

    // Filter by role
    if (filterRole !== 'all' && member.role !== filterRole) {
      return false;
    }

    // Filter by workspace
    if (filterWorkspace !== 'all') {
      if (!member.workspaces.some(ws => ws.id === filterWorkspace)) {
        return false;
      }
    }

    // Filter by status
    if (filterStatus !== 'all' && member.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const adminCount = mockMembers.filter(m => m.role === 'admin').length;
  const memberCount = mockMembers.filter(m => m.role === 'member' && m.status === 'active').length;
  const pendingCount = mockMembers.filter(m => m.status === 'pending').length;

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
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
      render: (name, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />}>
            {!record.avatar && name[0]}
          </Avatar>
          <div>
            <div>
              <Text strong>{name}</Text>
              {record.role === 'admin' && (
                <CrownOutlined style={{ marginLeft: 8, color: '#faad14' }} />
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Tenant role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'} style={{ textTransform: 'capitalize' }}>
          {role}
        </Tag>
      )
    },
    {
      title: 'Workspaces assigned',
      dataIndex: 'workspaces',
      key: 'workspaces',
      render: (workspaces: { id: string; name: string; }[]) => (
        <Space wrap>
          {workspaces.length > 0 ? (
            workspaces.map(workspace => (
              <Tag key={workspace.id} color="processing">
                {workspace.name}
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
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'remove',
                label: 'Remove member',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleRemoveMember(record)
              }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
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
                        <Space>
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onPressEnter={handleNameSave}
                            style={{ width: 200 }}
                            autoFocus
                          />
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={handleNameSave}
                            loading={loading}
                          />
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => {
                              setEditedName(mockTenant.name || '');
                              setIsEditingName(false);
                            }}
                          />
                        </Space>
                      ) : (
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>
                            {mockTenant.name}
                          </Text>
                          <Tooltip title="Edit tenant name">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => setIsEditingName(true)}
                            />
                          </Tooltip>
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
                          {mockTenant.id}
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
                      title="Pending invites"
                      value={pendingCount}
                      prefix={<MailOutlined style={{ color: '#faad14' }} />}
                      suffix={<Text type="secondary" style={{ fontSize: '12px' }}>/ 5 available</Text>}
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
                        <Option key={workspace.id} value={workspace.id}>
                          {workspace.name}
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
                        <Option value="pending">Pending</Option>
                        <Option value="inactive">Inactive</Option>
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
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setInviteModalVisible(true)}
                  >
                    Invite member
                  </Button>
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
              <Button onClick={() => setInviteModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Send invitations
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantSettingsPage;