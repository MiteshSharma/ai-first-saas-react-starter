/**
 * @fileoverview Audit Service - Business Logic Layer
 *
 * Service that handles audit business logic and delegates API calls to backendHelper
 */

import {
  AuditLog,
  AuditLogParams,
  PaginatedResponse,
  AuditStats,
  AuditFilters,
} from '../types';
import { auditBackendHelper } from '../api/backendHelper';

export class AuditService {
  /**
   * Get paginated audit logs with business logic
   */
  async getAuditLogs(params: AuditLogParams = {}): Promise<PaginatedResponse<AuditLog>> {
    try {
      const result = await auditBackendHelper.getAuditLogs(params);

      // Apply any business logic transformations here
      const processedLogs = result.data.map(log => this.enrichAuditLog(log));

      return {
        ...result,
        data: processedLogs
      };
    } catch (error) {
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Get a specific audit log by ID with business logic
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const log = await auditBackendHelper.getAuditLogById(id);
      return log ? this.enrichAuditLog(log) : null;
    } catch (error) {
      throw new Error(`Failed to fetch audit log ${id}`);
    }
  }

  /**
   * Get audit statistics with business logic
   */
  async getAuditStats(filters?: AuditFilters): Promise<AuditStats> {
    try {
      const stats = await auditBackendHelper.getAuditStats(filters);

      // Apply any business logic transformations here
      return this.enrichAuditStats(stats);
    } catch (error) {
      throw new Error('Failed to fetch audit statistics');
    }
  }

  /**
   * Filter audit logs based on search criteria
   */
  filterLogs(logs: AuditLog[], filters: AuditFilters): AuditLog[] {
    let filteredLogs = [...logs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    return filteredLogs;
  }

  /**
   * Enrich audit log with business logic
   */
  private enrichAuditLog(log: AuditLog): AuditLog {
    return {
      ...log,
      // Add any computed fields or business logic here
      // For example: risk level, categorization, etc.
    };
  }

  /**
   * Enrich audit stats with business logic
   */
  private enrichAuditStats(stats: AuditStats): AuditStats {
    return {
      ...stats,
      // Add any computed stats or business logic here
      // For example: risk scores, trends, etc.
    };
  }
}

export const auditService = new AuditService();
export default auditService;