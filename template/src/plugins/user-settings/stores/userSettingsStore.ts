/**
 * @fileoverview User Settings Store - State Management
 *
 * Zustand store for managing user settings and profile state
 */

import { create } from 'zustand';
import { EventBus } from '../../../core/plugin-system/EventBus';
import { userSettingsService } from '../services/userSettingsService';
import {
  UserProfile,
  UserProfileResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  SecuritySettings,
  NotificationPreferences,
  USER_SETTINGS_EVENTS,
} from '../types';

interface UserSettingsStore {
  // State
  profile: UserProfile | null;
  security: SecuritySettings | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Profile actions
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdateRequest) => Promise<boolean>;
  changePassword: (request: PasswordChangeRequest) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;

  // Security actions
  enableTwoFactor: () => Promise<{ qrCode: string; secret: string } | null>;
  disableTwoFactor: () => Promise<boolean>;
  terminateSession: (sessionId: string) => Promise<boolean>;
  removeTrustedDevice: (deviceId: string) => Promise<boolean>;

  // Preferences actions
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => Promise<boolean>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

let eventBus: EventBus | null = null;

export const useUserSettingsStore = create<UserSettingsStore>((set, get) => ({
  // Initial state
  profile: null,
  security: null,
  preferences: null,
  loading: false,
  saving: false,
  error: null,

  // Fetch user profile and settings
  fetchProfile: async () => {
    set({ loading: true, error: null });

    try {
      const response = await userSettingsService.getUserProfile();

      if (response.success && response.data) {
        set({
          profile: response.data.user,
          security: response.data.security,
          preferences: response.data.preferences,
          loading: false,
        });
      } else {
        set({
          error: response.error || 'Failed to fetch profile',
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        loading: false,
      });
    }
  },

  // Update user profile
  updateProfile: async (updates: ProfileUpdateRequest) => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.updateProfile(updates);

      if (response.success && response.data) {
        set({
          profile: response.data,
          saving: false,
        });

        // Emit profile updated event
        eventBus?.emit(USER_SETTINGS_EVENTS.PROFILE_UPDATED, {
          profile: response.data,
          updates,
        });

        return true;
      } else {
        set({
          error: response.error || 'Failed to update profile',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update profile',
        saving: false,
      });
      return false;
    }
  },

  // Change password
  changePassword: async (request: PasswordChangeRequest) => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.changePassword(request);

      if (response.success) {
        set({ saving: false });

        // Emit password changed event
        eventBus?.emit(USER_SETTINGS_EVENTS.PASSWORD_CHANGED, {
          userId: get().profile?.id,
          timestamp: new Date(),
        });

        return true;
      } else {
        set({
          error: response.error || 'Failed to change password',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to change password',
        saving: false,
      });
      return false;
    }
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.uploadAvatar(file);

      if (response.success && response.data) {
        const currentProfile = get().profile;
        if (currentProfile) {
          const updatedProfile = {
            ...currentProfile,
            avatar: response.data.url,
            updatedAt: new Date(),
          };

          set({
            profile: updatedProfile,
            saving: false,
          });

          // Emit avatar updated event
          eventBus?.emit(USER_SETTINGS_EVENTS.AVATAR_UPDATED, {
            userId: currentProfile.id,
            avatarUrl: response.data.url,
          });
        }

        return true;
      } else {
        set({
          error: response.error || 'Failed to upload avatar',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload avatar',
        saving: false,
      });
      return false;
    }
  },

  // Enable two-factor authentication
  enableTwoFactor: async () => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.enableTwoFactor();

      if (response.success && response.data) {
        const currentProfile = get().profile;
        const currentSecurity = get().security;

        if (currentProfile) {
          set({
            profile: { ...currentProfile, twoFactorEnabled: true },
            security: currentSecurity ? { ...currentSecurity, twoFactorEnabled: true } : null,
            saving: false,
          });

          // Emit two-factor enabled event
          eventBus?.emit(USER_SETTINGS_EVENTS.TWO_FACTOR_ENABLED, {
            userId: currentProfile.id,
          });
        }

        return response.data;
      } else {
        set({
          error: response.error || 'Failed to enable two-factor authentication',
          saving: false,
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to enable two-factor authentication',
        saving: false,
      });
      return null;
    }
  },

  // Disable two-factor authentication
  disableTwoFactor: async () => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.disableTwoFactor();

      if (response.success) {
        const currentProfile = get().profile;
        const currentSecurity = get().security;

        if (currentProfile) {
          set({
            profile: { ...currentProfile, twoFactorEnabled: false },
            security: currentSecurity ? { ...currentSecurity, twoFactorEnabled: false } : null,
            saving: false,
          });

          // Emit two-factor disabled event
          eventBus?.emit(USER_SETTINGS_EVENTS.TWO_FACTOR_DISABLED, {
            userId: currentProfile.id,
          });
        }

        return true;
      } else {
        set({
          error: response.error || 'Failed to disable two-factor authentication',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to disable two-factor authentication',
        saving: false,
      });
      return false;
    }
  },

  // Terminate session
  terminateSession: async (sessionId: string) => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.terminateSession(sessionId);

      if (response.success) {
        const currentSecurity = get().security;
        if (currentSecurity) {
          set({
            security: {
              ...currentSecurity,
              activeSessions: currentSecurity.activeSessions.filter(s => s.id !== sessionId),
            },
            saving: false,
          });

          // Emit session terminated event
          eventBus?.emit(USER_SETTINGS_EVENTS.SESSION_TERMINATED, {
            sessionId,
            userId: get().profile?.id,
          });
        }

        return true;
      } else {
        set({
          error: response.error || 'Failed to terminate session',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to terminate session',
        saving: false,
      });
      return false;
    }
  },

  // Remove trusted device
  removeTrustedDevice: async (deviceId: string) => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.removeTrustedDevice(deviceId);

      if (response.success) {
        const currentSecurity = get().security;
        if (currentSecurity) {
          set({
            security: {
              ...currentSecurity,
              trustedDevices: currentSecurity.trustedDevices.filter(d => d.id !== deviceId),
            },
            saving: false,
          });
        }

        return true;
      } else {
        set({
          error: response.error || 'Failed to remove trusted device',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove trusted device',
        saving: false,
      });
      return false;
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>) => {
    set({ saving: true, error: null });

    try {
      const response = await userSettingsService.updateNotificationPreferences(preferences);

      if (response.success && response.data) {
        set({
          preferences: response.data,
          saving: false,
        });

        // Emit preferences updated event
        eventBus?.emit(USER_SETTINGS_EVENTS.PREFERENCES_UPDATED, {
          userId: get().profile?.id,
          preferences: response.data,
        });

        return true;
      } else {
        set({
          error: response.error || 'Failed to update notification preferences',
          saving: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update notification preferences',
        saving: false,
      });
      return false;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      profile: null,
      security: null,
      preferences: null,
      loading: false,
      saving: false,
      error: null,
    });
  },
}));

// Initialize store with event bus
export const initializeUserSettingsStore = (eventBusInstance: EventBus) => {
  eventBus = eventBusInstance;

  // Reset store on logout
  eventBus.on('core.user.logged_out', () => {
    useUserSettingsStore.getState().reset();
  });

  // Auto-fetch profile on login
  eventBus.on('core.user.logged_in', () => {
    useUserSettingsStore.getState().fetchProfile();
  });
};

export default useUserSettingsStore;