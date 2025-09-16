/**
 * @fileoverview Central store exports
 */

// Auth store
export { useAuthStore } from '../auth/AuthStore';
export type { AuthState, User, LoginCredentials, RegisterData, AuthResponse } from '../auth/types';

// Tenant store - now from plugin
export { useTenantStore } from '../../plugins/tenant-management/stores/tenantStore';
export type {
  Tenant,
  TenantMember,
  TenantInvite,
  Workspace,
  TenantRole,
  TenantPlan,
  TenantStatus,
  WorkspaceStatus,
  CreateTenantPayload,
  UpdateTenantPayload,
  InviteMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload
} from '../../plugins/tenant-management/types';

// Test store
export { useTestStore } from './TestStore';