/**
 * @fileoverview User Management Store with Zustand
 *
 * Manages user management state including user profiles and preferences
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  UserManagementState,
  UserManagementActions,
  UserWithTenantInfo,
  UserSearchFilters,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  UserPreferences,
  UserPermissions,
  USER_MANAGEMENT_EVENTS,
} from '../types';
import { TENANT_EVENTS } from '../../tenant-management/types';
import { AUDIT_PLUGIN_EVENTS, AUDIT_ACTIONS } from '../../../events';
import UserService from '../services/UserService';

let eventBus: any = null;

declare global {
  interface Window {
    eventBus?: {
      emit: (event: string, data: any) => void;
    };
  }
}


interface UserManagementStoreState extends UserManagementState, UserManagementActions {
  // Internal helper methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUsersLoading: (loading: boolean) => void;
  setUsersError: (error: string | null) => void;
}

/**
 * User Management Store
 *
 * Central state management for all user management functionality including:
 * - User list management with filtering and search
 * - User profile and preferences
 * - Security settings
 */
export const useUserManagementStore = create<UserManagementStoreState>()(
  devtools(
    (set, get) => ({
      // ============================================================================
      // Initial State
      // ============================================================================

      // Current user data
      currentUser: null,
      userPreferences: null,
      securitySettings: null,
      userPermissions: null,

      // User list data
      users: [],
      userFilters: {},
      usersLoading: false,
      usersError: null,

      // UI state
      selectedUser: null,

      // Loading states
      isUpdatingProfile: false,
      isUpdatingPreferences: false,

      // ============================================================================
      // Internal Helper Methods
      // ============================================================================

      setLoading: (loading: boolean) => set({ isUpdatingProfile: loading }),
      setError: (error: string | null) => set({ usersError: error }),
      setUsersLoading: (loading: boolean) => set({ usersLoading: loading }),
      setUsersError: (error: string | null) => set({ usersError: error }),

      // ============================================================================
      // User List Actions
      // ============================================================================

      fetchUsers: async (filters?: UserSearchFilters) => {
        const { setUsersLoading, setUsersError } = get();
        setUsersLoading(true);
        setUsersError(null);

        try {
          // Get current tenant from context or store
          const tenantId = 'tenant-1'; // This should come from tenant context

          const response = await UserService.getUsers(tenantId, filters);

          set({
            users: response.users,
            userFilters: filters || {},
            usersLoading: false,
          });

          // Emit event for successful fetch
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(AUDIT_PLUGIN_EVENTS.AUDIT_EVENT, {
              action: AUDIT_ACTIONS.USERS_FETCHED,
              count: response.users.length,
              filters,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
          setUsersError(errorMessage);
          setUsersLoading(false);
        }
      },

      updateUserFilters: (filters: Partial<UserSearchFilters>) => {
        const currentFilters = get().userFilters;
        const updatedFilters = { ...currentFilters, ...filters };

        set({ userFilters: updatedFilters });

        // Fetch users with new filters
        get().fetchUsers(updatedFilters);
      },

      selectUser: (user: UserWithTenantInfo | null) => {
        set({ selectedUser: user });
      },


      // ============================================================================
      // User Profile Actions
      // ============================================================================

      updateProfile: async (data: UpdateUserProfileRequest) => {
        set({ isUpdatingProfile: true });

        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            throw new Error('No current user found');
          }

          await UserService.updateProfile(currentUser.id, data);

          // Update local state
          const updatedUser = {
            ...currentUser,
            profile: { ...currentUser.profile, ...data },
            updatedAt: new Date().toISOString(),
          };

          set({
            currentUser: updatedUser,
            isUpdatingProfile: false,
          });

          // Emit event for successful profile update
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.USER_PROFILE_UPDATED, {
              userId: currentUser.id,
              updatedFields: Object.keys(data),
            });
          }
        } catch (error) {
          set({ isUpdatingProfile: false });
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
          get().setError(errorMessage);
          throw error;
        }
      },


      // ============================================================================
      // User Preferences Actions
      // ============================================================================

      updatePreferences: async (data: UpdateUserPreferencesRequest) => {
        set({ isUpdatingPreferences: true });

        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            throw new Error('No current user found');
          }

          await UserService.updatePreferences(currentUser.id, data);

          // Update local state
          const currentPreferences = get().userPreferences || {
            theme: 'light' as const,
            language: 'en-US',
            timezone: 'America/New_York',
            notifications: {
              email: { invitations: true, updates: true, security: true, marketing: false },
              inApp: { mentions: true, updates: true, security: true }
            },
            dashboard: { layout: 'grid' as const, widgets: [] }
          };
          const updatedPreferences: UserPreferences = {
            theme: data.theme ?? currentPreferences.theme,
            language: data.language ?? currentPreferences.language,
            timezone: data.timezone ?? currentPreferences.timezone,
            notifications: data.notifications
              ? {
                  email: { ...currentPreferences.notifications.email, ...data.notifications.email },
                  inApp: { ...currentPreferences.notifications.inApp, ...data.notifications.inApp }
                }
              : currentPreferences.notifications,
            dashboard: data.dashboard
              ? { ...currentPreferences.dashboard, ...data.dashboard }
              : currentPreferences.dashboard
          };

          set({
            userPreferences: updatedPreferences,
            isUpdatingPreferences: false,
          });

          // Emit event for successful preferences update
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.USER_PREFERENCES_UPDATED, {
              userId: currentUser.id,
              updatedFields: Object.keys(data),
            });
          }
        } catch (error) {
          set({ isUpdatingPreferences: false });
          const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
          get().setError(errorMessage);
          throw error;
        }
      },




      // ============================================================================
      // Utility Actions
      // ============================================================================

      clearErrors: () => {
        set({
          usersError: null,
        });
      },

      reset: () => {
        set({
          currentUser: null,
          userPreferences: null,
          userPermissions: null,
          users: [],
          userFilters: {},
          usersLoading: false,
          usersError: null,
          selectedUser: null,
          isUpdatingProfile: false,
          isUpdatingPreferences: false,
        });
      },
    }),
    {
      name: 'user-management-store',
      partialize: (state: UserManagementStoreState) => ({
        // Persist only non-sensitive state
        userFilters: state.userFilters,
      }),
    }
  )
);

