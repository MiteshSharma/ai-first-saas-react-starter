import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  getTenants,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTenant,
  postTenant,
  putTenant,
  getTenantMembers,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postTenantMemberInvite,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  putTenantMemberRole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteTenantMember,
  getWorkspaces,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getWorkspace,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postWorkspace,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  putWorkspace,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteWorkspace
} from '../../api/backendHelper';
import apiHelper from '../../api/apiHelper';
import { eventBus } from '../../plugins/EventBus';
import { TENANT_EVENTS, type TenantSwitchPayload, type WorkspaceSwitchPayload } from '../../plugins/coreEvents';
import { setItem, removeItem } from '../../utils/localStorage';
import type { AppError } from '../base';import type {
  TenantState,
  TenantActions,
  Tenant,
  TenantMember,
  TenantInvite,
  Workspace,

  CreateTenantPayload,
  UpdateTenantPayload,
  InviteMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload
} from './types';
import { TenantRequestType, TenantRole } from './types';

interface TenantStore extends TenantState, TenantActions {
  // Computed values
  isCurrentTenantOwner: boolean;
  currentTenantRole: TenantRole | null;
}

/**
 * @store useTenantStore
 * @description Zustand store for multi-tenant state management
 */
export const useTenantStore = create<TenantStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tenants: [],
        currentTenant: null,
        tenantMembers: [],
        tenantInvites: [],
        workspaces: [],
        currentWorkspace: null,
        loading: false,
        error: null,
        currentRequest: null,

        // Computed values
        get isCurrentTenantOwner() {
          const state = get();
          const currentUserRole = state.currentTenantRole;
          return currentUserRole === TenantRole.OWNER;
        },

        get currentTenantRole() {
          const state = get();
          if (!state.currentTenant) return null;
          
          // This would typically come from user's membership in the tenant
          // For now, we'll implement a simple lookup
          const membership = state.tenantMembers.find(
            member => member.tenantId === state.currentTenant?.id
          );
          return membership?.role || null;
        },

        // Standard request lifecycle methods
        resetRequestState: () => {
          set({ loading: false, error: null, currentRequest: null });
        },

        setLoading: (loading: boolean, requestType?: TenantRequestType) => {
          set({ loading, currentRequest: requestType || null, error: null });
        },

        setError: (error: AppError | null) => {
          set({ error, loading: false, currentRequest: null });
        },

        // Tenant management actions
        fetchTenants: async (): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.FETCH_TENANTS);

          try {
            const response = await getTenants();
            const tenants = response.data as Tenant[];
            
            set({ 
              tenants, 
              loading: false, 
              currentRequest: null,
              error: null 
            });

            // Set first tenant as current if none is selected
            const currentTenant = get().currentTenant;
            if (!currentTenant && tenants.length > 0) {
              get().setCurrentTenant(tenants[0]);
            }
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to fetch tenants',
              code: err.response?.data?.code
            });
          }
        },

        setCurrentTenant: (tenant: Tenant | null) => {
          const previousTenant = get().currentTenant;
          set({ currentTenant: tenant, currentWorkspace: null });

          if (tenant) {
            setItem('currentTenantId', tenant.id);
            apiHelper.setCurrentTenant(tenant.id);

            // Emit tenant switch event for plugins
            const tenantSwitchPayload: TenantSwitchPayload = {
              oldTenantId: previousTenant?.id,
              newTenantId: tenant.id,
              oldTenant: previousTenant,
              newTenant: tenant
            };
            eventBus.emit(TENANT_EVENTS.TENANT_SWITCHED, tenantSwitchPayload, 'TenantStore');

            // Fetch workspaces for the new tenant
            get().fetchWorkspaces(tenant.id);
          } else {
            removeItem('currentTenantId');
            apiHelper.clearCurrentTenant();
          }
        },

        switchTenant: async (tenantId: string): Promise<void> => {
          const { setLoading, setError, tenants } = get();
          setLoading(true, TenantRequestType.SWITCH_TENANT);

          try {
            const tenant = tenants.find(t => t.id === tenantId);
            if (!tenant) {
              throw new Error(`Tenant with ID ${tenantId} not found`);
            }

            get().setCurrentTenant(tenant);
            
            set({ loading: false, currentRequest: null, error: null });
          } catch (error: unknown) {
            const err = error as { message?: string; code?: string };
            setError({
              message: err.message || 'Failed to switch tenant',
              code: err.code
            });
          }
        },

        createTenant: async (data: CreateTenantPayload): Promise<Tenant> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.CREATE_TENANT);

          try {
            const response = await postTenant(data);
            const newTenant = response.data as Tenant;
            
            set(state => ({ 
              tenants: [...state.tenants, newTenant],
              loading: false, 
              currentRequest: null,
              error: null 
            }));

            return newTenant;
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to create tenant',
              code: err.response?.data?.code
            });
            throw error;
          }
        },

        updateTenant: async (tenantId: string, data: UpdateTenantPayload): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.UPDATE_TENANT);

          try {
            const response = await putTenant({ 'tenant-id': tenantId }, data);
            const updatedTenant = response.data as Tenant;
            
            set(state => ({
              tenants: state.tenants.map(t => t.id === tenantId ? updatedTenant : t),
              currentTenant: state.currentTenant?.id === tenantId ? updatedTenant : state.currentTenant,
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to update tenant',
              code: err.response?.data?.code
            });
          }
        },

        // Member management actions
        fetchTenantMembers: async (tenantId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.FETCH_MEMBERS);

          try {
            const response = await getTenantMembers({ 'tenant-id': tenantId });
            set({
              tenantMembers: response.data as TenantMember[], 
              loading: false, 
              currentRequest: null,
              error: null 
            });
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to fetch tenant members',
              code: err.response?.data?.code
            });
          }
        },

        inviteMember: async (tenantId: string, data: InviteMemberPayload): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.INVITE_MEMBER);

          try {
            const response = await apiHelper.post(`/tenants/${tenantId}/invites`, data);
            const newInvite = response.data as TenantInvite;
            
            set(state => ({ 
              tenantInvites: [...state.tenantInvites, newInvite],
              loading: false, 
              currentRequest: null,
              error: null 
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to invite member',
              code: err.response?.data?.code
            });
          }
        },

        updateMemberRole: async (memberId: string, role: TenantRole): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.UPDATE_MEMBER);

          try {
            const response = await apiHelper.put(`/tenant-members/${memberId}`, { role });
            const updatedMember = response.data as TenantMember;
            
            set(state => ({
              tenantMembers: state.tenantMembers.map(m => m.id === memberId ? updatedMember : m),
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to update member role',
              code: err.response?.data?.code
            });
          }
        },

        removeMember: async (memberId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.REMOVE_MEMBER);

          try {
            await apiHelper.delete(`/tenant-members/${memberId}`);
            
            set(state => ({
              tenantMembers: state.tenantMembers.filter(m => m.id !== memberId),
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to remove member',
              code: err.response?.data?.code
            });
          }
        },

        // Invite management actions
        fetchTenantInvites: async (tenantId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.FETCH_INVITES);

          try {
            const response = await apiHelper.get(`/tenants/${tenantId}/invites`);
            set({
              tenantInvites: response.data as TenantInvite[], 
              loading: false, 
              currentRequest: null,
              error: null 
            });
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to fetch tenant invites',
              code: err.response?.data?.code
            });
          }
        },

        revokeInvite: async (inviteId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.REVOKE_INVITE);

          try {
            await apiHelper.delete(`/tenant-invites/${inviteId}`);
            
            set(state => ({
              tenantInvites: state.tenantInvites.filter(i => i.id !== inviteId),
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to revoke invite',
              code: err.response?.data?.code
            });
          }
        },

        resendInvite: async (inviteId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.RESEND_INVITE);

          try {
            const response = await apiHelper.post(`/tenant-invites/${inviteId}/resend`);
            const updatedInvite = response.data as TenantInvite;
            
            set(state => ({
              tenantInvites: state.tenantInvites.map(i => i.id === inviteId ? updatedInvite : i),
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to resend invite',
              code: err.response?.data?.code
            });
          }
        },

        // Workspace management actions
        fetchWorkspaces: async (tenantId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.FETCH_WORKSPACES);

          try {
            const response = await getWorkspaces({ 'tenant-id': tenantId });
            const workspaces = response.data as Workspace[];
            
            set({ 
              workspaces, 
              loading: false, 
              currentRequest: null,
              error: null 
            });

            // Set first workspace as current if none is selected
            const currentWorkspace = get().currentWorkspace;
            if (!currentWorkspace && workspaces.length > 0) {
              get().setCurrentWorkspace(workspaces[0]);
            }
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to fetch workspaces',
              code: err.response?.data?.code
            });
          }
        },

        setCurrentWorkspace: (workspace: Workspace | null) => {
          const previousWorkspace = get().currentWorkspace;
          const currentTenant = get().currentTenant;
          set({ currentWorkspace: workspace });

          if (workspace && currentTenant) {
            setItem('currentWorkspaceId', workspace.id);

            // Emit workspace switch event for plugins
            const workspaceSwitchPayload: WorkspaceSwitchPayload = {
              oldWorkspaceId: previousWorkspace?.id,
              newWorkspaceId: workspace.id,
              oldWorkspace: previousWorkspace,
              newWorkspace: workspace
            };
            eventBus.emit(TENANT_EVENTS.WORKSPACE_SWITCHED, workspaceSwitchPayload, 'TenantStore');
          } else {
            removeItem('currentWorkspaceId');
          }
        },

        createWorkspace: async (tenantId: string, data: CreateWorkspacePayload): Promise<Workspace> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.CREATE_WORKSPACE);

          try {
            const response = await apiHelper.post(`/tenants/${tenantId}/workspaces`, data);
            const newWorkspace = response.data as Workspace;
            
            set(state => ({ 
              workspaces: [...state.workspaces, newWorkspace],
              loading: false, 
              currentRequest: null,
              error: null 
            }));

            return newWorkspace;
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to create workspace',
              code: err.response?.data?.code
            });
            throw error;
          }
        },

        updateWorkspace: async (workspaceId: string, data: UpdateWorkspacePayload): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.UPDATE_WORKSPACE);

          try {
            const response = await apiHelper.put(`/workspaces/${workspaceId}`, data);
            const updatedWorkspace = response.data as Workspace;
            
            set(state => ({
              workspaces: state.workspaces.map(w => w.id === workspaceId ? updatedWorkspace : w),
              currentWorkspace: state.currentWorkspace?.id === workspaceId ? updatedWorkspace : state.currentWorkspace,
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to update workspace',
              code: err.response?.data?.code
            });
          }
        },

        deleteWorkspace: async (workspaceId: string): Promise<void> => {
          const { setLoading, setError } = get();
          setLoading(true, TenantRequestType.DELETE_WORKSPACE);

          try {
            await apiHelper.delete(`/workspaces/${workspaceId}`);
            
            set(state => ({
              workspaces: state.workspaces.filter(w => w.id !== workspaceId),
              currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace,
              loading: false,
              currentRequest: null,
              error: null
            }));
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; code?: string } } };
            setError({
              message: err.response?.data?.message || 'Failed to delete workspace',
              code: err.response?.data?.code
            });
          }
        }
      }),
      {
        name: 'tenant-store',
        partialize: (state) => ({ 
          currentTenant: state.currentTenant,
          currentWorkspace: state.currentWorkspace,
          tenants: state.tenants 
        })
      }
    ),
    { name: 'tenant-store' }
  )
);

export default useTenantStore;