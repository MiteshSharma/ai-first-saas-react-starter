/**
 * @fileoverview User Settings Plugin
 *
 * Plugin for managing user profile, security settings, and preferences
 */

import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { PluginManager } from '../../core/plugin-system/PluginManager';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import UserSettingsPage from './pages/UserSettingsPage';
import { initializeUserSettingsStore } from './stores/userSettingsStore';

const userSettingsPlugin: Plugin = {
  name: 'user-settings',
  version: '1.0.0',

  async init(context: PluginContext) {
    // Register the user settings page as a protected route
    context.registerRoute('/settings/profile', createProtectedRoute(UserSettingsPage));

    // Initialize the user settings store with event bus
    // initializeUserSettingsStore(context.eventBus);

    // Listen to core events
    context.eventBus.on('core.user.logged_in', (data: unknown) => {
      // eslint-disable-next-line no-console
      console.log('[UserSettings] User logged in, loading profile:', data);
    });

    context.eventBus.on('core.user.logged_out', (data: unknown) => {
      // eslint-disable-next-line no-console
      console.log('[UserSettings] User logged out, clearing settings:', data);
    });

    // eslint-disable-next-line no-console
    console.log('[Plugin] User Settings plugin initialized');
  },

  async destroy() {
    // Cleanup any resources if needed
    // eslint-disable-next-line no-console
    console.log('[Plugin] User Settings plugin cleaned up');
  },
};

// Auto-register the plugin
PluginManager.register(userSettingsPlugin);

export default userSettingsPlugin;