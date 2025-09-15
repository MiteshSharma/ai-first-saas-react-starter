/**
 * @fileoverview Tenant Management Plugin Types
 *
 * Defines all types and interfaces for tenant management functionality
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: TenantSettings;
  subscription: TenantSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  features: TenantFeatures;
  branding: TenantBranding;
}

export interface TenantFeatures {
  userLimit: number;
  storageLimit: number;
  apiCallsLimit: number;
  customBranding: boolean;
  ssoEnabled: boolean;
  auditLogs: boolean;
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