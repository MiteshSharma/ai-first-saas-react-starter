/**
 * @fileoverview Audit Logging Plugin Types
 *
 * Type definitions for the audit logging system
 */

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Resource operations
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',

  // Tenant operations
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_UPDATED = 'TENANT_UPDATED',
  TENANT_DELETED = 'TENANT_DELETED',
  TENANT_SWITCHED = 'TENANT_SWITCHED',

  // User management
  USER_INVITED = 'USER_INVITED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Settings
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',

  // API
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // System
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
}

export enum AuditResource {
  USER = 'user',
  TENANT = 'tenant',
  DOCUMENT = 'document',
  SETTINGS = 'settings',
  API_KEY = 'api_key',
  ROLE = 'role',
  PERMISSION = 'permission',
  NOTIFICATION = 'notification',
  REPORT = 'report',
  SYSTEM = 'system',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceName?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
  status: AuditStatus;
  severity: AuditSeverity;
  errorMessage?: string;
  duration?: number; // in milliseconds
  traceId?: string;  // for distributed tracing
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  status?: AuditStatus;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  tenantId?: string;
}

export interface AuditLogParams {
  filters?: AuditFilters;
  page?: number;
  pageSize?: number;
  sortBy?: keyof AuditLog;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


export interface AuditStats {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
  topActions: { action: AuditAction; count: number }[];
  topUsers: { userId: string; userName: string; count: number }[];
  recentActivity: AuditLog[];
}

// Event types for audit logging
export const AUDIT_EVENTS = {
  LOG_CREATED: 'audit.log.created',
  LOG_VIEWED: 'audit.log.viewed',
  FILTERS_CHANGED: 'audit.filters.changed',
} as const;

export type AuditEventType = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS];