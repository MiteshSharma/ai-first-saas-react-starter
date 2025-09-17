/**
 * @fileoverview Audit Logging API Endpoints
 *
 * Centralized endpoint definitions for audit logging operations
 */

export const AUDIT_LOG_ENDPOINTS = {
  // Audit log operations
  GET_LOGS: '/api/audit/logs',
  GET_LOG_BY_ID: '/api/audit/logs/:id',
  EXPORT_LOGS: '/api/audit/logs/export',
  GET_STATS: '/api/audit/stats',
  CREATE_LOG: '/api/audit/logs',
  CLEAR_LOGS: '/api/audit/logs/clear',
  RESET_MOCK: '/api/audit/logs/reset',
} as const;

export type AuditLogEndpoint = typeof AUDIT_LOG_ENDPOINTS[keyof typeof AUDIT_LOG_ENDPOINTS];