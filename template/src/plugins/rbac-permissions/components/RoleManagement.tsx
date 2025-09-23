/**
 * @fileoverview Role Management Component
 *
 * Comprehensive role management UI with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  Tooltip,
  message,
  Popconfirm,
  Divider,
  Transfer,
  Typography,
  Alert,
} from 'antd';
import type { Key } from 'antd/es/table/interface';
import type { TransferDirection } from 'antd/es/transfer';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard } from './PermissionGuard';
import { Role, CreateRoleRequest } from '../types';

const { Text, Title } = Typography;
const { Option } = Select;

interface RoleManagementProps {
  tenantId?: string;
  workspaceId?: string;
  onRoleChange?: (roles: Role[]) => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  tenantId,
  workspaceId,
  onRoleChange,
}) => {
  const { permissions, loading } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  // Mock roles data - in real implementation, this would come from API
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: 'tenant-owner',
        name: 'Tenant Owner',
        description: 'Full access to tenant resources',
        type: 'system',
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
        permissions: ['workspace.read', 'workspace.update', 'workspace.settings.manage'],
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
    setRoles(mockRoles);
  }, [tenantId, workspaceId]);

  const handleCreateRole = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      type: role.type,
      level: role.level,
    });
    setIsModalVisible(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      // Mock delete - in real implementation, this would call API
      const updatedRoles = roles.filter(role => role.id !== roleId);
      setRoles(updatedRoles);
      message.success('Role deleted successfully');
      onRoleChange?.(updatedRoles);
    } catch (error) {
      message.error('Failed to delete role');
    }
  };

  const handleSaveRole = async (values: CreateRoleRequest) => {
    try {
      const roleData: Partial<Role> = {
        name: values.name,
        description: values.description,
        type: values.type || 'custom',
        level: values.level || 'member',
        permissions: [], // Will be set via permission management
        isDefault: false,
        color: '#1890ff',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingRole) {
        // Update existing role
        setRoles(prev => prev.map(role =>
          role.id === editingRole.id
            ? { ...role, ...roleData, updatedAt: new Date().toISOString() }
            : role
        ));
        message.success('Role updated successfully');
      } else {
        // Create new role
        const newRole: Role = {
          ...roleData as Role,
          id: `role-${Date.now()}`,
          isSystem: false,
        };
        setRoles(prev => [...prev, newRole]);
        message.success('Role created successfully');
      }

      setIsModalVisible(false);
      onRoleChange?.(roles);
    } catch (error) {
      message.error('Failed to save role');
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setPermissionModalVisible(true);
  };

  const handlePermissionChange = (targetKeys: Key[], direction: TransferDirection, moveKeys: Key[]) => {
    if (!selectedRole) return;

    const stringTargetKeys = targetKeys.map(key => String(key));

    setRoles(prev => prev.map(role =>
      role.id === selectedRole.id
        ? { ...role, permissions: stringTargetKeys, updatedAt: new Date().toISOString() }
        : role
    ));
    setSelectedRole({ ...selectedRole, permissions: stringTargetKeys });
  };

  const handleToggleRoleDefault = async (roleId: string) => {
    try {
      setRoles(prev => prev.map(role =>
        role.id === roleId
          ? { ...role, isDefault: !role.isDefault, updatedAt: new Date().toISOString() }
          : role
      ));
      message.success('Role default status updated');
    } catch (error) {
      message.error('Failed to update role status');
    }
  };

  const getPermissionDisplayName = (permissionId: string): string => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.name || permissionId;
  };

  const columns = [
    {
      title: 'Role',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Role) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{text}</Text>
            {record.isSystem && <Tag color="blue">System</Tag>}
            {record.isDefault && <Tag color="green">Default</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.slice(0, 3).map(permission => (
            <Tag key={permission} color="green">
              {getPermissionDisplayName(permission)}
            </Tag>
          ))}
          {permissions.length > 3 && (
            <Tag color="default">+{permissions.length - 3} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Default',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean, record: Role) => (
        <PermissionGuard permission="role.update">
          <Switch
            checked={isDefault}
            onChange={() => handleToggleRoleDefault(record.id)}
            disabled={record.isSystem}
          />
        </PermissionGuard>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <Space>
          <PermissionGuard permission="role.update">
            <Tooltip title="Edit Role">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditRole(record)}
                disabled={record.isSystem}
              />
            </Tooltip>
          </PermissionGuard>

          <PermissionGuard permission="role.update">
            <Tooltip title="Manage Permissions">
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => handleManagePermissions(record)}
              />
            </Tooltip>
          </PermissionGuard>

          <PermissionGuard permission="role.delete">
            <Popconfirm
              title="Delete Role"
              description="Are you sure you want to delete this role?"
              onConfirm={() => handleDeleteRole(record.id)}
              disabled={record.isSystem}
            >
              <Tooltip title={
                record.isSystem
                  ? "System roles cannot be deleted"
                  : "Delete Role"
              }>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  disabled={record.isSystem}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  // Prepare transfer data for permission management
  const transferData = permissions.map(permission => ({
    key: permission.id,
    title: permission.name,
    description: permission.description,
    category: permission.category,
  }));

  return (
    <Card
      title={
        <Space>
          <SecurityScanOutlined />
          <Title level={4} style={{ margin: 0 }}>Role Management</Title>
        </Space>
      }
      extra={
        <PermissionGuard permission="role.create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateRole}
          >
            Create Role
          </Button>
        </PermissionGuard>
      }
    >
      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Create/Edit Role Modal */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRole}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Enter role description"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Role Type"
            rules={[{ required: true, message: 'Please select role type' }]}
          >
            <Select placeholder="Select role type">
              <Option value="system">System</Option>
              <Option value="tenant">Tenant</Option>
              <Option value="workspace">Workspace</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="Role Level"
            rules={[{ required: true, message: 'Please select role level' }]}
          >
            <Select placeholder="Select role level">
              <Option value="owner">Owner</Option>
              <Option value="admin">Admin</Option>
              <Option value="manager">Manager</Option>
              <Option value="member">Member</Option>
              <Option value="viewer">Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isDefault"
            label="Default Role"
            valuePropName="checked"
            initialValue={false}
            extra="Users will be assigned this role by default"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRole ? 'Update' : 'Create'} Role
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Management Modal */}
      <Modal
        title={`Manage Permissions - ${selectedRole?.name}`}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRole && (
          <>
            <Alert
              message="Permission Management"
              description="Select permissions to assign to this role. Users with this role will inherit these permissions."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Transfer
              dataSource={transferData}
              titles={['Available Permissions', 'Assigned Permissions']}
              targetKeys={selectedRole.permissions}
              onChange={handlePermissionChange}
              render={item => (
                <Space direction="vertical" size={0}>
                  <Text>{item.title}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.description}
                  </Text>
                </Space>
              )}
              listStyle={{
                width: 350,
                height: 400,
              }}
              operations={['Assign', 'Remove']}
              showSearch
              filterOption={(inputValue, item) =>
                item.title?.toLowerCase().includes(inputValue.toLowerCase()) ||
                item.description?.toLowerCase().includes(inputValue.toLowerCase())
              }
            />

            <Divider />

            <Space>
              <Button
                type="primary"
                onClick={() => setPermissionModalVisible(false)}
              >
                Save Changes
              </Button>
              <Button onClick={() => setPermissionModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </>
        )}
      </Modal>
    </Card>
  );
};

export default RoleManagement;