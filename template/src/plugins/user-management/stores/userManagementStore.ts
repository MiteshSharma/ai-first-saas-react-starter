/**
 * @fileoverview User Management Store with Zustand
 *
 * Manages user management state including users, invitations, preferences, and security settings
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  UserManagementState,
  UserManagementActions,
  UserWithTenantInfo,
  UserSearchFilters,
  Invitation,
  SendInvitationRequest,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  UpdateSecuritySettingsRequest,
  UserPreferences,
  SecuritySettings,
  UploadAvatarResponse,
  USER_MANAGEMENT_EVENTS,
} from '../types';
import InvitationService from '../services/InvitationService';
import UserService from '../services/UserService';

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
  setInvitationsLoading: (loading: boolean) => void;
  setInvitationsError: (error: string | null) => void;
}

/**
 * User Management Store
 *
 * Central state management for all user management functionality including:
 * - User list management with filtering and search
 * - Invitation management
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

      // User list data
      users: [],
      userFilters: {},
      usersLoading: false,
      usersError: null,

      // Invitation data
      invitations: [],
      invitationsLoading: false,
      invitationsError: null,

      // UI state
      showInviteModal: false,
      selectedUser: null,

      // Loading states
      isUpdatingProfile: false,
      isUpdatingPreferences: false,
      isUpdatingSecuritySettings: false,
      isUploadingAvatar: false,

      // ============================================================================
      // Internal Helper Methods
      // ============================================================================

      setLoading: (loading: boolean) => set({ isUpdatingProfile: loading }),
      setError: (error: string | null) => set({ usersError: error }),
      setUsersLoading: (loading: boolean) => set({ usersLoading: loading }),
      setUsersError: (error: string | null) => set({ usersError: error }),
      setInvitationsLoading: (loading: boolean) => set({ invitationsLoading: loading }),
      setInvitationsError: (error: string | null) => set({ invitationsError: error }),

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
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.USER_UPDATED, {
              action: 'users.fetched',
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
      // Invitation Actions
      // ============================================================================

      fetchInvitations: async (tenantId: string) => {
        const { setInvitationsLoading, setInvitationsError } = get();
        setInvitationsLoading(true);
        setInvitationsError(null);

        try {
          const response = await InvitationService.listInvitations(tenantId);

          set({
            invitations: response.invitations,
            invitationsLoading: false,
          });

          // Emit event for successful fetch
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.INVITATION_SENT, {
              action: 'invitations.fetched',
              count: response.invitations.length,
              tenantId,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invitations';
          setInvitationsError(errorMessage);
          setInvitationsLoading(false);
        }
      },

      sendInvitations: async (data: SendInvitationRequest): Promise<Invitation[]> => {
        const { setInvitationsLoading, setInvitationsError } = get();
        setInvitationsLoading(true);
        setInvitationsError(null);

        try {
          const newInvitations = await InvitationService.sendInvitation(data);

          // Update local state with new invitations
          const currentInvitations = get().invitations;
          set({
            invitations: [...currentInvitations, ...newInvitations],
            invitationsLoading: false,
            showInviteModal: false,
          });

          // Emit event for successful invitation sending
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.INVITATION_SENT, {
              emails: data.emails,
              tenantId: data.tenantId,
              orgRole: data.orgRole,
              count: newInvitations.length,
            });
          }

          return newInvitations;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send invitations';
          setInvitationsError(errorMessage);
          setInvitationsLoading(false);
          throw error;
        }
      },

      cancelInvitation: async (invitationId: string) => {
        try {
          await InvitationService.cancelInvitation(invitationId);

          // Update local state
          const currentInvitations = get().invitations;
          const updatedInvitations = currentInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
          );

          set({ invitations: updatedInvitations });

          // Emit event for successful cancellation
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.INVITATION_CANCELLED, {
              invitationId,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cancel invitation';
          get().setInvitationsError(errorMessage);
          throw error;
        }
      },

      resendInvitation: async (invitationId: string) => {
        try {
          await InvitationService.resendInvitation(invitationId);

          // Update local state
          const currentInvitations = get().invitations;
          const updatedInvitations = currentInvitations.map(inv =>
            inv.id === invitationId
              ? {
                  ...inv,
                  status: 'pending' as const,
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }
              : inv
          );

          set({ invitations: updatedInvitations });

          // Emit event for successful resend
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.INVITATION_SENT, {
              action: 'invitation.resent',
              invitationId,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to resend invitation';
          get().setInvitationsError(errorMessage);
          throw error;
        }
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

      uploadAvatar: async (file: File): Promise<UploadAvatarResponse> => {
        set({ isUploadingAvatar: true });

        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            throw new Error('No current user found');
          }

          const response = await UserService.uploadAvatar(currentUser.id, file);

          // Update local state
          const updatedUser = {
            ...currentUser,
            profile: { ...currentUser.profile, avatar: response.avatarUrl },
            updatedAt: new Date().toISOString(),
          };

          set({
            currentUser: updatedUser,
            isUploadingAvatar: false,
          });

          // Emit event for successful avatar upload
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.AVATAR_UPLOADED, {
              userId: currentUser.id,
              avatarUrl: response.avatarUrl,
            });
          }

          return response;
        } catch (error) {
          set({ isUploadingAvatar: false });
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
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
      // Security Settings Actions
      // ============================================================================

      updateSecuritySettings: async (data: UpdateSecuritySettingsRequest) => {
        set({ isUpdatingSecuritySettings: true });

        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            throw new Error('No current user found');
          }

          await UserService.updateSecuritySettings(currentUser.id, data);

          // Update local state
          const currentSettings = get().securitySettings || {
            twoFactorEnabled: false,
            sessionTimeout: 60,
            trustedDevices: []
          };
          const updatedSettings: SecuritySettings = {
            twoFactorEnabled: data.twoFactorEnabled ?? currentSettings.twoFactorEnabled,
            sessionTimeout: data.sessionTimeout ?? currentSettings.sessionTimeout,
            lastPasswordChange: currentSettings.lastPasswordChange,
            trustedDevices: currentSettings.trustedDevices
          };

          set({
            securitySettings: updatedSettings,
            isUpdatingSecuritySettings: false,
          });

          // Emit event for successful security settings update
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(USER_MANAGEMENT_EVENTS.USER_SECURITY_UPDATED, {
              userId: currentUser.id,
              updatedFields: Object.keys(data),
            });
          }
        } catch (error) {
          set({ isUpdatingSecuritySettings: false });
          const errorMessage = error instanceof Error ? error.message : 'Failed to update security settings';
          get().setError(errorMessage);
          throw error;
        }
      },

      enableTwoFactor: async (): Promise<{ qrCode: string; backupCodes: string[] }> => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            throw new Error('No current user found');
          }

          const response = await UserService.enableTwoFactor(currentUser.id);

          // Update local state
          const currentSettings = get().securitySettings || {
            twoFactorEnabled: false,
            sessionTimeout: 60,
            trustedDevices: []
          };
          const updatedSettings: SecuritySettings = {
            ...currentSettings,
            twoFactorEnabled: true
          };

          set({ securitySettings: updatedSettings });

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to enable two-factor authentication';
          get().setError(errorMessage);
          throw error;
        }
      },

      disableTwoFactor: async () => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            throw new Error('No current user found');
          }

          await UserService.disableTwoFactor(currentUser.id);

          // Update local state
          const currentSettings = get().securitySettings || {
            twoFactorEnabled: false,
            sessionTimeout: 60,
            trustedDevices: []
          };
          const updatedSettings: SecuritySettings = {
            ...currentSettings,
            twoFactorEnabled: false
          };

          set({ securitySettings: updatedSettings });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to disable two-factor authentication';
          get().setError(errorMessage);
          throw error;
        }
      },

      // ============================================================================
      // UI Actions
      // ============================================================================

      setShowInviteModal: (show: boolean) => {
        set({ showInviteModal: show });
      },

      // ============================================================================
      // Utility Actions
      // ============================================================================

      clearErrors: () => {
        set({
          usersError: null,
          invitationsError: null,
        });
      },

      reset: () => {
        set({
          currentUser: null,
          userPreferences: null,
          securitySettings: null,
          users: [],
          userFilters: {},
          usersLoading: false,
          usersError: null,
          invitations: [],
          invitationsLoading: false,
          invitationsError: null,
          showInviteModal: false,
          selectedUser: null,
          isUpdatingProfile: false,
          isUpdatingPreferences: false,
          isUpdatingSecuritySettings: false,
          isUploadingAvatar: false,
        });
      },
    }),
    {
      name: 'user-management-store',
      partialize: (state: UserManagementStoreState) => ({
        // Persist only non-sensitive state
        userFilters: state.userFilters,
        showInviteModal: state.showInviteModal,
      }),
    }
  )
);

// Export typed selectors for better performance
export const useUserManagementActions = () => useUserManagementStore((state) => ({
  fetchUsers: state.fetchUsers,
  updateUserFilters: state.updateUserFilters,
  selectUser: state.selectUser,
  fetchInvitations: state.fetchInvitations,
  sendInvitations: state.sendInvitations,
  cancelInvitation: state.cancelInvitation,
  resendInvitation: state.resendInvitation,
  uploadAvatar: state.uploadAvatar,
  updatePreferences: state.updatePreferences,
  updateSecuritySettings: state.updateSecuritySettings,
  setShowInviteModal: state.setShowInviteModal,
  clearErrors: state.clearErrors,
  reset: state.reset,
}));

export const useUserManagementData = () => useUserManagementStore((state) => ({
  currentUser: state.currentUser,
  userPreferences: state.userPreferences,
  securitySettings: state.securitySettings,
  users: state.users,
  userFilters: state.userFilters,
  usersLoading: state.usersLoading,
  usersError: state.usersError,
  invitations: state.invitations,
  invitationsLoading: state.invitationsLoading,
  invitationsError: state.invitationsError,
  showInviteModal: state.showInviteModal,
  selectedUser: state.selectedUser,
  isUpdatingProfile: state.isUpdatingProfile,
  isUpdatingPreferences: state.isUpdatingPreferences,
  isUpdatingSecuritySettings: state.isUpdatingSecuritySettings,
  isUploadingAvatar: state.isUploadingAvatar,
}));