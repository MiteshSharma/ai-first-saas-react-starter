/**
 * @fileoverview Plugin Registry
 *
 * Central registry for all plugins in the application
 */

import type { PluginManifest } from '../core/plugins/pluginTypes';
import { AnalyticsPlugin } from './analytics/AnalyticsPlugin';
import { ProjectManagementPlugin } from './ProjectManagement/ProjectManagementPlugin';
import { UserManagementPlugin } from './UserManagement/UserManagementPlugin';
import { TenantManagementPlugin } from './TenantManagement/TenantManagementPlugin';

export const pluginManifest: PluginManifest = {
  plugins: [
    {
      name: 'Analytics',
      pluginClass: AnalyticsPlugin,
      autoLoad: true,
      enabled: true,
    },
    {
      name: 'UserManagement',
      pluginClass: UserManagementPlugin,
      autoLoad: true,
      enabled: true,
    },
    {
      name: 'TenantManagement',
      pluginClass: TenantManagementPlugin,
      autoLoad: true,
      enabled: true,
    },
    {
      name: 'ProjectManagement',
      pluginClass: ProjectManagementPlugin,
      autoLoad: true,
      enabled: true,
    }
  ]
};

export default pluginManifest;