/**
 * @fileoverview Audit Service - Simplified Implementation
 *
 * Service that handles audit API calls with mock/real backend switching
 */

import {
  AuditLog,
  AuditLogParams,
  PaginatedResponse,
  AuditStats,
  AuditFilters,
  AuditAction,
} from '../types';
import { auditBackendHelper, AuditLogApiResponse, AuditStatsApiResponse } from '../api/backendHelper';
import AuditLogMockHandlers from '../api/mockHandlers';

export class AuditService {
  private isMockMode: boolean;

  constructor() {
    // Check if mock mode is enabled
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
        const apiResponse: AuditLogApiResponse = await auditBackendHelper.getAuditLogs(params);

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
      console.error('Failed to fetch audit logs:', error);
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
        const apiResponse = await auditBackendHelper.getAuditLogById(id);
        return apiResponse ? this.transformAuditLog(apiResponse) : null;
      }
    } catch (error) {
      console.error(`Failed to fetch audit log ${id}:`, error);
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
        const apiResponse: AuditStatsApiResponse = await auditBackendHelper.getAuditStats(filters);

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
      console.error('Failed to fetch audit stats:', error);
      throw new Error('Failed to fetch audit statistics');
    }
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

export const auditService = new AuditService();
export default auditService;