/**
 * @fileoverview Tenant and workspace types for multi-tenant SaaS
 */

import type { AppError as BaseAppError } from '../base';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  settings?: TenantSettings;
}

export interface TenantMember {
  id: string;
  userId: string;
  tenantId: string;
  role: TenantRole;
  email: string;
  name: string;
  avatar?: string;
  status: MemberStatus;
  invitedAt: string;
  joinedAt?: string;
}

export interface TenantInvite {
  id: string;
  tenantId: string;
  email: string;
  role: TenantRole;
  status: InviteStatus;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  token: string;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  slug: string;
  ownerId: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  settings?: WorkspaceSettings;
}

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired'
}

export enum TenantRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum MemberStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export enum WorkspaceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export interface TenantSettings {
  allowInvites: boolean;
  maxMembers: number;
  features: string[];
  customDomain?: string;
}

export interface WorkspaceSettings {
  isPublic: boolean;
  allowGuests: boolean;
  retentionDays?: number;
}

export interface TenantState {
  // Data
  tenants: Tenant[];
  currentTenant: Tenant | null;
  tenantMembers: TenantMember[];
  tenantInvites: TenantInvite[];
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;

  // Request state
  loading: boolean;
  error: BaseAppError | null;
  currentRequest: TenantRequestType | null;
}

export interface TenantActions {
  // Standard request lifecycle
  resetRequestState: () => void;
  setLoading: (loading: boolean, requestType?: TenantRequestType) => void;
  setError: (error: BaseAppError | null) => void;

  // Tenant management
  fetchTenants: () => Promise<void>;
  setCurrentTenant: (tenant: Tenant | null) => void;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (data: CreateTenantPayload) => Promise<Tenant>;
  updateTenant: (tenantId: string, data: UpdateTenantPayload) => Promise<void>;

  // Member management
  fetchTenantMembers: (tenantId: string) => Promise<void>;
  inviteMember: (tenantId: string, data: InviteMemberPayload) => Promise<void>;
  updateMemberRole: (memberId: string, role: TenantRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Invite management
  fetchTenantInvites: (tenantId: string) => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
  resendInvite: (inviteId: string) => Promise<void>;

  // Workspace management
  fetchWorkspaces: (tenantId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (tenantId: string, data: CreateWorkspacePayload) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, data: UpdateWorkspacePayload) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
}

export enum TenantRequestType {
  FETCH_TENANTS = 'FETCH_TENANTS',
  SWITCH_TENANT = 'SWITCH_TENANT',
  CREATE_TENANT = 'CREATE_TENANT',
  UPDATE_TENANT = 'UPDATE_TENANT',
  
  FETCH_MEMBERS = 'FETCH_MEMBERS',
  INVITE_MEMBER = 'INVITE_MEMBER',
  UPDATE_MEMBER = 'UPDATE_MEMBER',
  REMOVE_MEMBER = 'REMOVE_MEMBER',
  
  FETCH_INVITES = 'FETCH_INVITES',
  REVOKE_INVITE = 'REVOKE_INVITE',
  RESEND_INVITE = 'RESEND_INVITE',
  
  FETCH_WORKSPACES = 'FETCH_WORKSPACES',
  CREATE_WORKSPACE = 'CREATE_WORKSPACE',
  UPDATE_WORKSPACE = 'UPDATE_WORKSPACE',
  DELETE_WORKSPACE = 'DELETE_WORKSPACE'
}


// Payload types
export interface CreateTenantPayload {
  name: string;
  slug?: string;
  plan?: TenantPlan;
}

export interface UpdateTenantPayload {
  name?: string;
  settings?: Partial<TenantSettings>;
}

export interface InviteMemberPayload {
  email: string;
  role: TenantRole;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  slug?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  settings?: Partial<WorkspaceSettings>;
}