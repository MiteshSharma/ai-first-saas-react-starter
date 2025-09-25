/**
 * @fileoverview Workspace Store
 *
 * Zustand store for workspace state management
 */

import { create } from 'zustand';
import { WorkspaceService } from '../services/WorkspaceService';
import { TENANT_EVENTS } from '../../tenant-management/types';
import {
  Workspace,
  WorkspaceSettings,
  WorkspaceMember
} from '../../../core/types';
import {
  WorkspaceWithMembers,
  WorkspaceListFilter,
  WorkspaceRole,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WORKSPACE_EVENTS
} from '../types';

/**
 * Workspace Store State
 */
interface WorkspaceState {
  // Data
  workspaces: WorkspaceWithMembers[];
  currentWorkspace: WorkspaceWithMembers | null;
  currentTenantId: string | null;
  members: WorkspaceMember[];

  // UI State
  loading: boolean;
  error: string | null;
  filter: WorkspaceListFilter;

  // Actions
  loadWorkspaces: (tenantId: string, filter?: WorkspaceListFilter) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (tenantId: string, data: CreateWorkspacePayload) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, data: UpdateWorkspacePayload) => Promise<void>;
  updateWorkspaceSettings: (workspaceId: string, settings: Partial<WorkspaceSettings>) => Promise<void>;

  // Utility
  setFilter: (filter: Partial<WorkspaceListFilter>) => void;
  clearError: () => void;
  reset: () => void;

  // Helper methods
  getWorkspaceById: (workspaceId: string) => WorkspaceWithMembers | undefined;
  getCurrentUserRole: () => WorkspaceRole | null;
  canManageWorkspace: () => boolean;
}

let eventBus: any = null;
let coreContextSetCurrentWorkspace: ((workspace: any) => void) | null = null;

/**
 * Initial State
 */
const initialState = {
  workspaces: [],
  currentWorkspace: null,
  currentTenantId: null,
  members: [],
  loading: false,
  error: null,
  filter: {
    sortBy: 'name' as const,
    sortOrder: 'asc' as const
  }
};

