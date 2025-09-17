/**
 * @fileoverview Audit Store - State Management
 *
 * Zustand store for managing audit log state
 */

import { create } from 'zustand';
import { EventBus } from '../../../core/plugin-system/EventBus';
import { auditService } from '../services/AuditService';
import {
  AuditLog,
  AuditFilters,
  AuditLogParams,
  AuditStats,
  AUDIT_EVENTS,
} from '../types';

interface AuditStore {
  // State
  logs: AuditLog[];
  currentLog: AuditLog | null;
  loading: boolean;
  error: string | null;
  filters: AuditFilters;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: AuditStats | null;
  statsLoading: boolean;

  // Actions
  fetchLogs: (params?: AuditLogParams) => Promise<void>;
  fetchLogById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setFilters: (filters: Partial<AuditFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clearError: () => void;
  reset: () => void;
}

let eventBus: EventBus | null = null;

export const useAuditStore = create<AuditStore>((set, get) => ({
  // Initial state
  logs: [],
  currentLog: null,
  loading: false,
  error: null,
  filters: {},
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  stats: null,
  statsLoading: false,

  // Fetch paginated logs
  fetchLogs: async (params?: AuditLogParams) => {
    const { filters, page, pageSize } = get();

    set({ loading: true, error: null });

    try {
      const response = await auditService.getAuditLogs({
        filters,
        page,
        pageSize,
        ...params,
      });

      set({
        logs: response.data,
        total: response.total,
        totalPages: response.totalPages,
        loading: false,
      });

      // Emit event
      eventBus?.emit(AUDIT_EVENTS.LOG_VIEWED, { count: response.data.length });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
        loading: false,
      });
    }
  },

  // Fetch single log by ID
  fetchLogById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const log = await auditService.getAuditLogById(id);

      if (log) {
        set({ currentLog: log, loading: false });
        eventBus?.emit(AUDIT_EVENTS.LOG_VIEWED, { logId: id });
      } else {
        set({
          error: 'Audit log not found',
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch audit log',
        loading: false,
      });
    }
  },

  // Fetch statistics
  fetchStats: async () => {
    const { filters } = get();

    set({ statsLoading: true, error: null });

    try {
      const stats = await auditService.getAuditStats(filters);
      set({ stats, statsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
        statsLoading: false,
      });
    }
  },

  // Set filters
  setFilters: (newFilters: Partial<AuditFilters>) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };

    set({ filters: updatedFilters, page: 1 }); // Reset to first page when filters change

    // Emit event
    eventBus?.emit(AUDIT_EVENTS.FILTERS_CHANGED, updatedFilters);

    // Auto-fetch with new filters
    get().fetchLogs();
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {}, page: 1 });
    get().fetchLogs();
  },

  // Set page
  setPage: (page: number) => {
    set({ page });
    get().fetchLogs();
  },

  // Set page size
  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 }); // Reset to first page when page size changes
    get().fetchLogs();
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      logs: [],
      currentLog: null,
      loading: false,
      error: null,
      filters: {},
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      stats: null,
      statsLoading: false,
    });
  },
}));

// Initialize store with event bus
export const initializeAuditStore = (eventBusInstance: EventBus) => {
  eventBus = eventBusInstance;

  // Listen to global events and log them
  eventBus.on('core.user.logged_in', (data: unknown) => {
    // In production, this would send to server
    // eslint-disable-next-line no-console
    console.log('[Audit] Event logged: core.user.logged_in', data);
  });

  eventBus.on('core.user.logged_out', (data: unknown) => {
    // In production, this would send to server
    // eslint-disable-next-line no-console
    console.log('[Audit] Event logged: core.user.logged_out', data);
  });

  // Reset store on logout
  eventBus.on('core.user.logged_out', () => {
    useAuditStore.getState().reset();
  });
};

export default useAuditStore;