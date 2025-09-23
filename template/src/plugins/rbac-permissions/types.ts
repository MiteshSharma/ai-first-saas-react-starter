/**
 * @fileoverview RBAC & Permissions Plugin Types
 *
 * Comprehensive type definitions for Role-Based Access Control and Permission Management
 */

// ============================================================================
// Base Types
// ============================================================================

export type ISODate = string;

export type PermissionScope = 'system' | 'tenant' | 'workspace' | 'resource';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign' | 'export' | 'import' | 'approve' | 'reject';
export type PermissionResource = 'tenant' | 'workspace' | 'user' | 'role' | 'settings' | 'audit' | 'dashboard' | 'integration' | 'resource';

export type RoleType = 'system' | 'tenant' | 'workspace' | 'custom';
export type RoleLevel = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Base permission definition
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  action: PermissionAction;
  resource: PermissionResource;
  scope: PermissionScope;
  category: string;
  isSystem: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/**
 * Contextual permission with tenant/workspace/resource scope
 */
export interface ContextualPermission extends Permission {
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
  granted: boolean;
  inheritedFrom?: string; // Role ID that granted this permission
}

/**
 * Access context for permission checks
 */
export interface AccessContext {
  userId: string;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason: string;
  grantedBy?: string;
  scope: PermissionScope;
  context: AccessContext;
}

/**
 * Bulk permission check request
 */
export interface BulkPermissionCheck {
  permissions: string[];
  context: AccessContext;
  operator?: 'AND' | 'OR';
}

// ============================================================================
// Role Types
// ============================================================================

/**
 * Role definition
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  level: RoleLevel;
  permissions: string[]; // Array of permission IDs
  isSystem: boolean;
  isDefault: boolean;
  color: string;
  inheritedFrom?: string; // Parent role ID for role inheritance
  createdAt: ISODate;
  updatedAt: ISODate;
}

/**
 * Role template for creating custom roles
 */
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  level: RoleLevel;
  permissions: string[];
  category: string;
  isBuiltIn: boolean;
}

/**
 * User role assignment
 */
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  assignedBy: string;
  assignedAt: ISODate;
  expiresAt?: ISODate;
}

// ============================================================================
// Store State Types
// ============================================================================

/**
 * Permission store state
 */
export interface PermissionState {
  // Permissions
  permissions: Permission[];
  userPermissions: ContextualPermission[];
  loading: boolean;
  error: string | null;

  // Actions
  setPermissions: (permissions: any[]) => void;
  setUserPermissionsFromEvent: (permissions: string[], role: string, context: AccessContext) => void;
  checkPermission: (permission: string, context: AccessContext) => boolean;
  checkMultiplePermissions: (permissions: string[], context: AccessContext, requireAll?: boolean) => boolean;
  clearError: () => void;

  // Helper methods
  isPermissionApplicableToContext: (permission: ContextualPermission, context: AccessContext) => boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Permission Guard component props
 */
export interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  operator?: 'AND' | 'OR';
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  context?: Partial<AccessContext>;
  loading?: boolean;
  showLoader?: boolean;
  showFallback?: boolean;
}

/**
 * Permission Viewer component props
 */
export interface PermissionViewerProps {
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  showInherited?: boolean;
  groupByCategory?: boolean;
  onPermissionClick?: (permission: ContextualPermission) => void;
}

/**
 * Role Management component props
 */
export interface RoleManagementProps {
  tenantId?: string;
  workspaceId?: string;
  onRoleSelect?: (role: Role) => void;
  onRoleChange?: (role: Role) => void;
}

/**
 * User Role Assignment component props
 */
export interface UserRoleAssignmentProps {
  userId: string;
  tenantId?: string;
  workspaceId?: string;
  onRoleAssigned?: (userRole: UserRole) => void;
  onRoleRemoved?: (userRole: UserRole) => void;
}

// ============================================================================
// HOC Props Types
// ============================================================================

/**
 * withPermission HOC props
 */
export interface WithPermissionProps {
  hasPermission?: boolean;
  isCheckingPermission?: boolean;
  permissionError?: string | null;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Create permission request
 */
export interface CreatePermissionRequest {
  name: string;
  description: string;
  action: PermissionAction;
  resource: PermissionResource;
  scope: PermissionScope;
  category: string;
}

/**
 * Update permission request
 */
export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Create role request
 */
export interface CreateRoleRequest {
  name: string;
  description: string;
  type: RoleType;
  level: RoleLevel;
  permissions: string[];
  color?: string;
}

/**
 * Update role request
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  color?: string;
}

/**
 * Assign role request
 */
export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  expiresAt?: ISODate;
}

// ============================================================================
// Paginated Response Types
// ============================================================================

export interface PaginatedPermissionsResponse {
  permissions: Permission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedRolesResponse {
  roles: Role[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedUserRolesResponse {
  userRoles: UserRole[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface PermissionFilters {
  action?: PermissionAction;
  resource?: PermissionResource;
  scope?: PermissionScope;
  category?: string;
  isSystem?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'action' | 'resource' | 'scope' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RoleFilters {
  type?: RoleType;
  level?: RoleLevel;
  isSystem?: boolean;
  isDefault?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'type' | 'level' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserRoleFilters {
  userId?: string;
  roleId?: string;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  includeExpired?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'assignedAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Error Types
// ============================================================================

export interface RBACError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// ============================================================================
// Event Types
// ============================================================================

export interface RBACEvents {
  'permission.created': { permission: Permission };
  'permission.updated': { permission: Permission };
  'permission.deleted': { permissionId: string };
  'role.created': { role: Role };
  'role.updated': { role: Role };
  'role.deleted': { roleId: string };
  'user.role.assigned': { userRole: UserRole };
  'user.role.removed': { userRole: UserRole };
  'permission.check': { userId: string; permission: string; context: AccessContext; granted: boolean };
}

// ============================================================================
// Utility Types
// ============================================================================

export type RBACEventType = keyof RBACEvents;
export type RBACEventPayload<T extends RBACEventType> = RBACEvents[T];

// ============================================================================
// Plugin Configuration
// ============================================================================

export interface RBACPluginConfig {
  enableAuditLogging: boolean;
  cachePermissions: boolean;
  permissionRefreshInterval: number;
  maxRolesPerUser: number;
  allowCustomRoles: boolean;
  enableRoleInheritance: boolean;
}

// ============================================================================
// Constants Types
// ============================================================================

export type PermissionCategory = 'Tenant Management' | 'Workspace Management' | 'User Management' | 'Role Management' | 'Settings' | 'Audit & Compliance' | 'Dashboard' | 'Integrations';

export type RoleColor = '#f5222d' | '#fa541c' | '#fa8c16' | '#faad14' | '#fadb14' | '#a0d911' | '#52c41a' | '#13c2c2' | '#1890ff' | '#2f54eb' | '#722ed1' | '#eb2f96';