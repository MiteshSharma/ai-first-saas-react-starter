/**
 * @fileoverview User Management Plugin Entry Point
 *
 * Main exports for the user management plugin
 */

import { PluginManager } from '../../core/plugin-system/PluginManager';
import userManagementPlugin from './UserManagementPlugin';

// Auto-register the plugin
PluginManager.register(userManagementPlugin);

// Export the main plugin
export { default as userManagementPlugin } from './UserManagementPlugin';

// Export types
export * from './types';

// Export services
export { default as InvitationService } from './services/InvitationService';
export { default as UserService } from './services/UserService';

// Export store
export { useUserManagementStore, useUserManagementActions, useUserManagementData } from './stores/userManagementStore';

// Export pages
export { default as UserManagementPage } from './pages/UserManagementPage';
export { default as UserSettingsPage } from './pages/UserSettingsPage';

// Export API helpers
export { default as UserManagementBackendHelper } from './api/backendHelper';

// Export endpoints
export { USER_MANAGEMENT_ENDPOINTS } from './api/endpoints';

// Export constants
export {
  TENANT_ROLES,
  WORKSPACE_ROLES,
  USER_STATUSES,
  INVITATION_STATUSES,
  THEMES,
  USER_MANAGEMENT_EVENTS,
} from './types';