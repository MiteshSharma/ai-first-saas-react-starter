/**
 * @fileoverview RBAC Permissions Plugin
 *
 * Plugin definition for RBAC & Permissions management
 */

import type { Plugin, PluginContext } from '../../core/plugin-system/types';
import { PluginManager } from '../../core/plugin-system/PluginManager';
import { initializePermissionStore } from './stores/permissionStore';
import { TENANT_EVENTS } from '../tenant-management/types';

// Create the RBAC permissions plugin
const rbacPermissionsPlugin: Plugin = {
  name: 'rbac-permissions',
  version: '1.0.0',

  async init(context: PluginContext) {
    try {
      // Initialize permission store with event bus
      const cleanup = initializePermissionStore(context.eventBus);

      // Store cleanup function
      (rbacPermissionsPlugin as { cleanup?: () => void }).cleanup = cleanup;

      // Import and initialize stores
      const { permissionStoreUtils } = await import('./stores/permissionStore');
      await permissionStoreUtils.initialize();

      // Log successful initialization
      console.log('[RBAC Plugin] Initialized successfully');
      console.log('[RBAC Plugin] Listening for events:', [
        TENANT_EVENTS.USER_PERMISSIONS_LOADED,
        'workspace.permissions.loaded'
      ]);

      // Emit plugin-specific initialization event
      context.eventBus.emit('rbac.plugin.initialized', {
        pluginName: rbacPermissionsPlugin.name,
        version: rbacPermissionsPlugin.version,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[RBAC Plugin] Initialization failed:', error);
      throw error;
    }
  },

  async destroy() {
    // Clean up event listeners
    const cleanup = (rbacPermissionsPlugin as { cleanup?: () => void }).cleanup;
    if (cleanup) {
      cleanup();
    }

    console.log('[RBAC Plugin] Destroyed successfully');
  }
};

// Register the plugin with PluginManager
PluginManager.register(rbacPermissionsPlugin);

export default rbacPermissionsPlugin;