/**
 * @fileoverview Audit Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for audit logging operations following template guidelines
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { AUDIT_LOG_ENDPOINTS } from './endpoints';
import {
  AuditLogParams,
  AuditFilters,
  AuditLog,
  PaginatedResponse,
  AuditStats,
  AuditAction,
} from '../types';
import AuditLogMockHandlers from './mockHandlers';

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
 * Backend helper for API calls with mock mode support
 */
export class AuditBackendHelper {
  private isMockMode: boolean;

  constructor() {
    this.isMockMode = this.isMockModeEnabled();
  }

  /**
   * Get paginated audit logs
   */
  async getAuditLogs(params: AuditLogParams = {}): Promise<PaginatedResponse<AuditLog>> {
    try {
      if (this.isMockMode) {
        // Use mock handlers
        return await AuditLogMockHandlers.getAuditLogs(params);
      } else {
        // Use real API
        const apiResponse: AuditLogApiResponse = await this.getAuditLogsFromApi(params);

        // Transform API response to match frontend expectations
        const transformedLogs = apiResponse.data.map(log => this.transformAuditLog(log));

        return {
          data: transformedLogs,
          total: apiResponse.total,
          page: apiResponse.page,
          pageSize: apiResponse.pageSize,
          totalPages: apiResponse.totalPages,
        };
      }
    } catch (error) {
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Get a specific audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      if (this.isMockMode) {
        // Use mock handlers
        return await AuditLogMockHandlers.getAuditLogById(id);
      } else {
        // Use real API
        const apiResponse = await this.getAuditLogByIdFromApi(id);
        return apiResponse ? this.transformAuditLog(apiResponse) : null;
      }
    } catch (error) {
      throw new Error(`Failed to fetch audit log ${id}`);
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(filters?: AuditFilters): Promise<AuditStats> {
    try {
      if (this.isMockMode) {
        // Use mock handlers
        return await AuditLogMockHandlers.getAuditStats(filters);
      } else {
        // Use real API
        const apiResponse: AuditStatsApiResponse = await this.getAuditStatsFromApi(filters);

        // Transform API response to match frontend expectations
        return {
          totalLogs: apiResponse.totalLogs,
          successCount: apiResponse.successCount,
          failureCount: apiResponse.failureCount,
          warningCount: apiResponse.warningCount,
          topActions: apiResponse.topActions.map(item => ({
            action: item.action as AuditAction,
            count: item.count,
          })),
          topUsers: apiResponse.topUsers,
          recentActivity: apiResponse.recentActivity.map(log => this.transformAuditLog(log)),
        };
      }
    } catch (error) {
      throw new Error('Failed to fetch audit statistics');
    }
  }

  /**
   * Private API methods (actual HTTP calls)
   */
  private async getAuditLogsFromApi(params: AuditLogParams): Promise<AuditLogApiResponse> {
    const response = await apiHelper.get<AuditLogApiResponse>(
      AUDIT_LOG_ENDPOINTS.GET_LOGS,
      { params }
    );
    return response.data;
  }

  private async getAuditLogByIdFromApi(id: string): Promise<AuditLog | null> {
    const endpoint = AUDIT_LOG_ENDPOINTS.GET_LOG_BY_ID.replace(':id', id);
    const response = await apiHelper.get<AuditLog | null>(endpoint);
    return response.data;
  }

  private async getAuditStatsFromApi(filters?: AuditFilters): Promise<AuditStatsApiResponse> {
    const response = await apiHelper.get<AuditStatsApiResponse>(
      AUDIT_LOG_ENDPOINTS.GET_STATS,
      { params: { filters } }
    );
    return response.data;
  }

  /**
   * Check if mock mode is enabled
   */
  private isMockModeEnabled(): boolean {
    const mockFromEnv = process.env.REACT_APP_USE_MOCK_API;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Mock is enabled if:
    // 1. REACT_APP_USE_MOCK_API is explicitly set to 'true'
    // 2. No environment variable is set and we're in development mode
    if (mockFromEnv !== undefined) {
      return mockFromEnv.toLowerCase() === 'true';
    }

    // Default to mock in development if no explicit setting
    return isDevelopment;
  }

  /**
   * Transform audit log from API format to frontend format
   */
  private transformAuditLog(apiLog: AuditLog): AuditLog {
    return {
      ...apiLog,
      // Ensure timestamp is a Date object
      timestamp: typeof apiLog.timestamp === 'string' ? new Date(apiLog.timestamp) : apiLog.timestamp,
    };
  }
}

export const auditBackendHelper = new AuditBackendHelper();
export default auditBackendHelper;