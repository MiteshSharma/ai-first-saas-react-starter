/**
 * @fileoverview Project Management Plugin
 *
 * Demonstrates how existing functionality can be converted to a plugin
 * using the Event Bus architecture.
 */

import { Plugin, PluginContext, EventListenerConfig, RouteConfig } from '../../core/plugins/pluginTypes';
import { TENANT_EVENTS } from '../../core/plugins/coreEvents';
import { useProjectStore } from '../../core/stores/projects/ProjectStore';
import { logger } from '../../core/utils/logger';

export class ProjectManagementPlugin implements Plugin {
  name = 'ProjectManagement';
  version = '1.0.0';
  description = 'Project management functionality with workspace integration';
  author = 'AI-First SaaS';

  private unsubscribers: (() => void)[] = [];

  async install(context: PluginContext): Promise<void> {
    // Plugin installation logic
    logger.info(`Installing ${this.name} plugin...`);
  }

  async activate(context: PluginContext): Promise<void> {
    logger.info(`Activating ${this.name} plugin...`);

    // Subscribe to relevant core events
    const unsubTenantSwitch = context.on(TENANT_EVENTS.TENANT_SWITCHED, this.handleTenantSwitch);
    const unsubWorkspaceSwitch = context.on(TENANT_EVENTS.WORKSPACE_SWITCHED, this.handleWorkspaceSwitch);
    const unsubTenantCreate = context.on(TENANT_EVENTS.TENANT_CREATED, this.handleTenantCreate);

    this.unsubscribers.push(unsubTenantSwitch, unsubWorkspaceSwitch, unsubTenantCreate);

    // Emit plugin activated event
    context.emit('plugin.activated', {
      plugin: this.name,
      features: ['projects', 'tasks', 'collaboration']
    });
  }

  async deactivate(): Promise<void> {
    logger.info(`Deactivating ${this.name} plugin...`);

    // Clean up event listeners
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  registerStores(context: PluginContext) {
    return {
      projects: useProjectStore // Use existing project store
    };
  }

  registerRoutes(context: PluginContext): RouteConfig[] {
    return [
      {
        path: '/projects',
        component: () => import('../../pages/ProjectsPage').then(m => m.default),
        requiresAuth: true,
        requiresTenant: true,
        onEnter: () => context.emit('navigation.projects.entered', {})
      }
    ];
  }

  getEventListeners(): EventListenerConfig[] {
    return [
      {
        eventType: TENANT_EVENTS.TENANT_SWITCHED,
        handler: this.handleTenantSwitch,
        priority: 5
      },
      {
        eventType: TENANT_EVENTS.WORKSPACE_SWITCHED,
        handler: this.handleWorkspaceSwitch,
        priority: 5
      },
      {
        eventType: TENANT_EVENTS.TENANT_CREATED,
        handler: this.handleTenantCreate,
        priority: 3
      }
    ];
  }

  // Event handlers
  private handleTenantSwitch = (event: unknown) => {
    const eventPayload = (event as { payload: { oldTenant?: { name: string }; newTenant?: { name: string } } }).payload;
    logger.info('ProjectManagement: Tenant switched', 'ProjectManagement', eventPayload);
    const { oldTenant, newTenant } = eventPayload;

    // Clear projects cache and reload for new tenant
    // This would integrate with the project store
    logger.info(`Switching projects from tenant ${oldTenant?.name} to ${newTenant?.name}`);

    // Emit projects refreshed event
    // context.emit('projects.refreshed', {
    //   tenantId: newTenant.id,
    //   reason: 'tenant_switch'
    // });
  };

  private handleWorkspaceSwitch = (event: unknown) => {
    const eventPayload = (event as { payload: { oldWorkspace?: { name: string }; newWorkspace?: { name: string } } }).payload;
    logger.info('ProjectManagement: Workspace switched', 'ProjectManagement', eventPayload);
    const { oldWorkspace, newWorkspace } = eventPayload;

    // Update project filtering for new workspace
    logger.info(`Switching projects from workspace ${oldWorkspace?.name} to ${newWorkspace?.name}`);
  };

  private handleTenantCreate = (event: unknown) => {
    const eventPayload = (event as { payload: { tenant: { id: string; name: string } } }).payload;
    logger.info('ProjectManagement: New tenant created', 'ProjectManagement', eventPayload);
    const { tenant } = eventPayload;

    // Initialize project templates for new tenant
    logger.info(`Setting up project templates for new tenant: ${tenant.name}`);

    // Emit project templates ready event
    // context.emit('projects.templates.initialized', {
    //   tenantId: tenant.id
    // });
  };
}