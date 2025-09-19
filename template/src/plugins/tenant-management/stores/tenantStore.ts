/**
 * @fileoverview Tenant Store with Zustand
 *
 * Manages tenant state, context switching, and multi-tenancy functionality
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Tenant,
  TenantUser,
  TenantRole,
  TenantSettings,
  TenantInvitation,
  CreateTenantRequest,
  UpdateTenantRequest,
  TENANT_EVENTS
} from '../types';
import { tenantService } from '../services/tenantService';

// Base request state for consistent loading/error handling
interface RequestState {
  loading: boolean;
  error: string | null;
  currentRequest: string | null;
}

interface TenantState extends RequestState {
  // Core tenant data
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  tenantUsers: TenantUser[];
  pendingInvitations: TenantInvitation[];

  // Actions
  setCurrentTenant: (tenant: Tenant | null) => void;
  setUserTenants: (tenants: Tenant[]) => void;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (data: CreateTenantRequest) => Promise<Tenant>;
  updateTenant: (tenantId: string, data: UpdateTenantRequest) => Promise<Tenant>;
  deleteTenant: (tenantId: string) => Promise<void>;

  // User management
  loadTenantUsers: (tenantId: string) => Promise<void>;
  inviteUser: (tenantId: string, email: string, role: TenantRole) => Promise<TenantInvitation>;
  removeUser: (tenantId: string, userId: string) => Promise<void>;
  updateUserRole: (tenantId: string, userId: string, role: TenantRole) => Promise<void>;

  // Utilities
  hasPermission: (permission: string) => boolean;
  canAccessFeature: (feature: keyof TenantSettings['features']) => boolean;
  getCurrentUserRole: () => TenantRole | null;
  clearError: () => void;

  // Request state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentRequest: (request: string | null) => void;
}


let eventBus: { emit: (event: string, data: unknown) => void } | null = null;
let coreContextSetCurrentTenant: ((tenant: any) => void) | null = null;

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTenant: null,
      userTenants: [],
      tenantUsers: [],
      pendingInvitations: [],
      loading: false,
      error: null,
      currentRequest: null,

      // Basic state setters
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setUserTenants: (tenants) => set({ userTenants: tenants }),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setCurrentRequest: (currentRequest) => set({ currentRequest }),
      clearError: () => set({ error: null }),

      // Switch tenant context
      switchTenant: async (tenantId: string) => {
        const { setLoading, setError, setCurrentRequest } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('switchTenant');

          const result = await tenantService.switchTenant(tenantId);
          const tenant = result.tenant;

          set({ currentTenant: tenant });

          // Update tenant in CoreContext as well
          if (coreContextSetCurrentTenant) {
            try {
              coreContextSetCurrentTenant(tenant);
            } catch (coreError) {
              console.warn('Failed to update tenant in CoreContext:', coreError);
            }
          }

          // Emit tenant switched event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.TENANT_SWITCHED, {
              tenantId: tenant.id,
              tenantName: tenant.name,
              timestamp: new Date()
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to switch tenant';
          setError(errorMessage);
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Create new tenant
      createTenant: async (data: CreateTenantRequest) => {
        const { setLoading, setError, setCurrentRequest, userTenants, setUserTenants } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('createTenant');

          const newTenant = await tenantService.createTenant(data);

          const updatedTenants = [...userTenants, newTenant];
          setUserTenants(updatedTenants);

          // Emit tenant created event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.TENANT_CREATED, {
              tenant: newTenant,
              timestamp: new Date()
            });
          }

          return newTenant;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create tenant';
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Update tenant
      updateTenant: async (tenantId: string, data: UpdateTenantRequest) => {
        const { setLoading, setError, setCurrentRequest, userTenants, setUserTenants, currentTenant, setCurrentTenant } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('updateTenant');

          const updatedTenant = await tenantService.updateTenant(tenantId, data);

          const tenantIndex = userTenants.findIndex(t => t.id === tenantId);
          if (tenantIndex !== -1) {
            const updatedTenants = [...userTenants];
            updatedTenants[tenantIndex] = updatedTenant;
            setUserTenants(updatedTenants);
          }

          // Update current tenant if it's the one being updated
          if (currentTenant?.id === tenantId) {
            setCurrentTenant(updatedTenant);
          }

          // Emit tenant updated event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.TENANT_UPDATED, {
              tenant: updatedTenant,
              timestamp: new Date()
            });
          }

          return updatedTenant;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant';
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Delete tenant
      deleteTenant: async (tenantId: string) => {
        const { setLoading, setError, setCurrentRequest, userTenants, setUserTenants, currentTenant, setCurrentTenant } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('deleteTenant');

          await tenantService.deleteTenant(tenantId);

          const updatedTenants = userTenants.filter(t => t.id !== tenantId);
          setUserTenants(updatedTenants);

          // Clear current tenant if it's the one being deleted
          if (currentTenant?.id === tenantId) {
            setCurrentTenant(null);
          }

          // Emit tenant deleted event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.TENANT_DELETED, {
              tenantId,
              timestamp: new Date()
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Load tenant users
      loadTenantUsers: async (tenantId: string) => {
        const { setLoading, setError, setCurrentRequest } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('loadTenantUsers');

          const tenantUsers = await tenantService.getTenantMembers(tenantId);
          set({ tenantUsers });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load tenant users';
          setError(errorMessage);
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Invite user
      inviteUser: async (tenantId: string, email: string, role: TenantRole) => {
        const { setLoading, setError, setCurrentRequest } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('inviteUser');

          const invitation = await tenantService.inviteUser(tenantId, { email, role });

          // Emit user invited event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.USER_INVITED, {
              invitation,
              timestamp: new Date()
            });
          }

          return invitation;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to invite user';
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Remove user
      removeUser: async (tenantId: string, userId: string) => {
        const { setLoading, setError, setCurrentRequest } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('removeUser');

          await tenantService.removeUser(tenantId, userId);

          // Emit user removed event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.USER_REMOVED, {
              tenantId,
              userId,
              timestamp: new Date()
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove user';
          setError(errorMessage);
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Update user role
      updateUserRole: async (tenantId: string, userId: string, role: TenantRole) => {
        const { setLoading, setError, setCurrentRequest } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('updateUserRole');

          await tenantService.updateUserRole(tenantId, userId, role);

          // Emit user role updated event
          if (eventBus) {
            eventBus.emit(TENANT_EVENTS.USER_ROLE_UPDATED, {
              tenantId,
              userId,
              role,
              timestamp: new Date()
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
          setError(errorMessage);
        } finally {
          setLoading(false);
          setCurrentRequest(null);
        }
      },

      // Utility functions
      hasPermission: (permission: string) => {
        const { currentTenant } = get();
        if (!currentTenant) return false;

        // TODO: In real app, check user's permissions for current tenant
        return true;
      },

      canAccessFeature: (feature: keyof TenantSettings['features']): boolean => {
        const { currentTenant } = get();
        if (!currentTenant) return false;

        const featureValue = currentTenant.settings.features[feature];
        return typeof featureValue === 'boolean' ? featureValue : featureValue > 0;
      },

      getCurrentUserRole: () => {
        const { currentTenant } = get();
        if (!currentTenant) return null;

        // TODO: In real app, find current user's role in tenant
        return 'owner';
      }
    }),
    {
      name: 'tenant-store',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        userTenants: state.userTenants
      })
    }
  )
);

// Initialize store and set up event bus
export const initializeTenantStore = (
  providedEventBus: { emit: (event: string, data: unknown) => void },
  coreSetCurrentTenant?: (tenant: any) => void
) => {
  eventBus = providedEventBus;
  coreContextSetCurrentTenant = coreSetCurrentTenant || null;

  const store = useTenantStore.getState();

  // Load user tenants from API
  tenantService.getUserTenants()
    .then(tenants => {
      store.setUserTenants(tenants);
      if (tenants.length > 0 && !store.currentTenant) {
        store.switchTenant(tenants[0].id);
      }
    })
    .catch(error => {
      console.error('Failed to load user tenants:', error);
      store.setError('Failed to load tenants');
    });
};