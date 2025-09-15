import React from 'react';
import { Button, Tag, Tooltip } from 'antd';
import {
  UserOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { TenantCardProps } from '../types';
import {
  TenantCard as StyledCard,
  TenantHeader,
  TenantTitle,
  TenantDescription,
  TenantMeta,
  TenantStats,
  StatItem,
  TenantActions,
} from '../styles/TenantCard.styles';

const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on action buttons
    if ((e.target as HTMLElement).closest('.tenant-actions')) {
      return;
    }
    onSelect(tenant);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(tenant);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(tenant);
  };

  return (
    <StyledCard
      $isSelected={isSelected}
      onClick={handleCardClick}
      hoverable
    >
      <TenantHeader>
        <div>
          <TenantTitle>{tenant.name}</TenantTitle>
          <Tag
            icon={tenant.isActive ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            color={tenant.isActive ? 'success' : 'warning'}
          >
            {tenant.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </div>
        <TenantActions className="tenant-actions">
          {onEdit && (
            <Tooltip title="Edit tenant">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={handleEdit}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete tenant">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              />
            </Tooltip>
          )}
        </TenantActions>
      </TenantHeader>

      {tenant.description && (
        <TenantDescription>{tenant.description}</TenantDescription>
      )}

      <TenantMeta>
        <TenantStats>
          <StatItem>
            <UserOutlined />
            <span>{tenant.memberCount} members</span>
          </StatItem>
          <StatItem>
            <FolderOutlined />
            <span>{tenant.workspaceCount} workspaces</span>
          </StatItem>
        </TenantStats>
        <div>
          <Tag color="blue">
            Created {new Date(tenant.createdAt).toLocaleDateString()}
          </Tag>
        </div>
      </TenantMeta>
    </StyledCard>
  );
};

export default TenantCard;