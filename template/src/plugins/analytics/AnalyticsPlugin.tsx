/**
 * @fileoverview Analytics Plugin
 *
 * Example plugin that tracks user authentication and tenant switching events
 * Shows how plugins can listen to core events and provide their own functionality
 */

import type { Plugin, PluginContext, EventListenerConfig } from '../../core/plugins/pluginTypes';
import { AUTH_EVENTS, TENANT_EVENTS } from '../../core/plugins/coreEvents';

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
    console.log(`🔌 Installing ${this.name} plugin v${this.version}`);

    // Load existing stats
    this.loadStats();

    // Register event listeners
    const listeners = this.getEventListeners();
    listeners.forEach(({ eventType, handler }) => {
      context.on(eventType, handler);
    });

    console.log(`✅ ${this.name} plugin installed successfully`);
  }

  async activate(context: PluginContext): Promise<void> {
    console.log(`🚀 Activating ${this.name} plugin`);

    // Plugin is now active and listening to events
    this.updateStats({ lastActivity: new Date() });

    console.log(`✅ ${this.name} plugin activated`);
  }

  async deactivate(): Promise<void> {
    console.log(`⏸️ Deactivating ${this.name} plugin`);
    // Cleanup would go here
  }

  // Event listeners this plugin provides
  getEventListeners(): EventListenerConfig[] {
    return [
      {
        eventType: AUTH_EVENTS.USER_LOGIN,
        handler: (event) => {
          console.log('📊 Analytics: User logged in', event.payload);
          this.updateStats({
            totalLogins: this.stats.totalLogins + 1,
            lastActivity: new Date()
          });
        }
      },
      {
        eventType: AUTH_EVENTS.USER_LOGOUT,
        handler: (event) => {
          console.log('📊 Analytics: User logged out');
          this.updateStats({ lastActivity: new Date() });
        }
      },
      {
        eventType: TENANT_EVENTS.TENANT_SWITCHED,
        handler: (event) => {
          console.log('📊 Analytics: Tenant switched', event.payload);
          this.updateStats({
            tenantSwitches: this.stats.tenantSwitches + 1,
            lastActivity: new Date()
          });
        }
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