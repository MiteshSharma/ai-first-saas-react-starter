/**
 * @fileoverview Audit Backend Helper - Read-only API calls
 *
 * Helper for making read-only API calls for audit logging operations
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { AUDIT_LOG_ENDPOINTS } from './endpoints';
import {
  AuditLogParams,
  AuditFilters,
  AuditLog,
} from '../types';

/**
 * API response types (as received from backend)
 */
export interface AuditLogApiResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditStatsApiResponse {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
  topActions: { action: string; count: number }[];
  topUsers: { userId: string; userName: string; count: number }[];
  recentActivity: AuditLog[];
}

/**
 * Backend helper for read-only API calls
 */
export class AuditBackendHelper {
  /**
   * Get paginated audit logs from API
   */
  async getAuditLogs(params: AuditLogParams): Promise<AuditLogApiResponse> {
    const response = await apiHelper.get<AuditLogApiResponse>(
      AUDIT_LOG_ENDPOINTS.GET_LOGS,
      { params }
    );
    return response.data;
  }

  /**
   * Get a specific audit log by ID from API
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const endpoint = AUDIT_LOG_ENDPOINTS.GET_LOG_BY_ID.replace(':id', id);
    const response = await apiHelper.get<AuditLog | null>(endpoint);
    return response.data;
  }

  /**
   * Get audit statistics from API
   */
  async getAuditStats(filters?: AuditFilters): Promise<AuditStatsApiResponse> {
    const response = await apiHelper.get<AuditStatsApiResponse>(
      AUDIT_LOG_ENDPOINTS.GET_STATS,
      { params: { filters } }
    );
    return response.data;
  }
}

export const auditBackendHelper = new AuditBackendHelper();
export default auditBackendHelper;