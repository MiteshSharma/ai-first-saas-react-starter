/**
 * @fileoverview Central store exports
 */

// Auth store
export { useAuthStore } from '../auth/AuthStore';
export type { AuthState, User, LoginCredentials, RegisterData, AuthResponse } from '../auth/types';

// Tenant store
export { useTenantStore } from './tenant/tenantStore';
export type {
  TenantState,
  TenantActions,
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
} from './tenant/types';

// Test store
export { useTestStore } from './TestStore';