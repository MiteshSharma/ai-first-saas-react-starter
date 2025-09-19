/**
 * @fileoverview Workspace Store
 *
 * Zustand store for workspace state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WorkspaceService } from '../services/WorkspaceService';
import { eventBus } from '../../../core/plugin-system';
import { TENANT_EVENTS } from '../../tenant-management/types';
import {
  Workspace,
  WorkspaceSettings,
  WorkspaceMember
} from '../../../core/types';
import {
  WorkspaceWithMembers,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  InviteWorkspaceMemberPayload,
  WorkspaceListFilter,
  WorkspaceInvitation,
  WorkspaceActivity,
  WorkspaceStats,
  WorkspaceRole
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
  invitations: WorkspaceInvitation[];
  activities: WorkspaceActivity[];
  stats: WorkspaceStats | null;

  // UI State
  loading: boolean;
  error: string | null;
  filter: WorkspaceListFilter;

  // Actions
  loadWorkspaces: (tenantId: string, filter?: WorkspaceListFilter) => Promise<void>;
  loadWorkspace: (workspaceId: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (tenantId: string, data: CreateWorkspacePayload) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, data: UpdateWorkspacePayload) => Promise<void>;
  updateWorkspaceSettings: (workspaceId: string, settings: Partial<WorkspaceSettings>) => Promise<void>;
  archiveWorkspace: (workspaceId: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;

  // Member Management
  loadMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, data: InviteWorkspaceMemberPayload) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, memberId: string, role: WorkspaceRole) => Promise<void>;

  // Invitations
  loadInvitations: (workspaceId: string) => Promise<void>;
  cancelInvitation: (workspaceId: string, invitationId: string) => Promise<void>;

  // Activity & Stats
  loadActivity: (workspaceId: string) => Promise<void>;
  loadStats: (workspaceId: string) => Promise<void>;

  // Utility
  setFilter: (filter: Partial<WorkspaceListFilter>) => void;
  clearError: () => void;
  reset: () => void;
  initializeEventListeners: () => void;

  // Helper methods
  getWorkspaceById: (workspaceId: string) => WorkspaceWithMembers | undefined;
  getCurrentUserRole: () => WorkspaceRole | null;
  canManageWorkspace: () => boolean;
  canInviteMembers: () => boolean;
}

let coreContextSetCurrentWorkspace: ((workspace: any) => void) | null = null;

/**
 * Initial State
 */
const initialState = {
  workspaces: [],
  currentWorkspace: null,
  currentTenantId: null,
  members: [],
  invitations: [],
  activities: [],
  stats: null,
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
  devtools(
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
            eventBus.emit('WORKSPACE_SWITCHED', {
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

      // Load a specific workspace
      loadWorkspace: async (workspaceId: string) => {
        set({ loading: true, error: null });

        try {
          const workspace = await WorkspaceService.get(workspaceId);

          set({
            currentWorkspace: workspace,
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load workspace',
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
            eventBus.emit('WORKSPACE_SWITCHED', {
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

      // Archive workspace
      archiveWorkspace: async (workspaceId: string) => {
        set({ loading: true, error: null });

        try {
          await WorkspaceService.archive(workspaceId);

          // Update status to archived
          set(state => ({
            workspaces: state.workspaces.map(ws =>
              ws.id === workspaceId ? { ...ws, status: 'archived' } : ws
            ),
            currentWorkspace: state.currentWorkspace?.id === workspaceId
              ? { ...state.currentWorkspace, status: 'archived' }
              : state.currentWorkspace,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to archive workspace',
            loading: false
          });
        }
      },

      // Delete workspace
      deleteWorkspace: async (workspaceId: string) => {
        set({ loading: true, error: null });

        try {
          await WorkspaceService.delete(workspaceId);

          // Remove from workspaces list
          set(state => ({
            workspaces: state.workspaces.filter(ws => ws.id !== workspaceId),
            currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete workspace',
            loading: false
          });
        }
      },

      // Load members
      loadMembers: async (workspaceId: string) => {
        set({ loading: true, error: null });

        try {
          const members = await WorkspaceService.getMembers(workspaceId);
          set({ members, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load members',
            loading: false
          });
        }
      },

      // Invite member
      inviteMember: async (workspaceId: string, data: InviteWorkspaceMemberPayload) => {
        set({ loading: true, error: null });

        try {
          await WorkspaceService.inviteMember(workspaceId, data);

          // Reload invitations
          await get().loadInvitations(workspaceId);

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to invite member',
            loading: false
          });
        }
      },

      // Remove member
      removeMember: async (workspaceId: string, memberId: string) => {
        set({ loading: true, error: null });

        try {
          await WorkspaceService.removeMember(workspaceId, memberId);

          // Remove from members list
          set(state => ({
            members: state.members.filter(member => member.id !== memberId),
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove member',
            loading: false
          });
        }
      },

      // Update member role
      updateMemberRole: async (workspaceId: string, memberId: string, role: WorkspaceRole) => {
        set({ loading: true, error: null });

        try {
          await WorkspaceService.updateMemberRole(workspaceId, memberId, role);

          // Update member role in state
          set(state => ({
            members: state.members.map(member =>
              member.id === memberId ? { ...member, role } : member
            ),
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update member role',
            loading: false
          });
        }
      },

      // Load invitations
      loadInvitations: async (workspaceId: string) => {
        try {
          const invitations = await WorkspaceService.getInvitations(workspaceId);
          set({ invitations });
        } catch (error) {
          console.error('Failed to load invitations:', error);
        }
      },

      // Cancel invitation
      cancelInvitation: async (workspaceId: string, invitationId: string) => {
        try {
          await WorkspaceService.cancelInvitation(workspaceId, invitationId);

          // Remove from invitations list
          set(state => ({
            invitations: state.invitations.filter(inv => inv.id !== invitationId)
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to cancel invitation'
          });
        }
      },

      // Load activity
      loadActivity: async (workspaceId: string) => {
        try {
          const activities = await WorkspaceService.getActivity(workspaceId);
          set({ activities });
        } catch (error) {
          console.error('Failed to load activity:', error);
        }
      },

      // Load stats
      loadStats: async (workspaceId: string) => {
        try {
          const stats = await WorkspaceService.getStats(workspaceId);
          set({ stats });
        } catch (error) {
          console.error('Failed to load stats:', error);
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

      // Helper: Can invite members
      canInviteMembers: () => {
        const role = get().getCurrentUserRole();
        return role === 'admin' || role === 'editor';
      },

      // Initialize event listeners for tenant switching
      initializeEventListeners: () => {
        if (eventBus) {
          // Listen for tenant switched events
          eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, (data: { tenantId: string; tenantName: string; timestamp: Date }) => {
            console.log('Workspace plugin: Tenant switched to:', data.tenantId);

            // Clear current workspaces and load new ones for the switched tenant
            const currentState = get();

            // Reset workspace-related state
            set({
              workspaces: [],
              currentWorkspace: null,
              members: [],
              invitations: [],
              activities: [],
              stats: null,
              error: null
            });

            // Load workspaces for the new tenant
            currentState.loadWorkspaces(data.tenantId, currentState.filter);
          });
        }
      }
    }),
    { name: 'workspace-store' }
  )
);

// Initialize store with CoreContext
export const initializeWorkspaceStore = (
  coreSetCurrentWorkspace?: (workspace: any) => void
) => {
  coreContextSetCurrentWorkspace = coreSetCurrentWorkspace || null;

  const store = useWorkspaceStore.getState();

  // Initialize event listeners
  store.initializeEventListeners();
};

export default useWorkspaceStore;