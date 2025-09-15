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
import { PluginManager } from '../../core/plugin-system/PluginManager';
import { initializeTenantStore } from './TenantStore';
import { TenantDashboard, TenantSwitcher } from './components';
import { TENANT_EVENTS } from './types';

// Create the tenant management plugin
const tenantPlugin: Plugin = {
  name: 'tenant-management',
  version: '1.0.0',

  async init(context: PluginContext) {

    try {
      // Initialize tenant store with event bus
      initializeTenantStore(context.eventBus);

      // Register main tenant dashboard route
      context.registerRoute('/tenant', TenantDashboard);
      context.registerRoute('/tenant/dashboard', TenantDashboard);

      // Register tenant switcher as a header widget
      context.registerHeaderWidget('tenant-switcher', () => React.createElement(TenantSwitcher));

      // Register tenant dashboard widget
      context.registerDashboardWidget(
        'tenant-overview',
        () => React.createElement('div', { style: { padding: 16 } }, [
          React.createElement('h3', { key: 'title' }, 'Tenant Overview'),
          React.createElement('p', { key: 'description' }, 'Quick tenant management overview widget')
        ]),
        1
      );

      // Listen to auth events to handle tenant context
      const unsubscribeLogin = context.eventBus.on('core.user.logged_in', (_data: unknown) => {
        // In real app, load user's tenants here
      });

      const unsubscribeLogout = context.eventBus.on('core.user.logged_out', () => {
        // Clear tenant context
      });

      // Listen to core app events
      const unsubscribeAppInit = context.eventBus.on('core.app.initialized', (_data: unknown) => {
        // Handle app initialization
      });

      // Listen to tenant-specific events
      const unsubscribeTenantSwitched = context.eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, (_data: unknown) => {
        // Handle tenant context switch
      });

      const unsubscribeTenantCreated = context.eventBus.on(TENANT_EVENTS.TENANT_CREATED, (_data: unknown) => {
        // Handle new tenant creation
      });

      // Store cleanup functions (would be used in destroy method)
      (tenantPlugin as { unsubscribers?: (() => void)[] }).unsubscribers = [
        unsubscribeLogin,
        unsubscribeLogout,
        unsubscribeAppInit,
        unsubscribeTenantSwitched,
        unsubscribeTenantCreated
      ];


      // Emit plugin-specific initialization event
      context.eventBus.emit('tenant.plugin.initialized', {
        pluginName: tenantPlugin.name,
        version: tenantPlugin.version,
        timestamp: new Date()
      });

    } catch (error) {
      throw error;
    }
  },

  async destroy() {

    try {
      // Clean up event listeners
      const unsubscribers = (tenantPlugin as { unsubscribers?: (() => void)[] }).unsubscribers || [];
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
PluginManager.register(tenantPlugin);


export default tenantPlugin;
export { tenantPlugin };
export * from './types';
export * from './TenantStore';
export * from './components';