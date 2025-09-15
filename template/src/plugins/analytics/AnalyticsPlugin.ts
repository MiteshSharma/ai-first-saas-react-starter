/**
 * @fileoverview Analytics Plugin
 *
 * Example plugin that tracks user authentication and tenant switching events
 * Shows how plugins can listen to core events and provide their own functionality
 */

import type { Plugin, PluginContext, EventListenerConfig } from '../../core/plugins/pluginTypes';
import { AUTH_EVENTS, TENANT_EVENTS } from '../../core/plugins/coreEvents';
import { AnalyticsWidget } from './AnalyticsWidget';
import { logger } from '../../core/utils/logger';

export class AnalyticsPlugin implements Plugin {
  name = 'Analytics';
  version = '1.0.0';
  description = 'Tracks user activity and provides analytics';
  author = 'Core Team';

  private stats = {
    totalLogins: 0,
    tenantSwitches: 0,
    lastActivity: null as Date | null,
  };

  async install(context: PluginContext): Promise<void> {
    logger.plugin.init(this.name, `Installing plugin v${this.version}`);

    // Load existing stats
    this.loadStats();

    // Register event listeners
    const listeners = this.getEventListeners();
    listeners.forEach(({ eventType, handler }) => {
      context.on(eventType, handler);
    });

    logger.plugin.success(this.name, 'Plugin installed successfully');
  }

  async activate(context: PluginContext): Promise<void> {
    logger.plugin.init(this.name, 'Activating plugin');

    // Plugin is now active and listening to events
    this.updateStats({ lastActivity: new Date() });

    logger.plugin.success(this.name, 'Plugin activated');
  }

  async deactivate(): Promise<void> {
    logger.plugin.init(this.name, 'Deactivating plugin');
    // Cleanup would go here
  }

  // Event listeners this plugin provides
  getEventListeners(): EventListenerConfig[] {
    return [
      {
        eventType: AUTH_EVENTS.USER_LOGIN,
        handler: (event) => {
          logger.info('User logged in', 'Analytics', event.payload);
          this.updateStats({
            totalLogins: this.stats.totalLogins + 1,
            lastActivity: new Date()
          });
        }
      },
      {
        eventType: AUTH_EVENTS.USER_LOGOUT,
        handler: (event) => {
          logger.info('User logged out', 'Analytics');
          this.updateStats({ lastActivity: new Date() });
        }
      },
      {
        eventType: TENANT_EVENTS.TENANT_SWITCHED,
        handler: (event) => {
          logger.info('Tenant switched', 'Analytics', event.payload);
          this.updateStats({
            tenantSwitches: this.stats.tenantSwitches + 1,
            lastActivity: new Date()
          });
        }
      }
    ];
  }

  // Component registration
  registerComponents() {
    return [
      {
        name: 'AnalyticsWidget',
        component: AnalyticsWidget,
        mountPoint: 'dashboard-widgets',
        order: 1
      }
    ];
  }

  private loadStats(): void {
    const stored = localStorage.getItem('analytics-plugin-data');
    if (stored) {
      try {
        this.stats = { ...this.stats, ...JSON.parse(stored) };
      } catch {
        // Use defaults
      }
    }
  }

  private updateStats(updates: Partial<typeof this.stats>): void {
    this.stats = { ...this.stats, ...updates };
    localStorage.setItem('analytics-plugin-data', JSON.stringify(this.stats));
  }
}

export default AnalyticsPlugin;