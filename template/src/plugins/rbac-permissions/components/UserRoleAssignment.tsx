/**
 * @fileoverview User Role Assignment Component
 *
 * Manage user role assignments with bulk operations
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  Tag,
  Tooltip,
  message,
  Avatar,
  Typography,
  Input,
  Alert,
  Checkbox,
  Divider,
  Badge,
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard } from './PermissionGuard';
import { Role, UserRole } from '../types';

const { Text, Title } = Typography;
const { Option } = Select;

interface UserRoleAssignmentProps {
  tenantId?: string;
  workspaceId?: string;
  onAssignmentChange?: (assignments: UserRole[]) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt?: string;
}

interface UserWithRoles extends User {
  roles: Role[];
  assignedAt: string;
  assignedBy: string;
}

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  tenantId,
  workspaceId,
  onAssignmentChange,
}) => {
  const { loading } = usePermissions();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkAssignVisible, setBulkAssignVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockUsers: UserWithRoles[] = [
      {
        id: 'user1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        status: 'active',
        roles: [
          {
            id: 'tenant-owner',
            name: 'Tenant Owner',
            description: 'Full access to tenant resources',
            type: 'tenant',
            level: 'owner',
            permissions: ['tenant.read', 'tenant.update', 'tenant.manage'],
            isSystem: true,
            isDefault: false,
            color: '#1890ff',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        assignedAt: '2024-01-01T00:00:00Z',
        assignedBy: 'system',
        lastLoginAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        status: 'active',
        roles: [
          {
            id: 'workspace-admin',
            name: 'Workspace Admin',
            description: 'Manage workspace settings and users',
            type: 'workspace',
            level: 'admin',
            permissions: ['workspace.read', 'workspace.update'],
            isSystem: false,
            isDefault: false,
            color: '#52c41a',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        assignedAt: '2024-01-02T00:00:00Z',
        assignedBy: 'user1',
        lastLoginAt: '2024-01-16T14:20:00Z',
      },
      {
        id: 'user3',
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        status: 'pending',
        roles: [],
        assignedAt: '2024-01-03T00:00:00Z',
        assignedBy: 'user1',
      },
    ];

    const mockRoles: Role[] = [
      {
        id: 'tenant-owner',
        name: 'Tenant Owner',
        description: 'Full access to tenant resources',
        type: 'tenant',
        level: 'owner',
        permissions: ['tenant.read', 'tenant.update', 'tenant.manage'],
        isSystem: true,
        isDefault: false,
        color: '#1890ff',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'workspace-admin',
        name: 'Workspace Admin',
        description: 'Manage workspace settings and users',
        type: 'workspace',
        level: 'admin',
        permissions: ['workspace.read', 'workspace.update'],
        isSystem: false,
        isDefault: false,
        color: '#52c41a',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'member',
        name: 'Member',
        description: 'Basic workspace access',
        type: 'workspace',
        level: 'member',
        permissions: ['workspace.read', 'dashboard.read'],
        isSystem: false,
        isDefault: true,
        color: '#fadb14',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    setUsers(mockUsers);
    setAvailableRoles(mockRoles);
  }, [tenantId, workspaceId]);

  const handleAssignRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    form.setFieldsValue({
      userId: user.id,
      roleIds: user.roles.map(role => role.id),
    });
    setIsModalVisible(true);
  };

  const handleSaveAssignment = async (values: any) => {
    try {
      if (!selectedUser) return;

      const selectedRoles = availableRoles.filter(role =>
        values.roleIds.includes(role.id)
      );

      setUsers(prev => prev.map(user =>
        user.id === selectedUser.id
          ? {
              ...user,
              roles: selectedRoles,
              assignedAt: new Date().toISOString(),
              assignedBy: 'current-user', // Would be current user ID
            }
          : user
      ));

      message.success('Role assignment updated successfully');
      setIsModalVisible(false);
      // Call onAssignmentChange with proper UserRole format if needed
      // onAssignmentChange?.(updatedUserRoles);
    } catch (error) {
      message.error('Failed to update role assignment');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? {
              ...user,
              roles: user.roles.filter(role => role.id !== roleId),
              assignedAt: new Date().toISOString(),
            }
          : user
      ));
      message.success('Role removed successfully');
    } catch (error) {
      message.error('Failed to remove role');
    }
  };

  const handleBulkAssign = () => {
    if (selectedRows.length === 0) {
      message.warning('Please select users to assign roles');
      return;
    }
    setBulkAssignVisible(true);
  };

  const handleBulkAssignSave = async (values: any) => {
    try {
      const selectedRoles = availableRoles.filter(role =>
        values.roleIds.includes(role.id)
      );

      setUsers(prev => prev.map(user =>
        selectedRows.includes(user.id)
          ? {
              ...user,
              roles: values.replaceExisting
                ? selectedRoles
                : [...user.roles, ...selectedRoles.filter(r => !user.roles.find(ur => ur.id === r.id))],
              assignedAt: new Date().toISOString(),
              assignedBy: 'current-user',
            }
          : user
      ));

      message.success(`Roles assigned to ${selectedRows.length} users`);
      setBulkAssignVisible(false);
      setSelectedRows([]);
    } catch (error) {
      message.error('Failed to assign roles');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: UserWithRoles) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <Space direction="vertical" size={0}>
            <Text strong>{text}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={getUserStatusColor(status) as any}
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Role[], record: UserWithRoles) => (
        <Space wrap>
          {roles.length === 0 ? (
            <Tag color="default">No roles assigned</Tag>
          ) : (
            roles.map(role => (
              <Tag
                key={role.id}
                color={role.isSystem ? 'blue' : 'green'}
                closable={!role.isSystem}
                onClose={() => handleRemoveRole(record.id, role.id)}
              >
                {role.name}
              </Tag>
            ))
          )}
        </Space>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => (
        date ? (
          <Text>{new Date(date).toLocaleDateString()}</Text>
        ) : (
          <Text type="secondary">Never</Text>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: UserWithRoles) => (
        <Space>
          <PermissionGuard permission="role.assign">
            <Tooltip title="Assign Roles">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleAssignRoles(record)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (keys: React.Key[]) => {
      setSelectedRows(keys as string[]);
    },
  };

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <Title level={4} style={{ margin: 0 }}>User Role Assignment</Title>
        </Space>
      }
      extra={
        <Space>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <PermissionGuard permission="role.assign">
            <Button
              icon={<UserAddOutlined />}
              onClick={handleBulkAssign}
              disabled={selectedRows.length === 0}
            >
              Bulk Assign ({selectedRows.length})
            </Button>
          </PermissionGuard>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{ pageSize: 10 }}
      />

      {/* Role Assignment Modal */}
      <Modal
        title={`Assign Roles - ${selectedUser?.name}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveAssignment}
          >
            <Alert
              message="Role Assignment"
              description="Select roles to assign to this user. The user will inherit all permissions from the assigned roles."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="roleIds"
              label="Roles"
              rules={[{ required: true, message: 'Please select at least one role' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select roles"
                optionFilterProp="children"
              >
                {availableRoles.map(role => (
                  <Option key={role.id} value={role.id}>
                    <Space direction="vertical" size={0}>
                      <Space>
                        <Text>{role.name}</Text>
                        {role.isSystem && <Tag color="blue">System</Tag>}
                      </Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {role.description}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save Assignment
                </Button>
                <Button onClick={() => setIsModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal
        title={`Bulk Assign Roles (${selectedRows.length} users)`}
        open={bulkAssignVisible}
        onCancel={() => setBulkAssignVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleBulkAssignSave}
        >
          <Alert
            message="Bulk Role Assignment"
            description="Select roles to assign to all selected users."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="roleIds"
            label="Roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              optionFilterProp="children"
            >
              {availableRoles.map(role => (
                <Option key={role.id} value={role.id}>
                  <Space direction="vertical" size={0}>
                    <Space>
                      <Text>{role.name}</Text>
                      {role.isSystem && <Tag color="blue">System</Tag>}
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {role.description}
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="replaceExisting"
            valuePropName="checked"
          >
            <Checkbox>
              Replace existing roles (instead of adding to them)
            </Checkbox>
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Assign Roles
              </Button>
              <Button onClick={() => setBulkAssignVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserRoleAssignment;