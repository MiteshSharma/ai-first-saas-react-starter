/**
 * @fileoverview Tenant Management Plugin Types
 *
 * Defines all types and interfaces for tenant management functionality
 */

import type { TenantFeatures, TenantSettings as CoreTenantSettings } from '../../core/types';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: 'personal' | 'team' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  description?: string;
  settings: TenantSettings;
  subscription: TenantSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings extends CoreTenantSettings {
  branding: TenantBranding;
  timezone: string;
  currency: string;
  language: string;
}


export interface TenantBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  favicon?: string;
}

export interface TenantSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'yearly';
  expiresAt?: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  permissions: string[];
  joinedAt: string;
}

export type TenantRole = 'owner' | 'admin' | 'member' | 'guest';

// Additional type exports for backwards compatibility
export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'inactive' | 'cancelled' | 'suspended' | 'trial';
export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type WorkspaceStatus = 'active' | 'archived' | 'deleted';

// Enum-like objects for runtime usage
export const TENANT_ROLES = {
  OWNER: 'owner' as TenantRole,
  ADMIN: 'admin' as TenantRole,
  MEMBER: 'member' as TenantRole,
  GUEST: 'guest' as TenantRole
} as const;

export const TENANT_PLANS = {
  FREE: 'free' as TenantPlan,
  STARTER: 'starter' as TenantPlan,
  PROFESSIONAL: 'professional' as TenantPlan,
  ENTERPRISE: 'enterprise' as TenantPlan
} as const;

export const TENANT_STATUSES = {
  ACTIVE: 'active' as TenantStatus,
  INACTIVE: 'inactive' as TenantStatus,
  CANCELLED: 'cancelled' as TenantStatus,
  SUSPENDED: 'suspended' as TenantStatus,
  TRIAL: 'trial' as TenantStatus
} as const;

export const MEMBER_STATUSES = {
  ACTIVE: 'active' as MemberStatus,
  INACTIVE: 'inactive' as MemberStatus,
  SUSPENDED: 'suspended' as MemberStatus
} as const;

export const INVITE_STATUSES = {
  PENDING: 'pending' as InviteStatus,
  ACCEPTED: 'accepted' as InviteStatus,
  EXPIRED: 'expired' as InviteStatus,
  CANCELLED: 'cancelled' as InviteStatus
} as const;

export const WORKSPACE_STATUSES = {
  ACTIVE: 'active' as WorkspaceStatus,
  ARCHIVED: 'archived' as WorkspaceStatus,
  DELETED: 'deleted' as WorkspaceStatus
} as const;

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: TenantRole;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  type: 'personal' | 'team' | 'enterprise';
  description?: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  settings?: Partial<TenantSettings>;
}

export interface TenantContext {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isLoading: boolean;
  error: string | null;

  // Actions
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (data: CreateTenantRequest) => Promise<Tenant>;
  updateTenant: (tenantId: string, data: UpdateTenantRequest) => Promise<Tenant>;
  deleteTenant: (tenantId: string) => Promise<void>;
  inviteUser: (tenantId: string, email: string, role: TenantRole) => Promise<TenantInvitation>;
  removeUser: (tenantId: string, userId: string) => Promise<void>;
  updateUserRole: (tenantId: string, userId: string, role: TenantRole) => Promise<void>;

  // Utilities
  hasPermission: (permission: string) => boolean;
  canAccessFeature: (feature: keyof TenantFeatures) => boolean;
  getCurrentUserRole: () => TenantRole | null;
}

// API Types
export interface TenantApiResponse {
  tenant: Tenant;
}

export interface TenantsApiResponse {
  tenants: Tenant[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantUsersApiResponse {
  users: TenantUser[];
  total: number;
}

// Plugin-specific events
export const TENANT_EVENTS = {
  TENANT_SWITCHED: 'tenant.switched',
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_DELETED: 'tenant.deleted',
  USER_INVITED: 'tenant.user.invited',
  USER_REMOVED: 'tenant.user.removed',
  USER_ROLE_UPDATED: 'tenant.user.role_updated'
} as const;

export type TenantEventType = typeof TENANT_EVENTS[keyof typeof TENANT_EVENTS];

// Workspace types
export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
}

// Additional interfaces for compatibility
export interface TenantMember extends TenantUser {
  email?: string;
  name?: string;
  avatar?: string;
  status?: MemberStatus;
}

export interface TenantInvite extends TenantInvitation {
  // Already defined above, just aliasing for compatibility
}

// Payload types
export interface CreateTenantPayload extends CreateTenantRequest {}
export interface UpdateTenantPayload extends UpdateTenantRequest {}
export interface InviteMemberPayload {
  email: string;
  role: TenantRole;
}
export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}
export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  status?: WorkspaceStatus;
}