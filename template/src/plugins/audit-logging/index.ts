/**
 * @fileoverview Audit Logging Plugin
 *
 * Main plugin implementation for audit logging functionality
 * Demonstrates complete plugin system integration with:
 * - Route registration
 * - Event handling for audit trail
 * - State management
 */

import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { PluginManager } from '../../core/plugin-system/PluginManager';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import { initializeAuditStore } from './stores/auditStore';
import { AUDIT_EVENTS } from './types';

// Create the audit logging plugin
const auditLogPlugin: Plugin = {
  name: 'audit-logging',
  version: '1.0.0',

  async init(context: PluginContext) {
    try {
      // Initialize audit store with event bus
      initializeAuditStore(context.eventBus);

      // Import audit logs page
      const { default: AuditLogsPage } = await import('./pages/AuditLogsPage');

      // Register audit logs route with authentication protection
      context.registerRoute('/audit-logs', createProtectedRoute(AuditLogsPage));

      // Set up global event logging for audit trail
      const unsubscribeLogin = context.eventBus.on('core.user.logged_in', (data: unknown) => {
        // In production, this would create an audit log entry on the server
        context.eventBus.emit(AUDIT_EVENTS.LOG_CREATED, {
          action: 'user.login',
          details: data,
          timestamp: new Date()
        });
      });

      const unsubscribeLogout = context.eventBus.on('core.user.logged_out', (data: unknown) => {
        // In production, this would create an audit log entry on the server
        context.eventBus.emit(AUDIT_EVENTS.LOG_CREATED, {
          action: 'user.logout',
          details: data,
          timestamp: new Date()
        });
      });

      // Store cleanup functions (would be used in destroy method)
      (auditLogPlugin as { unsubscribers?: (() => void)[] }).unsubscribers = [
        unsubscribeLogin,
        unsubscribeLogout
      ];

      // Emit plugin-specific initialization event
      context.eventBus.emit('audit.plugin.initialized', {
        pluginName: auditLogPlugin.name,
        version: auditLogPlugin.version,
        timestamp: new Date()
      });

    } catch (error) {
      throw error;
    }
  },

  async destroy() {
    try {
      // Clean up event listeners
      const unsubscribers = (auditLogPlugin as { unsubscribers?: (() => void)[] }).unsubscribers || [];
      unsubscribers.forEach((unsubscribe: () => void) => {
        try {
          unsubscribe();
        } catch (error) {
          // Silent cleanup
        }
      });
    } catch (error) {
      // Silent cleanup
    }
  }
};

// Auto-register the plugin
PluginManager.register(auditLogPlugin);

export default auditLogPlugin;