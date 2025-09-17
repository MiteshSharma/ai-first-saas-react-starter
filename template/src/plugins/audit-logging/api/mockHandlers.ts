/**
 * @fileoverview Audit Logging Mock API Handlers
 *
 * Mock implementations for audit logging API endpoints
 */

import {
  AuditLog,
  AuditLogParams,
  PaginatedResponse,
  AuditAction,
  AuditResource,
  AuditStatus,
  AuditSeverity,
  AuditStats,
  AuditFilters,
} from '../types';

class AuditLogMockHandlers {
  private static logs: AuditLog[] = [];
  private static initialized = false;

  private static initializeLogs() {
    if (!this.initialized) {
      this.generateMockLogs(100);
      this.initialized = true;
    }
  }

  private static generateMockLogs(count: number = 100): void {
    const users = [
      { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com' },
      { id: 'user-4', name: 'Alice Johnson', email: 'alice@example.com' },
    ];

    const tenants = [
      { id: 'tenant-1', name: 'Acme Corp' },
      { id: 'tenant-2', name: 'Tech Solutions' },
      { id: 'tenant-3', name: 'Global Industries' },
    ];

    const actions = Object.values(AuditAction);
    const resources = Object.values(AuditResource);
    const statuses = Object.values(AuditStatus);
    const severities = Object.values(AuditSeverity);

    this.logs = [];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const tenant = tenants[Math.floor(Math.random() * tenants.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];

      this.logs.push({
        id: `audit-${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
        action,
        resource,
        resourceId: `${resource}-${Math.floor(Math.random() * 1000)}`,
        resourceName: `${resource.charAt(0).toUpperCase() + resource.slice(1)} ${Math.floor(Math.random() * 100)}`,
        description: `${user.name} ${action.toLowerCase().replace('_', ' ')} ${resource}`,
        metadata: {
          browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
          os: ['Windows', 'Mac', 'Linux'][Math.floor(Math.random() * 3)],
          version: '1.0.0',
        },
        changes: action === AuditAction.UPDATE ? {
          before: { status: 'active', role: 'user' },
          after: { status: 'inactive', role: 'admin' }
        } : undefined,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: {
          country: ['USA', 'UK', 'Canada', 'Australia'][Math.floor(Math.random() * 4)],
          city: ['New York', 'London', 'Toronto', 'Sydney'][Math.floor(Math.random() * 4)],
        },
        status,
        severity,
        errorMessage: status === AuditStatus.FAILURE ? 'Operation failed due to insufficient permissions' : undefined,
        duration: Math.floor(Math.random() * 1000),
        traceId: `trace-${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    this.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static async getAuditLogs(params: AuditLogParams = {}): Promise<PaginatedResponse<AuditLog>> {
    this.initializeLogs();
    await new Promise(resolve => setTimeout(resolve, 500));

    const {
      filters = {},
      page = 1,
      pageSize = 20,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = params;

    let filteredLogs = [...this.logs];

    // Apply filters
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
    }

    if (filters.status) {
      filteredLogs = filteredLogs.filter(log => log.status === filters.status);
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.userName.toLowerCase().includes(searchLower) ||
        log.userEmail.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.resourceName?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.tenantId) {
      filteredLogs = filteredLogs.filter(log => log.tenantId === filters.tenantId);
    }

    // Apply sorting
    filteredLogs.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredLogs.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  static async getAuditLogById(id: string): Promise<AuditLog | null> {
    this.initializeLogs();
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.logs.find(log => log.id === id) || null;
  }


  static async getAuditStats(filters?: AuditFilters): Promise<AuditStats> {
    this.initializeLogs();
    const response = await this.getAuditLogs({ filters, pageSize: 10000 });
    const logs = response.data;

    const successCount = logs.filter(log => log.status === AuditStatus.SUCCESS).length;
    const failureCount = logs.filter(log => log.status === AuditStatus.FAILURE).length;
    const warningCount = logs.filter(log => log.status === AuditStatus.WARNING).length;

    // Top actions
    const actionCounts = new Map<AuditAction, number>();
    logs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    });
    const topActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Top users
    const userCounts = new Map<string, { userName: string; count: number }>();
    logs.forEach(log => {
      const key = log.userId;
      const current = userCounts.get(key) || { userName: log.userName, count: 0 };
      userCounts.set(key, { ...current, count: current.count + 1 });
    });
    const topUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([userId, data]) => ({ userId, ...data }));

    const recentActivity = logs.slice(0, 10);

    return {
      totalLogs: logs.length,
      successCount,
      failureCount,
      warningCount,
      topActions,
      topUsers,
      recentActivity,
    };
  }

  static async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    this.initializeLogs();
    await new Promise(resolve => setTimeout(resolve, 200));

    const newLog: AuditLog = {
      ...log,
      id: `audit-${this.logs.length + 1}`,
      timestamp: new Date(),
    };

    this.logs.unshift(newLog);
    return newLog;
  }

  static async clearAuditLogs(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.logs = [];
  }

  static async resetMockData(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.generateMockLogs(100);
    this.initialized = true;
  }
}

export default AuditLogMockHandlers;