import React from 'react';
import { Card, Descriptions, List, Avatar, Tag, Button, Space } from 'antd';
import {
  UserOutlined,
  FolderOutlined,
  CalendarOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { TenantDetailsProps } from '../types';
import { TenantRole } from '../../../core/stores/tenant/types';

const TenantDetails: React.FC<TenantDetailsProps> = ({
  tenant,
  members,
  workspaces,
  onUpdateTenant,
  onInviteMember,
  onRemoveMember,
}) => {
  const getRoleColor = (role: TenantRole) => {
    switch (role) {
      case TenantRole.OWNER:
        return 'gold';
      case TenantRole.ADMIN:
        return 'blue';
      case TenantRole.MEMBER:
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <Card
        title="Tenant Details"
        extra={
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onUpdateTenant(tenant)}
          >
            Edit
          </Button>
        }
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Name">{tenant.name}</Descriptions.Item>
          <Descriptions.Item label="Description">
            {tenant.description || 'No description provided'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={tenant.isActive ? 'success' : 'warning'}
            >
              {tenant.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {new Date(tenant.createdAt).toLocaleDateString()}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Members">
            <Space>
              <UserOutlined />
              {tenant.memberCount} members
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Workspaces">
            <Space>
              <FolderOutlined />
              {tenant.workspaceCount} workspaces
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Members"
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onInviteMember('', 'member')}
          >
            Invite
          </Button>
        }
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={members}
          renderItem={(member) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={() => onRemoveMember(member.id)}
                >
                  Remove
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    {member.name || member.email}
                    <Tag color={getRoleColor(member.role)}>
                      {member.role}
                    </Tag>
                  </Space>
                }
                description={member.email}
              />
            </List.Item>
          )}
          locale={{
            emptyText: 'No members found'
          }}
        />
      </Card>

      <Card
        title="Workspaces"
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={workspaces}
          renderItem={(workspace) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<FolderOutlined />} />}
                title={workspace.name}
                description={workspace.description || 'No description'}
              />
            </List.Item>
          )}
          locale={{
            emptyText: 'No workspaces found'
          }}
        />
      </Card>
    </div>
  );
};

export default TenantDetails;