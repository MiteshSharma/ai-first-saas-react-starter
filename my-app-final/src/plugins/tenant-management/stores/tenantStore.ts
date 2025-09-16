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
  TenantFeatures,
  TENANT_EVENTS
} from '../types';

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
  canAccessFeature: (feature: keyof TenantFeatures) => boolean;
  getCurrentUserRole: () => TenantRole | null;
  clearError: () => void;

  // Request state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentRequest: (request: string | null) => void;
}

// Mock API functions (in real app, these would call actual API)
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 500));

const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    description: 'Main corporate tenant',
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      features: {
        userLimit: 100,
        storageLimit: 10000,
        apiCallsLimit: 50000,
        customBranding: true,
        ssoEnabled: true,
        auditLogs: true
      },
      branding: {
        primaryColor: '#1677ff',
        secondaryColor: '#f0f2f5'
      }
    },
    subscription: {
      plan: 'enterprise',
      status: 'active',
      billingCycle: 'yearly'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tenant-2',
    name: 'Startup Inc',
    slug: 'startup-inc',
    description: 'Growing startup tenant',
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      features: {
        userLimit: 25,
        storageLimit: 1000,
        apiCallsLimit: 10000,
        customBranding: false,
        ssoEnabled: false,
        auditLogs: false
      },
      branding: {
        primaryColor: '#52c41a',
        secondaryColor: '#f6ffed'
      }
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      billingCycle: 'monthly'
    },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

let eventBus: { emit: (event: string, data: unknown) => void } | null = null;

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
        const { setLoading, setError, setCurrentRequest, userTenants } = get();

        try {
          setLoading(true);
          setError(null);
          setCurrentRequest('switchTenant');

          await mockApiDelay();

          const tenant = userTenants.find(t => t.id === tenantId);
          if (!tenant) {
            throw new Error('Tenant not found');
          }

          set({ currentTenant: tenant });

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

          await mockApiDelay();

          const newTenant: Tenant = {
            id: `tenant-${Date.now()}`,
            name: data.name,
            slug: data.slug,
            description: data.description,
            settings: {
              timezone: 'UTC',
              currency: 'USD',
              language: 'en',
              features: {
                userLimit: 10,
                storageLimit: 100,
                apiCallsLimit: 1000,
                customBranding: false,
                ssoEnabled: false,
                auditLogs: false
              },
              branding: {
                primaryColor: '#1677ff',
                secondaryColor: '#f0f2f5'
              },
              ...data.settings
            },
            subscription: {
              plan: 'free',
              status: 'active',
              billingCycle: 'monthly'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

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

          await mockApiDelay();

          const tenantIndex = userTenants.findIndex(t => t.id === tenantId);
          if (tenantIndex === -1) {
            throw new Error('Tenant not found');
          }

          const existingTenant = userTenants[tenantIndex];
          const updatedTenant: Tenant = {
            ...existingTenant,
            name: data.name || existingTenant.name,
            description: data.description !== undefined ? data.description : existingTenant.description,
            settings: data.settings ? {
              ...existingTenant.settings,
              ...data.settings
            } as TenantSettings : existingTenant.settings,
            updatedAt: new Date().toISOString()
          };

          const updatedTenants = [...userTenants];
          updatedTenants[tenantIndex] = updatedTenant;
          setUserTenants(updatedTenants);

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

          await mockApiDelay();

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

          await mockApiDelay();

          // Mock tenant users data
          const mockUsers: TenantUser[] = [
            {
              id: 'user-1',
              tenantId,
              userId: 'user-1',
              role: 'owner',
              permissions: ['*'],
              joinedAt: '2024-01-01T00:00:00Z'
            }
          ];

          set({ tenantUsers: mockUsers });
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

          await mockApiDelay();

          const invitation: TenantInvitation = {
            id: `invitation-${Date.now()}`,
            tenantId,
            email,
            role,
            invitedBy: 'current-user-id',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'pending'
          };

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

          await mockApiDelay();

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

          await mockApiDelay();

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

        // For now, return true for mock data
        // In real app, check user's permissions for current tenant
        return true;
      },

      canAccessFeature: (feature: keyof TenantFeatures): boolean => {
        const { currentTenant } = get();
        if (!currentTenant) return false;

        const featureValue = currentTenant.settings.features[feature];
        return typeof featureValue === 'boolean' ? featureValue : featureValue > 0;
      },

      getCurrentUserRole: () => {
        const { currentTenant } = get();
        if (!currentTenant) return null;

        // For mock data, return 'owner'
        // In real app, find current user's role in tenant
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

// Initialize store with mock data and set up event bus
export const initializeTenantStore = (providedEventBus: { emit: (event: string, data: unknown) => void }) => {
  eventBus = providedEventBus;

  const store = useTenantStore.getState();

  // Initialize with mock tenants if none exist
  if (store.userTenants.length === 0) {
    store.setUserTenants(mockTenants);
    store.setCurrentTenant(mockTenants[0]);
  }
};