/**
 * @fileoverview User Management Plugin Types
 *
 * Defines all types and interfaces for user management functionality
 * including invitations, user profiles, and security settings
 */

// ============================================================================
// Base Types
// ============================================================================

export type ISODate = string;

// ============================================================================
// Invitation Types
// ============================================================================

export interface Invitation {
  id: string;
  email: string;
  tenantId: string;
  workspaceRoles?: { workspaceId: string; role: string; }[];
  tenantRole: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expiresAt: ISODate;
  createdAt: ISODate;
  acceptedAt?: ISODate;
}

export interface SendInvitationRequest {
  emails: string[];
  tenantId: string;
  orgRole: string;
  workspaceRoles?: { wsId: string; role: string }[];
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// User Management Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
    timezone: string;
    locale: string;
  };
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface UserWithTenantInfo extends User {
  tenantRole?: string;
  workspaceRoles?: { workspaceId: string; role: string; }[];
  lastLogin?: ISODate;
  permissions?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: {
    invitations: boolean;
    updates: boolean;
    security: boolean;
    marketing: boolean;
  };
  inApp: {
    mentions: boolean;
    updates: boolean;
    security: boolean;
  };
}

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  defaultWorkspace?: string;
  widgets: string[];
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange?: ISODate;
  sessionTimeout: number; // in minutes
  trustedDevices?: TrustedDevice[];
}

export interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastUsed: ISODate;
  location?: string;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface UserSearchFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  tenantId?: string;
  workspaceId?: string;
  lastLoginAfter?: ISODate;
  lastLoginBefore?: ISODate;
}

export interface UserListResponse {
  users: UserWithTenantInfo[];
  total: number;
  page: number;
  limit: number;
  filters: UserSearchFilters;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  timezone?: string;
  locale?: string;
}

export interface UpdateUserPreferencesRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  notifications?: Partial<NotificationPreferences>;
  dashboard?: Partial<DashboardPreferences>;
}

export interface UpdateSecuritySettingsRequest {
  twoFactorEnabled?: boolean;
  sessionTimeout?: number;
  password?: string;
  currentPassword?: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  thumbnailUrl?: string;
}

// ============================================================================
// Store Types
// ============================================================================

export interface UserManagementState {
  // Current user data
  currentUser: User | null;
  userPreferences: UserPreferences | null;
  securitySettings: SecuritySettings | null;

  // User list data
  users: UserWithTenantInfo[];
  userFilters: UserSearchFilters;
  usersLoading: boolean;
  usersError: string | null;

  // Invitation data
  invitations: Invitation[];
  invitationsLoading: boolean;
  invitationsError: string | null;

  // UI state
  showInviteModal: boolean;
  selectedUser: UserWithTenantInfo | null;

  // Loading states
  isUpdatingProfile: boolean;
  isUpdatingPreferences: boolean;
  isUpdatingSecuritySettings: boolean;
  isUploadingAvatar: boolean;
}

export interface UserManagementActions {
  // User list actions
  fetchUsers: (filters?: UserSearchFilters) => Promise<void>;
  updateUserFilters: (filters: Partial<UserSearchFilters>) => void;
  selectUser: (user: UserWithTenantInfo | null) => void;

  // Invitation actions
  fetchInvitations: (tenantId: string) => Promise<void>;
  sendInvitations: (data: SendInvitationRequest) => Promise<Invitation[]>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;

  // User profile actions
  updateProfile: (data: UpdateUserProfileRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<UploadAvatarResponse>;

  // User preferences actions
  updatePreferences: (data: UpdateUserPreferencesRequest) => Promise<void>;

  // Security settings actions
  updateSecuritySettings: (data: UpdateSecuritySettingsRequest) => Promise<void>;
  enableTwoFactor: () => Promise<{ qrCode: string; backupCodes: string[] }>;
  disableTwoFactor: () => Promise<void>;

  // UI actions
  setShowInviteModal: (show: boolean) => void;

  // Utility actions
  clearErrors: () => void;
  reset: () => void;
}

// ============================================================================
// Event Types
// ============================================================================

export const USER_MANAGEMENT_EVENTS = {
  USER_INVITED: 'user.invited',
  USER_UPDATED: 'user.updated',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_PREFERENCES_UPDATED: 'user.preferences.updated',
  USER_SECURITY_UPDATED: 'user.security.updated',
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
  INVITATION_CANCELLED: 'invitation.cancelled',
  AVATAR_UPLOADED: 'user.avatar.uploaded'
} as const;

export type UserManagementEventType = typeof USER_MANAGEMENT_EVENTS[keyof typeof USER_MANAGEMENT_EVENTS];

// ============================================================================
// Constants
// ============================================================================

export const TENANT_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest',
  BILLING_MANAGER: 'billing_manager'
} as const;

export const WORKSPACE_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
} as const;

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

export const INVITATION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const;

// ============================================================================
// Type Guards
// ============================================================================

export function isValidTenantRole(role: string): role is TenantRole {
  return Object.values(TENANT_ROLES).includes(role as TenantRole);
}

export function isValidWorkspaceRole(role: string): role is WorkspaceRole {
  return Object.values(WORKSPACE_ROLES).includes(role as WorkspaceRole);
}

export function isValidInvitationStatus(status: string): status is InvitationStatus {
  return Object.values(INVITATION_STATUSES).includes(status as InvitationStatus);
}

// ============================================================================
// Plugin Context Type
// ============================================================================

export interface UserManagementContext {
  state: UserManagementState;
  actions: UserManagementActions;
}

// ============================================================================
// Export all types for convenience
// ============================================================================

export type TenantRole = typeof TENANT_ROLES[keyof typeof TENANT_ROLES];
export type WorkspaceRole = typeof WORKSPACE_ROLES[keyof typeof WORKSPACE_ROLES];
export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];
export type InvitationStatus = typeof INVITATION_STATUSES[keyof typeof INVITATION_STATUSES];
export type Theme = typeof THEMES[keyof typeof THEMES];