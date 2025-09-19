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
import { PluginManager } from '../../core/plugin-system/PluginManager';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import { initializeWorkspaceStore } from './stores/workspaceStore';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';

// Create the workspace management plugin
const workspacePlugin: Plugin = {
  name: 'workspace-management',
  version: '1.0.0',

  async init(context: PluginContext) {
    try {
      // Initialize workspace store with CoreContext
      initializeWorkspaceStore(context.core.setCurrentWorkspace);

      // Register workspace routes with authentication protection
      context.registerRoute('/workspaces/settings', createProtectedRoute(WorkspaceSettingsPage));

      // Register workspace switcher as a header widget
      context.registerHeaderWidget('workspace-switcher', () => React.createElement(WorkspaceSwitcher));

      // Register workspace dashboard widget
      context.registerDashboardWidget(
        'workspace-overview',
        () => React.createElement('div', { style: { padding: 16 } }, [
          React.createElement('h3', { key: 'title' }, 'Workspace Overview'),
          React.createElement('p', { key: 'description' }, 'Quick workspace management overview widget')
        ]),
        2
      );

      // Listen to core app events
      const unsubscribeAppInit = context.eventBus.on('core.app.initialized', () => {
        // Handle app initialization
      });

      // Listen to workspace-specific events
      const unsubscribeWorkspaceSwitched = context.eventBus.on('WORKSPACE_SWITCHED', () => {
        // Handle workspace context switch
      });

      // Store cleanup functions (would be used in destroy method)
      (workspacePlugin as { unsubscribers?: (() => void)[] }).unsubscribers = [
        unsubscribeAppInit,
        unsubscribeWorkspaceSwitched
      ];

      // Emit plugin-specific initialization event
      context.eventBus.emit('workspace.plugin.initialized', {
        pluginName: workspacePlugin.name,
        version: workspacePlugin.version,
        timestamp: new Date()
      });
    } catch (error) {
      throw error;
    }
  },

  async destroy() {
    try {
      // Clean up event listeners
      const unsubscribers = (workspacePlugin as { unsubscribers?: (() => void)[] }).unsubscribers || [];
      unsubscribers.forEach((unsubscribe: () => void) => {
        try {
          unsubscribe();
        } catch (error) {
        }
      });
    } catch (error) {
    }
  }
};

// Auto-register the plugin
PluginManager.register(workspacePlugin);

export default workspacePlugin;
export { workspacePlugin };
export * from './types';
export * from './stores/workspaceStore';
export * from './components';