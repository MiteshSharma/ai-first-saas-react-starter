/**
 * @fileoverview Tenant Management Plugin
 *
 * Main plugin class that provides tenant management functionality including:
 * - Multi-tenant context switching
 * - Tenant creation and management
 * - User invitation and role management
 * - Workspace scoped operations
 */

import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { useTenantStore, initializeTenantStore } from './stores/tenantStore';
import { TENANT_EVENTS } from './types';

/**
 * Tenant Management Plugin Implementation
 */
export const tenantManagementPlugin: Plugin = {
  name: 'tenant-management',
  version: '1.0.0',

  /**
   * Initialize the plugin
   */
  async init(context: PluginContext): Promise<void> {
    try {
      // Initialize tenant store with event bus and core context
      initializeTenantStore(context.eventBus, context.core?.setCurrentTenant);

      // Register components lazily
      const { TenantSwitcher } = await import('./components/TenantSwitcher');
      const { default: TenantSettingsPage } = await import('./pages/TenantSettingsPage');

      // Register main tenant dashboard routes
      context.registerRoute('/tenants/settings', TenantSettingsPage);  // Add this for sidebar compatibility

      // Register tenant switcher as a header widget
      context.registerHeaderWidget('tenant-switcher', TenantSwitcher);

      // Setup event listeners for tenant-related events
      context.eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, (data: any) => {
        // Additional logic for tenant context switching
        console.log('Tenant switched:', data);
      });

      context.eventBus.on(TENANT_EVENTS.TENANT_CREATED, (data: any) => {
        // Additional logic for new tenant setup
        console.log('Tenant created:', data);
      });

      context.eventBus.on(TENANT_EVENTS.USER_INVITED, (data: any) => {
        // Additional logic for user invitation
        console.log('User invited to tenant:', data);
      });

      // Listen to auth events to handle tenant context
      context.eventBus.on('core.user.logged_in', () => {
        // In real app, load user's tenants here
      });

      context.eventBus.on('core.user.logged_out', () => {
        // Clear tenant context
        const tenantStore = useTenantStore.getState();
        tenantStore.setCurrentTenant(null);
        tenantStore.setUserTenants([]);
      });

      // Emit plugin-specific initialization event
      context.eventBus.emit('tenant.plugin.initialized', {
        pluginName: tenantManagementPlugin.name,
        version: tenantManagementPlugin.version,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Failed to initialize Tenant Management Plugin:', error);
      throw error;
    }
  },

  /**
   * Cleanup plugin resources
   */
  async destroy(): Promise<void> {
    // Any cleanup logic would go here
    console.log('Tenant Management Plugin destroyed');
  }
};

/**
 * Get plugin configuration
 */
export const getTenantPluginConfig = () => {
  return {
    id: tenantManagementPlugin.name,
    name: 'Tenant Management',
    version: tenantManagementPlugin.version,
    description: 'Multi-tenant functionality with workspace isolation',
    features: [
      'Multi-tenant context switching',
      'Tenant creation and management',
      'User invitation system',
      'Role-based access control',
      'Workspace isolation'
    ],
    store: useTenantStore
  };
};

/**
 * Check if user has access to tenant features
 */
export const hasTenantAccess = (userId: string, tenantId?: string): boolean => {
  const tenantStore = useTenantStore.getState();

  if (!tenantStore.currentTenant) {
    return false;
  }

  if (tenantId && tenantStore.currentTenant.id !== tenantId) {
    return false;
  }

  return tenantStore.hasPermission('tenant:read');
};

/**
 * Get tenant context information
 */
export const getTenantContext = () => {
  const tenantStore = useTenantStore.getState();

  return {
    currentTenant: tenantStore.currentTenant,
    userTenants: tenantStore.userTenants,
    userRole: tenantStore.getCurrentUserRole(),
    hasAccess: hasTenantAccess
  };
};

export default tenantManagementPlugin;