/**
 * Workspace Store
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  (set, get) => ({
    ...initialState,

      // Load workspaces for a tenant
      loadWorkspaces: async (tenantId: string, filter?: WorkspaceListFilter) => {
        set({ loading: true, error: null });

        try {
          const finalFilter = { ...get().filter, ...filter };
          const workspaces = await WorkspaceService.list(tenantId, finalFilter);

          set({
            workspaces,
            currentWorkspace: workspaces[0],
            currentTenantId: tenantId,
            filter: finalFilter,
            loading: false
          });

          // Update workspace in CoreContext as well
          if (coreContextSetCurrentWorkspace) {
            try {
              coreContextSetCurrentWorkspace(workspaces[0]);
            } catch (coreError) {
              console.warn('Failed to update workspace in CoreContext:', coreError);
            }
          }

          // Emit workspace switched event
          if (eventBus) {
            eventBus.emit(WORKSPACE_EVENTS.WORKSPACE_SWITCHED, {
              workspaceId: workspaces[0].id,
              workspaceName: workspaces[0].name,
              timestamp: new Date()
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load workspaces',
            loading: false
          });
        }
      },


      // Switch workspace context
      switchWorkspace: async (workspaceId: string) => {
        set({ loading: true, error: null });

        try {
          const { workspaces } = get();
          const workspace = workspaces.find(ws => ws.id === workspaceId);

          if (!workspace) {
            throw new Error('Workspace not found');
          }

          set({ currentWorkspace: workspace });

          // Update workspace in CoreContext as well
          if (coreContextSetCurrentWorkspace) {
            try {
              coreContextSetCurrentWorkspace(workspace);
            } catch (coreError) {
              console.warn('Failed to update workspace in CoreContext:', coreError);
            }
          }

          // Emit workspace switched event
          if (eventBus) {
            eventBus.emit(WORKSPACE_EVENTS.WORKSPACE_SWITCHED, {
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              timestamp: new Date()
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to switch workspace',
            loading: false
          });
        } finally {
          set({ loading: false });
        }
      },

      // Create a new workspace
      createWorkspace: async (tenantId: string, data: CreateWorkspacePayload) => {
        set({ loading: true, error: null });

        try {
          const workspace = await WorkspaceService.create(tenantId, data);

          // Add to workspaces list
          set(state => ({
            workspaces: [...state.workspaces, workspace as WorkspaceWithMembers],
            loading: false
          }));

          return workspace;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create workspace',
            loading: false
          });
          throw error;
        }
      },

      // Update workspace
      updateWorkspace: async (workspaceId: string, data: UpdateWorkspacePayload) => {
        set({ loading: true, error: null });

        try {
          const updatedWorkspace = await WorkspaceService.update(workspaceId, data);

          set(state => ({
            workspaces: state.workspaces.map(ws =>
              ws.id === workspaceId ? { ...ws, ...updatedWorkspace } : ws
            ),
            currentWorkspace: state.currentWorkspace?.id === workspaceId
              ? { ...state.currentWorkspace, ...updatedWorkspace }
              : state.currentWorkspace,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update workspace',
            loading: false
          });
        }
      },

      // Update workspace settings
      updateWorkspaceSettings: async (workspaceId: string, settings: Partial<WorkspaceSettings>) => {
        set({ loading: true, error: null });

        try {
          await WorkspaceService.updateSettings(workspaceId, settings);

          // Update local state
          set(state => ({
            workspaces: state.workspaces.map(ws =>
              ws.id === workspaceId
                ? { ...ws, settings: { ...ws.settings, ...settings } }
                : ws
            ),
            currentWorkspace: state.currentWorkspace?.id === workspaceId
              ? { ...state.currentWorkspace, settings: { ...state.currentWorkspace.settings, ...settings } }
              : state.currentWorkspace,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update workspace settings',
            loading: false
          });
        }
      },

      // Set filter
      setFilter: (filter: Partial<WorkspaceListFilter>) => {
        set(state => ({
          filter: { ...state.filter, ...filter }
        }));
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set(initialState);
      },

      // Helper: Get workspace by ID
      getWorkspaceById: (workspaceId: string) => {
        return get().workspaces.find(ws => ws.id === workspaceId);
      },

      // Helper: Get current user role
      getCurrentUserRole: () => {
        const { currentWorkspace, members } = get();
        if (!currentWorkspace) return null;

        // In a real app, get from auth context
        const currentUserId = 'user-1';
        const member = members.find(m => m.userId === currentUserId);
        return member?.role as WorkspaceRole || null;
      },

      // Helper: Can manage workspace
      canManageWorkspace: () => {
        const role = get().getCurrentUserRole();
        return role === 'admin';
      },

  })
);

// Initialize store with event bus and CoreContext
export const initializeWorkspaceStore = (
  providedEventBus: any,
  coreSetCurrentWorkspace?: (workspace: any) => void
) => {
  eventBus = providedEventBus;
  coreContextSetCurrentWorkspace = coreSetCurrentWorkspace || null;

  // Listen for tenant switched events
  if (eventBus) {
    const unsubscribeTenantSwitched = eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, (data: { tenantId: string; tenantName: string; timestamp: Date }) => {
      console.log('Workspace plugin: Tenant switched to:', data.tenantId);

      const store = useWorkspaceStore.getState();
      // Reset workspace-related state
      store.reset();
      // Load workspaces for the new tenant
      store.loadWorkspaces(data.tenantId, store.filter);
    });

    // Listen for new simplified tenant switched events
    const unsubscribeTenantSwitch = eventBus.onTenantSwitch((data: { tenantId: string; userId: string }) => {
      console.log('Workspace plugin: Tenant switched to:', data.tenantId);

      const store = useWorkspaceStore.getState();
      // Reset workspace-related state
      store.reset();
      // Load workspaces for the new tenant
      store.loadWorkspaces(data.tenantId, store.filter);
    });

    return () => {
      unsubscribeTenantSwitched();
      unsubscribeTenantSwitch();
    };
  }

  return () => {};
};

export default useWorkspaceStore;