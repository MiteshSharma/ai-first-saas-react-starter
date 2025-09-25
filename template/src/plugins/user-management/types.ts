/**
 * @fileoverview User Management Plugin Types
 *
 * Defines all types and interfaces for user management functionality
 * including user profiles and preferences
 */

// ============================================================================
// Base Types
// ============================================================================

export type ISODate = string;


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

// User permissions from tenant management
export interface UserPermissions {
  userId: string;
  tenantId: string;
  tenantName?: string;
  tenantRole: string;
  workspaces: WorkspacePermission[];
}

export interface WorkspacePermission {
  workspaceId: string;
  workspaceName: string;
  role: string;
  groupIds: string[];
  effectivePermissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
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


// ============================================================================
// Store Types
// ============================================================================

export interface UserManagementState {
  // Current user data
  currentUser: User | null;
  userPreferences: UserPreferences | null;
  userPermissions: UserPermissions | null;

  // User list data
  users: UserWithTenantInfo[];
  userFilters: UserSearchFilters;
  usersLoading: boolean;
  usersError: string | null;

  // UI state
  selectedUser: UserWithTenantInfo | null;

  // Loading states
  isUpdatingProfile: boolean;
  isUpdatingPreferences: boolean;
}

export interface UserManagementActions {
  // User list actions
  fetchUsers: (filters?: UserSearchFilters) => Promise<void>;
  updateUserFilters: (filters: Partial<UserSearchFilters>) => void;
  selectUser: (user: UserWithTenantInfo | null) => void;

  // User profile actions
  updateProfile: (data: UpdateUserProfileRequest) => Promise<void>;

  // User preferences actions
  updatePreferences: (data: UpdateUserPreferencesRequest) => Promise<void>;

  // Utility actions
  clearErrors: () => void;
  reset: () => void;
}

// ============================================================================
// Event Types
// ============================================================================

export const USER_MANAGEMENT_EVENTS = {
  USER_UPDATED: 'user.updated',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_PREFERENCES_UPDATED: 'user.preferences.updated',
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
export type Theme = typeof THEMES[keyof typeof THEMES];