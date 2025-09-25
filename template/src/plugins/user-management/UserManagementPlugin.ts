/**
 * @fileoverview User Management Plugin
 *
 * Main plugin class that provides user management functionality including:
 * - User profile and preferences management
 * - User list with search and filtering
 */

import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { useUserManagementStore, initializeUserManagementStore } from './stores/userManagementStore';
import { USER_MANAGEMENT_EVENTS } from './types';

// Event data types
interface PreferencesUpdatedEvent {
  theme?: string;
}

declare global {
  interface Window {
    showNotification?: (notification: {
      type: string;
      title: string;
      message: string;
    }) => void;
    applyTheme?: (theme: string) => void;
  }
}

// Helper functions for event handling

const handleUserUpdated = (data: unknown) => {
  // Refresh user list
  const store = useUserManagementStore.getState();
  store.fetchUsers(store.userFilters);

  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'User Updated',
      message: 'User information has been updated',
    });
  }
};


const handleProfileUpdated = (data: unknown) => {
  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully',
    });
  }
};

const handlePreferencesUpdated = (data: unknown) => {
  const eventData = data as PreferencesUpdatedEvent;
  // Apply theme changes if needed
  if (eventData.theme && typeof window !== 'undefined' && window.applyTheme) {
    window.applyTheme(eventData.theme);
  }

  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your preferences have been saved',
    });
  }
};


/**
 * User Management Plugin Implementation
 */
export const userManagementPlugin: Plugin = {
  name: 'user-management',
  version: '1.0.0',

  /**
   * Initialize the plugin
   */
  async init(context: PluginContext): Promise<void> {
    try {
      // Initialize user management store with event bus
      initializeUserManagementStore(context.eventBus);

      // Register components lazily for better performance
      const { default: UserManagementPage } = await import('./pages/UserManagementPage');
      const { default: UserSettingsPage } = await import('./pages/UserSettingsPage');

      // Register main user management routes
      context.registerRoute('/users', UserManagementPage);
      context.registerRoute('/users/management', UserManagementPage);

      // Register user settings/profile routes
      context.registerRoute('/settings', UserSettingsPage);
      context.registerRoute('/settings/profile', UserSettingsPage);
      context.registerRoute('/profile', UserSettingsPage);

      // Setup event listeners for user management events
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_UPDATED, handleUserUpdated);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_PROFILE_UPDATED, handleProfileUpdated);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_PREFERENCES_UPDATED, handlePreferencesUpdated);

      // User Management Plugin initialized successfully
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cleanup plugin resources
   */
  async destroy(): Promise<void> {
    try {
      // Reset store state
      useUserManagementStore.getState().reset();

      // User Management Plugin destroyed successfully
    } catch (error) {
      throw error;
    }
  },
};

export default userManagementPlugin;