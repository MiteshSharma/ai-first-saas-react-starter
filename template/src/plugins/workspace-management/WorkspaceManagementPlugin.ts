/**
 * @fileoverview Workspace Management Plugin
 *
 * Main plugin implementation for workspace management functionality
 * Demonstrates complete plugin system integration with:
 * - Route registration
 * - Widget registration
 * - Event handling
 * - State management
 */

import React from 'react';
import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import { initializeWorkspaceStore } from './stores/workspaceStore';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { TENANT_EVENTS } from '../tenant-management/types';

// Create the workspace management plugin
const workspaceManagementPlugin: Plugin = {
  name: 'workspace-management',
  version: '1.0.0',

  async init(context: PluginContext) {
    try {
      // Initialize workspace store with event bus and CoreContext
      initializeWorkspaceStore(context.eventBus, context.core.setCurrentWorkspace);

      // Import additional components
      const { default: WorkspaceSettingsPage } = await import('./pages/WorkspaceSettingsPage');
      const { default: CreateWorkspace } = await import('./pages/CreateWorkspace');

      // Register workspace routes with authentication protection
      context.registerRoute('/settings/workspaces', createProtectedRoute(WorkspaceSettingsPage));

      // Register CreateWorkspace as standalone route (full-screen, no sidebar)
      context.registerStandaloneRoute('/workspaces/create', createProtectedRoute(CreateWorkspace));

      // Register workspace switcher as a header widget
      context.registerHeaderWidget('workspace-switcher', () => React.createElement(WorkspaceSwitcher));

      // Register workspace dashboard widget
      context.registerDashboardWidget(
        'workspace-overview',
        () => React.createElement('div', { style: { padding: 16 } }, [
          React.createElement('h3', { key: 'title' }, 'Workspace Overview'),
          React.createElement('p', { key: 'description' }, 'Quick workspace management overview widget')
        ]),
        2 // priority
      );

      // Listen to auth events to handle workspace context
      const unsubscribeLogin = context.eventBus.on('core.user.logged_in', () => {
        // In real app, load user's workspaces here
      });

      const unsubscribeLogout = context.eventBus.on('core.user.logged_out', () => {
        // Clear workspace context
      });

      // Listen to core app events
      const unsubscribeAppInit = context.eventBus.on('core.app.initialized', () => {
        // Handle app initialization
      });

      // Listen to tenant-specific events
      const unsubscribeTenantSwitched = context.eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, () => {
        // Handle tenant context switch
      });

      // Store cleanup functions (would be used in destroy method)
      (workspaceManagementPlugin as { unsubscribers?: (() => void)[] }).unsubscribers = [
        unsubscribeLogin,
        unsubscribeLogout,
        unsubscribeAppInit,
        unsubscribeTenantSwitched
      ];

      // Emit plugin-specific initialization event
      context.eventBus.emit('workspace.plugin.initialized', {
        pluginName: workspaceManagementPlugin.name,
        version: workspaceManagementPlugin.version,
        timestamp: new Date()
      });

      console.log('[Workspace Plugin] Successfully initialized');
    } catch (error) {
      console.error('[Workspace Plugin] Failed to initialize:', error);
      throw error;
    }
  },

  async destroy() {
    try {
      // Clean up event listeners
      const unsubscribers = (workspaceManagementPlugin as { unsubscribers?: (() => void)[] }).unsubscribers || [];
      unsubscribers.forEach((unsubscribe: () => void) => {
        try {
          unsubscribe();
        } catch (error) {
          // Ignore cleanup errors
        }
      });

      console.log('[Workspace Plugin] Destroyed successfully');
    } catch (error) {
      console.error('[Workspace Plugin] Error during cleanup:', error);
    }
  }
};

export default workspaceManagementPlugin;