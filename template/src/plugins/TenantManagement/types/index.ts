/**
 * @fileoverview Tenant Management Plugin Types
 *
 * UI-specific types for the tenant management plugin
 */

import { Tenant, TenantMember, Workspace } from '../../../core/stores/tenant/types';

export interface TenantListItem extends Tenant {
  memberCount: number;
  workspaceCount: number;
  isActive: boolean;
  description?: string;
}

export interface TenantCardProps {
  tenant: TenantListItem;
  onSelect: (tenant: TenantListItem) => void;
  onEdit?: (tenant: TenantListItem) => void;
  onDelete?: (tenant: TenantListItem) => void;
  isSelected?: boolean;
}

export interface TenantListProps {
  tenants: TenantListItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  onCreateTenant?: () => void;
  onTenantSelect?: (tenant: TenantListItem) => void;
}

export interface TenantDetailsProps {
  tenant: TenantListItem;
  members: TenantMember[];
  workspaces: Workspace[];
  onUpdateTenant: (tenant: TenantListItem) => void;
  onInviteMember: (email: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export interface CreateTenantModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (data: { name: string; description?: string }) => void;
  loading?: boolean;
}