/**
 * @fileoverview User Management Plugin
 *
 * Main plugin class that provides user management functionality including:
 * - User invitation and management
 * - User profile and preferences management
 * - Security settings and 2FA
 * - User list with search and filtering
 */

import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { useUserManagementStore } from './stores/userManagementStore';
import { USER_MANAGEMENT_EVENTS } from './types';

// Event data types
interface UserInvitedEvent {
  tenantId?: string;
  email?: string;
}

interface InvitationSentEvent {
  tenantId?: string;
  count?: number;
  emails?: string[];
}

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
const handleUserInvited = (data: unknown) => {
  const eventData = data as UserInvitedEvent;
  // Refresh user list if we're on the users page
  const store = useUserManagementStore.getState();
  if (eventData.tenantId) {
    store.fetchUsers(store.userFilters);
  }

  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'User Invited',
      message: `Invitation sent to ${eventData.email || 'user'}`,
    });
  }
};

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

const handleInvitationSent = (data: unknown) => {
  const eventData = data as InvitationSentEvent;
  // Refresh invitation list
  const store = useUserManagementStore.getState();
  if (eventData.tenantId) {
    store.fetchInvitations(eventData.tenantId);
  }

  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    const count = eventData.count || eventData.emails?.length || 1;
    window.showNotification({
      type: 'success',
      title: 'Invitations Sent',
      message: `${count} invitation${count > 1 ? 's' : ''} sent successfully`,
    });
  }
};

const handleInvitationAccepted = (data: unknown) => {
  const eventData = data as UserInvitedEvent;
  // Refresh both user list and invitation list
  const store = useUserManagementStore.getState();
  store.fetchUsers(store.userFilters);

  if (eventData.tenantId) {
    store.fetchInvitations(eventData.tenantId);
  }

  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'Invitation Accepted',
      message: 'User has joined the team',
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

const handleSecurityUpdated = (data: unknown) => {
  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'Security Updated',
      message: 'Your security settings have been updated',
    });
  }
};

const handleAvatarUploaded = (data: unknown) => {
  // Show success notification
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification({
      type: 'success',
      title: 'Avatar Updated',
      message: 'Your profile picture has been updated',
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
      // Register components lazily for better performance
      const { default: UserManagementPage } = await import('./pages/UserManagementPage');

      // Register main user management routes
      context.registerRoute('/users', UserManagementPage);
      context.registerRoute('/users/management', UserManagementPage);
      context.registerRoute('/users/invitations', UserManagementPage);

      // Setup event listeners for user management events
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_INVITED, handleUserInvited);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_UPDATED, handleUserUpdated);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.INVITATION_SENT, handleInvitationSent);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.INVITATION_ACCEPTED, handleInvitationAccepted);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_PROFILE_UPDATED, handleProfileUpdated);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_PREFERENCES_UPDATED, handlePreferencesUpdated);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.USER_SECURITY_UPDATED, handleSecurityUpdated);
      context.eventBus.on(USER_MANAGEMENT_EVENTS.AVATAR_UPLOADED, handleAvatarUploaded);

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