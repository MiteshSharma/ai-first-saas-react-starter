/**
 * @fileoverview Audit Logging Plugin
 *
 * Plugin for tracking and viewing audit logs in the system
 */

import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { PluginManager } from '../../core/plugin-system/PluginManager';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import AuditLogsPage from './pages/AuditLogsPage';

const auditLogPlugin: Plugin = {
  name: 'audit-logging',
  version: '1.0.0',

  async init(context: PluginContext) {
    // Register the audit logs page as a protected route
    context.registerRoute('/audit-logs', createProtectedRoute(AuditLogsPage));

    // Initialize the audit store with the event bus
    // initializeAuditStore(context.eventBus);

    // Set up global event logging
    context.eventBus.on('core.user.logged_in', (data: unknown) => {
      // In production, this would create an audit log entry on the server
      // eslint-disable-next-line no-console
      console.log('[Audit] Event logged: core.user.logged_in', data);
    });

    context.eventBus.on('core.user.logged_out', (data: unknown) => {
      // In production, this would create an audit log entry on the server
      // eslint-disable-next-line no-console
      console.log('[Audit] Event logged: core.user.logged_out', data);
    });

    // eslint-disable-next-line no-console
    console.log('[Plugin] Audit Logging plugin initialized');
  },

  async destroy() {
    // Cleanup any resources if needed
    // eslint-disable-next-line no-console
    console.log('[Plugin] Audit Logging plugin cleaned up');
  },
};

// Auto-register the plugin
PluginManager.register(auditLogPlugin);

export default auditLogPlugin;