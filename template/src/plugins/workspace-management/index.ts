/**
 * @fileoverview Workspace Management Plugin Entry Point
 *
 * Main exports for the workspace management plugin
 */

import { PluginManager } from '../../core/plugin-system/PluginManager';
import workspaceManagementPlugin from './WorkspaceManagementPlugin';

// Auto-register the plugin
PluginManager.register(workspaceManagementPlugin);

// Export the main plugin
export { default as workspaceManagementPlugin } from './WorkspaceManagementPlugin';

// Export types
export * from './types';

// Export services
export { WorkspaceService } from './services/WorkspaceService';

// Export store
export { useWorkspaceStore, initializeWorkspaceStore } from './stores/workspaceStore';

// Export pages
export { default as WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
export { default as CreateWorkspace } from './pages/CreateWorkspace';

// Export components
export * from './components';

// Export API helpers
export { WorkspaceBackendHelper } from './api/backendHelper';
export { WorkspaceMockHandlers } from './api/mockHandlers';
export { default as workspaceMockHandlers } from './api/mockHandlers';

// For backward compatibility
export default workspaceManagementPlugin;
export { workspaceManagementPlugin as workspacePlugin };