// Export typed selectors for better performance
export const useUserManagementActions = () => useUserManagementStore((state) => ({
  fetchUsers: state.fetchUsers,
  updateUserFilters: state.updateUserFilters,
  selectUser: state.selectUser,
  updateProfile: state.updateProfile,
  updatePreferences: state.updatePreferences,
  clearErrors: state.clearErrors,
  reset: state.reset,
}));

export const useUserManagementData = () => useUserManagementStore((state) => ({
  currentUser: state.currentUser,
  userPreferences: state.userPreferences,
  userPermissions: state.userPermissions,
  users: state.users,
  userFilters: state.userFilters,
  usersLoading: state.usersLoading,
  usersError: state.usersError,
  selectedUser: state.selectedUser,
  isUpdatingProfile: state.isUpdatingProfile,
  isUpdatingPreferences: state.isUpdatingPreferences,
}));

// Initialize store and set up event bus
export const initializeUserManagementStore = (providedEventBus: any) => {
  eventBus = providedEventBus;

  const store = useUserManagementStore.getState();

  // Listen to AUTH_SUCCESS events to load user data
  const unsubscribeAuthSuccess = eventBus.onAuthSuccess(({ userId }: { userId: string }) => {
    // Load user profile data when authentication is successful
    UserService.getUser(userId)
      .then(userProfile => {
        // Set the current user in the store
        useUserManagementStore.setState({ currentUser: userProfile });
      })
      .catch(error => {
        console.error('Failed to load user profile:', error);
        store.setError('Failed to load user profile');
      });

    // Load user preferences
    UserService.getPreferences(userId)
      .then(preferences => {
        useUserManagementStore.setState({ userPreferences: preferences });
      })
      .catch(error => {
        console.error('Failed to load user preferences:', error);
      });

  });

  // Listen to USER_PERMISSIONS_LOADED events from tenant management
  const unsubscribePermissions = eventBus.on(
    TENANT_EVENTS.USER_PERMISSIONS_LOADED,
    ({ userId, tenantId, tenantRole, workspaces }: any) => {
      console.log('[User Store] Received USER_PERMISSIONS_LOADED event:', {
        userId,
        tenantId,
        tenantRole,
        workspaceCount: workspaces?.length || 0
      });

      // Get tenant name from tenant context or store (we'll use a placeholder for now)
      const tenantName = `Tenant ${tenantId}`;

      // Update user permissions in the store
      const userPermissions: UserPermissions = {
        userId,
        tenantId,
        tenantName,
        tenantRole,
        workspaces: workspaces || []
      };

      useUserManagementStore.setState({ userPermissions });
    }
  );

  // Return cleanup function
  return () => {
    unsubscribeAuthSuccess();
    unsubscribePermissions();
  };
};