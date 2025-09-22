/**
 * @fileoverview Tenant Management Plugin
 *
 * Main plugin implementation for tenant management functionality
 * Demonstrates complete plugin system integration with:
 * - Route registration
 * - Widget registration
 * - Event handling
 * - State management
 */

import React from 'react';
import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import { initializeTenantStore } from './stores/tenantStore';
import { TenantSwitcher } from './components';
import { TENANT_EVENTS } from './types';

// Create the tenant management plugin
const tenantManagementPlugin: Plugin = {
  name: 'tenant-management',
  version: '1.0.0',

  async init(context: PluginContext) {
    try {
      // Initialize tenant store with event bus and CoreContext
      initializeTenantStore(context.eventBus, context.core.setCurrentTenant);

      // Import additional components
      const { default: TenantSettingsPage } = await import('./pages/TenantSettingsPage');
      const { default: CreateTenant } = await import('./pages/CreateTenant');

      // Register tenant routes with authentication protection
      context.registerRoute('/settings/tenants', createProtectedRoute(TenantSettingsPage));

      // Register CreateTenant as standalone route (full-screen, no sidebar)
      context.registerStandaloneRoute('/tenants/create', createProtectedRoute(CreateTenant));

      // Register tenant switcher as a header widget
      context.registerHeaderWidget('tenant-switcher', () => React.createElement(TenantSwitcher));

      // Register tenant dashboard widget
      context.registerDashboardWidget(
        'tenant-overview',
        () => React.createElement('div', { style: { padding: 16 } }, [
          React.createElement('h3', { key: 'title' }, 'Tenant Overview'),
          React.createElement('p', { key: 'description' }, 'Quick tenant management overview widget')
        ]),
        1 // priority
      );

      // Listen to auth events to handle tenant context
      const unsubscribeLogin = context.eventBus.on('core.user.logged_in', () => {
        // In real app, load user's tenants here
      });

      const unsubscribeLogout = context.eventBus.on('core.user.logged_out', () => {
        // Clear tenant context
      });

      // Listen to core app events
      const unsubscribeAppInit = context.eventBus.on('core.app.initialized', () => {
        // Handle app initialization
      });

      // Listen to tenant-specific events
      const unsubscribeTenantSwitched = context.eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, () => {
        // Handle tenant context switch
      });

      const unsubscribeTenantCreated = context.eventBus.on(TENANT_EVENTS.TENANT_CREATED, () => {
        // Handle new tenant creation
      });

      // Store cleanup functions (would be used in destroy method)
      (tenantManagementPlugin as { unsubscribers?: (() => void)[] }).unsubscribers = [
        unsubscribeLogin,
        unsubscribeLogout,
        unsubscribeAppInit,
        unsubscribeTenantSwitched,
        unsubscribeTenantCreated
      ];

      // Emit plugin-specific initialization event
      context.eventBus.emit('tenant.plugin.initialized', {
        pluginName: tenantManagementPlugin.name,
        version: tenantManagementPlugin.version,
        timestamp: new Date()
      });

      console.log('[Tenant Plugin] Successfully initialized');
    } catch (error) {
      console.error('[Tenant Plugin] Failed to initialize:', error);
      throw error;
    }
  },

  async destroy() {
    try {
      // Clean up event listeners
      const unsubscribers = (tenantManagementPlugin as { unsubscribers?: (() => void)[] }).unsubscribers || [];
      unsubscribers.forEach((unsubscribe: () => void) => {
        try {
          unsubscribe();
        } catch (error) {
          // Ignore cleanup errors
        }
      });

      console.log('[Tenant Plugin] Destroyed successfully');
    } catch (error) {
      console.error('[Tenant Plugin] Error during cleanup:', error);
    }
  }
};

export default tenantManagementPlugin;