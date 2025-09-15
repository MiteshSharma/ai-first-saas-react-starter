/**
 * @fileoverview Test Plugin
 *
 * Simple test plugin to verify the new plugin system works
 */

import React from 'react';
import { PluginManager, Plugin, PluginContext } from '../../core/plugin-system';

// Test component
const TestPage: React.FC = () => {
  return React.createElement('div', null,
    React.createElement('h1', null, 'Test Plugin Page'),
    React.createElement('p', null, 'This page is provided by the test plugin.')
  );
};

const TestSidebarWidget: React.FC = () => {
  return React.createElement('div', { style: { padding: '10px', background: '#f0f0f0' } },
    React.createElement('h3', null, 'Test Widget'),
    React.createElement('p', null, 'From test plugin')
  );
};

class TestPlugin implements Plugin {
  name = 'test';
  version = '1.0.0';

  async init(context: PluginContext): Promise<void> {
    // Register a test route
    context.registerRoute('/test', TestPage);

    // Register a sidebar widget
    context.registerSidebarWidget('test-widget', TestSidebarWidget, 1);

    // Listen to core events
    context.eventBus.on('core.user.logged_in', (data: unknown) => {
    });

  }

  async destroy(): Promise<void> {
  }
}

// Auto-register plugin
PluginManager.register(new TestPlugin());