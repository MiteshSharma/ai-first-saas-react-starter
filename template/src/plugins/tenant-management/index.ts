/**
 * @fileoverview Tenant Management Plugin Entry Point
 *
 * Main exports for the tenant management plugin
 */

import { PluginManager } from '../../core/plugin-system/PluginManager';
import tenantManagementPlugin from './TenantManagementPlugin';

// Auto-register the plugin
PluginManager.register(tenantManagementPlugin);

// Export the main plugin
export { default as tenantManagementPlugin } from './TenantManagementPlugin';

// Export types
export * from './types';

// Export services
export { tenantService } from './services/tenantService';

// Export store
export { useTenantStore, initializeTenantStore } from './stores/tenantStore';

// Export pages
export { default as TenantSettingsPage } from './pages/TenantSettingsPage';
export { default as CreateTenant } from './pages/CreateTenant';

// Export components
export * from './components';

// Export API helpers
export { TenantBackendHelper } from './api/backendHelper';
export { TenantMockHandlers } from './api/mockHandlers';
export { default as tenantMockHandlers } from './api/mockHandlers';

// For backward compatibility
export default tenantManagementPlugin;
export { tenantManagementPlugin as tenantPlugin };