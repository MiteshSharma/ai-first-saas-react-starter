/**
 * @fileoverview Core types and interfaces for multi-tenant SaaS application
 *
 * This file contains all the shared type definitions used throughout the application
 * including User, Tenant, Workspace, and Permission types.
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * ISO 8601 date string format
 * @example "2025-09-17T13:45:00Z"
 */
export type ISODate = string;

// ============================================================================
// User Types
// ============================================================================

/**
 * User profile information
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  timezone: string;
  locale: string;
}

/**
 * User entity with enhanced properties for multi-tenant support
 */
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  profile: UserProfile;
  createdAt: ISODate;
  updatedAt: ISODate;
  // Admin user flag for admin sessions
  isAdminUser?: boolean;
}

// ============================================================================
// Tenant Types
// ============================================================================

/**
 * Tenant security settings
 */
export interface TenantSecuritySettings {
  ssoEnabled: boolean;
  mfaRequired: boolean;
  sessionTimeout: number; // in minutes
  ipWhitelist?: string[];
}

/**
 * Tenant data retention settings
 */
export interface TenantDataRetentionSettings {
  auditLogsDays: number;
}

/**
 * Tenant feature flags
 */
export interface TenantFeatures {
  advancedAnalytics: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  advancedSecurity: boolean;
  ssoEnabled: boolean;
  auditLogs: boolean;
  userLimit: number;
  storageLimit: number;
  apiCallsLimit: number;
}

/**
 * Tenant notification settings
 */
export interface TenantNotificationSettings {
  emailNotifications: boolean;
  slackIntegration?: {
    webhook: string;
    channel?: string;
  };
  webhookUrl?: string;
}

/**
 * Complete tenant settings
 */
export interface TenantSettings {
  security: TenantSecuritySettings;
  dataRetention: TenantDataRetentionSettings;
  features: TenantFeatures;
  notifications: TenantNotificationSettings;
}

/**
 * Tenant entity
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'deleted';
  settings: TenantSettings;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ============================================================================
// Workspace Types
// ============================================================================

/**
 * Workspace access control settings
 */
export interface WorkspaceAccessSettings {
  visibility: 'private' | 'tenant' | 'public';
  joinPolicy: 'open' | 'request' | 'invite_only';
  externalAccess: boolean;
}

/**
 * Workspace data management settings
 */
export interface WorkspaceDataSettings {
  allowDataExport: boolean;
  backupEnabled: boolean;
  dataRetentionDays?: number;
}

/**
 * Workspace integration settings
 */
export interface WorkspaceIntegrations {
  slackChannel?: string;
  githubRepo?: string;
  jiraProject?: string;
}

/**
 * Workspace notification preferences
 */
export interface WorkspaceNotifications {
  projectUpdates: boolean;
  memberActivity: boolean;
  systemAlerts: boolean;
}

/**
 * Complete workspace settings
 */
export interface WorkspaceSettings {
  access: WorkspaceAccessSettings;
  data: WorkspaceDataSettings;
  integrations?: WorkspaceIntegrations;
  notifications?: WorkspaceNotifications;
}

/**
 * Workspace entity
 */
export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  type: 'project' | 'department' | 'team' | 'client';
  status: 'active' | 'archived' | 'deleted';
  settings: WorkspaceSettings;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission definition
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  action: string;
  resource: string;
  scope: 'system' | 'tenant' | 'workspace' | 'resource';
  category: string;
  isSystem: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/**
 * Context for permission evaluation
 */
export interface PermissionContext {
  tenantId: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to create a new tenant
 */
export interface CreateTenantRequest {
  name: string;
  slug: string;
  settings?: Partial<TenantSettings>;
}

/**
 * Request to update a tenant
 */
export interface UpdateTenantRequest {
  name?: string;
  settings?: Partial<TenantSettings>;
}

/**
 * Request to create a new workspace
 */
export interface CreateWorkspaceRequest {
  name: string;
  type: 'project' | 'department' | 'team' | 'client';
  settings?: Partial<WorkspaceSettings>;
}

/**
 * Request to update a workspace
 */
export interface UpdateWorkspaceRequest {
  name?: string;
  status?: 'active' | 'archived' | 'deleted';
  settings?: Partial<WorkspaceSettings>;
}

// ============================================================================
// Member & Invitation Types
// ============================================================================

/**
 * Tenant member
 */
export interface TenantMember {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  joinedAt: ISODate;
}

/**
 * Workspace member
 */
export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  permissions: string[];
  joinedAt: ISODate;
}

/**
 * Invitation to join a tenant
 */
export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  createdAt: ISODate;
  expiresAt: ISODate;
  acceptedAt?: ISODate;
}

// ============================================================================
// Audit Types
// ============================================================================

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  tenantId?: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: ISODate;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: ISODate;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: ISODate;
}

// ============================================================================
// Export Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid ISODate string
 */
export function isISODate(value: any): value is ISODate {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
}

/**
 * Type guard to check if an object is a User
 */
export function isUser(value: any): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.emailVerified === 'boolean' &&
    ['active', 'inactive', 'suspended'].includes(value.status) &&
    typeof value.profile === 'object' &&
    isISODate(value.createdAt) &&
    isISODate(value.updatedAt)
  );
}

/**
 * Type guard to check if an object is a Tenant
 */
export function isTenant(value: any): value is Tenant {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    ['active', 'suspended', 'deleted'].includes(value.status) &&
    typeof value.settings === 'object' &&
    isISODate(value.createdAt) &&
    isISODate(value.updatedAt)
  );
}

/**
 * Type guard to check if an object is a Workspace
 */
export function isWorkspace(value: any): value is Workspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.tenantId === 'string' &&
    typeof value.name === 'string' &&
    ['project', 'department', 'team', 'client'].includes(value.type) &&
    ['active', 'archived', 'deleted'].includes(value.status) &&
    typeof value.settings === 'object' &&
    isISODate(value.createdAt) &&
    isISODate(value.updatedAt)
  );
}