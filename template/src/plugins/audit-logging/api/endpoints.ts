/**
 * @fileoverview Audit Logging API Endpoints
 *
 * Centralized endpoint definitions for audit logging operations
 */

export const AUDIT_LOG_ENDPOINTS = {
  // Audit log operations (read-only)
  GET_LOGS: '/api/audit/logs',
  GET_LOG_BY_ID: '/api/audit/logs/:id',
  GET_STATS: '/api/audit/stats',
} as const;

export type AuditLogEndpoint = typeof AUDIT_LOG_ENDPOINTS[keyof typeof AUDIT_LOG_ENDPOINTS];