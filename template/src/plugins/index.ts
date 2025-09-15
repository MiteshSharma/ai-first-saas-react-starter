/**
 * @fileoverview Plugin manifest and registry
 *
 * This file defines all available plugins and their configuration.
 * The plugin system will load plugins based on this manifest.
 */

import { PluginConfig } from '../core/plugins/pluginTypes';
import { ProjectManagementPlugin } from './ProjectManagement';

/**
 * Plugin manifest - defines which plugins are available
 */
export const PLUGIN_MANIFEST: PluginConfig[] = [
  {
    name: 'ProjectManagement',
    pluginClass: ProjectManagementPlugin,
    autoLoad: true,
    enabled: true,
    dependencies: []
  }
];

/**
 * Get enabled plugins from manifest
 */
export function getEnabledPlugins(): PluginConfig[] {
  return PLUGIN_MANIFEST.filter(config => config.enabled !== false);
}

/**
 * Get plugin by name
 */
export function getPluginConfig(name: string): PluginConfig | undefined {
  return PLUGIN_MANIFEST.find(config => config.name === name);
}