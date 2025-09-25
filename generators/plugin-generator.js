const fs = require('fs');
const path = require('path');

/**
 * Plugin Generator - Creates complete plugin scaffolding
 * Supports feature plugins and core service plugins
 */
class PluginGenerator {
  constructor(options = {}) {
    this.options = {
      hasStore: false,
      hasRoutes: false,
      hasComponents: false,
      type: 'feature', // 'feature' or 'core'
      ...options
    };
  }

  /**
   * Helper functions for handling plugin names with dashes
   */
  getPluginNameParts(pluginName) {
    // Extract the base name (part before first dash) for JavaScript identifiers
    const baseName = pluginName.includes('-') ? pluginName.split('-')[0] : pluginName;

    return {
      // Original plugin name (used for directories and registration)
      originalName: pluginName,
      // Base name for JavaScript identifiers (PascalCase)
      baseName: this.toPascalCase(baseName),
      // Base name in lowercase for various uses
      baseNameLower: baseName.toLowerCase(),
      // Plugin name in kebab-case for registration
      kebabName: this.toKebabCase(pluginName),
      // Plugin name in UPPER_CASE for constants
      upperName: baseName.toUpperCase()
    };
  }

  toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toKebabCase(str) {
    // If already kebab-case, return as-is
    if (str.includes('-')) {
      return str.toLowerCase();
    }
    // Convert PascalCase/camelCase to kebab-case
    return str.replace(/([A-Z])/g, '-$1').slice(1).toLowerCase();
  }

  async generate(options) {
    if (typeof options === 'string') {
      // Legacy call signature: generate(pluginName, targetDir)
      const pluginName = options;
      const targetDir = arguments[1] || process.cwd();
      return this._generatePlugin(pluginName, targetDir);
    }

    // New call signature: generate({ name, type, ... })
    const { name, type = 'feature', hasStore = false, hasRoutes = false, hasComponents = true, description } = options;
    this.options = { ...this.options, type, hasStore, hasRoutes, hasComponents };
    return this._generatePlugin(name, process.cwd());
  }

  async _generatePlugin(pluginName, targetDir = process.cwd()) {
    const pluginDir = path.join(targetDir, 'src', 'plugins', pluginName);
    const nameparts = this.getPluginNameParts(pluginName);

    console.log(`🔌 Generating ${this.options.type} plugin: ${pluginName}`);

    // Create plugin directory structure
    this.createDirectoryStructure(pluginDir);

    // Generate main plugin file
    this.generatePluginClass(nameparts, pluginDir);

    // Generate core structure (always created)
    this.generateApiFiles(nameparts, pluginDir);
    this.generatePluginStore(nameparts, pluginDir);
    this.generatePluginService(nameparts, pluginDir);
    this.generatePluginTypes(nameparts, pluginDir);
    this.generatePluginComponents(nameparts, pluginDir);

    // Generate optional components
    if (this.options.hasRoutes) {
      this.generatePluginRoutes(nameparts, pluginDir);
    }

    // Generate tests
    this.generatePluginTests(nameparts, pluginDir);

    // Generate index file
    this.generateIndexFile(nameparts, pluginDir);

    console.log(`✅ Plugin ${pluginName} generated successfully!`);
    console.log(`📁 Location: ${pluginDir}`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Register plugin in src/core/plugins/PluginRegistry.ts`);
    console.log(`2. Import and activate in your app bootstrap`);
    console.log(`3. Implement your plugin functionality`);
  }

  createDirectoryStructure(pluginDir) {
    const dirs = [
      pluginDir,
      path.join(pluginDir, 'api'),
      path.join(pluginDir, 'components'),
      path.join(pluginDir, 'hooks'),
      path.join(pluginDir, 'pages'),
      path.join(pluginDir, 'services'),
      path.join(pluginDir, 'stores'),
      path.join(pluginDir, 'types'),
      path.join(pluginDir, '__tests__')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generatePluginClass(nameparts, pluginDir) {
    const template = this.getPluginTemplate(nameparts);
    const filePath = path.join(pluginDir, `${nameparts.baseName}Plugin.ts`);
    fs.writeFileSync(filePath, template);
  }

  generatePluginStore(nameparts, pluginDir) {
    const template = this.getStoreTemplate(nameparts);
    const filePath = path.join(pluginDir, 'stores', `${nameparts.baseName}Store.ts`);
    fs.writeFileSync(filePath, template);
  }

  generatePluginRoutes(nameparts, pluginDir) {
    const template = this.getRoutesTemplate(nameparts);
    const filePath = path.join(pluginDir, `${nameparts.baseName}Routes.ts`);
    fs.writeFileSync(filePath, template);
  }

  generatePluginComponents(nameparts, pluginDir) {
    // Generate main dashboard component
    const dashboardTemplate = this.getComponentTemplate(nameparts);
    const dashboardPath = path.join(pluginDir, 'components', `${nameparts.baseName}Dashboard.tsx`);
    fs.writeFileSync(dashboardPath, dashboardTemplate);

    // Generate components index.ts
    const indexTemplate = this.getComponentsIndexTemplate(nameparts);
    const indexPath = path.join(pluginDir, 'components', 'index.ts');
    fs.writeFileSync(indexPath, indexTemplate);
  }

  generatePluginTests(nameparts, pluginDir) {
    const template = this.getTestTemplate(nameparts);
    const filePath = path.join(pluginDir, '__tests__', `${nameparts.baseName}Plugin.test.ts`);
    fs.writeFileSync(filePath, template);
  }

  generateIndexFile(nameparts, pluginDir) {
    const template = this.getIndexTemplate(nameparts);
    const filePath = path.join(pluginDir, 'index.ts');
    fs.writeFileSync(filePath, template);
  }

  generateApiFiles(nameparts, pluginDir) {
    // Generate endpoints.ts
    const endpointsTemplate = this.getEndpointsTemplate(nameparts);
    fs.writeFileSync(path.join(pluginDir, 'api', 'endpoints.ts'), endpointsTemplate);

    // Generate backendHelper.ts
    const backendHelperTemplate = this.getBackendHelperTemplate(nameparts);
    fs.writeFileSync(path.join(pluginDir, 'api', 'backendHelper.ts'), backendHelperTemplate);

    // Generate mockHandlers.ts
    const mockHandlersTemplate = this.getMockHandlersTemplate(nameparts);
    fs.writeFileSync(path.join(pluginDir, 'api', 'mockHandlers.ts'), mockHandlersTemplate);
  }

  generatePluginService(nameparts, pluginDir) {
    const template = this.getServiceTemplate(nameparts);
    const filePath = path.join(pluginDir, 'services', `${nameparts.baseNameLower}Service.ts`);
    fs.writeFileSync(filePath, template);
  }

  generatePluginTypes(nameparts, pluginDir) {
    const template = this.getTypesTemplate(nameparts);
    const filePath = path.join(pluginDir, 'types.ts');
    fs.writeFileSync(filePath, template);
  }

  getPluginTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Plugin
 *
 * ${this.options.type === 'feature' ? 'Feature plugin providing' : 'Core service plugin for'} ${originalName} functionality
 * Generated by AI-First SaaS React Starter CLI
 */

import React from 'react';
import { Plugin, PluginContext } from '../../core/plugin-system/types';
import { createProtectedRoute } from '../../core/routing/ProtectedRoute';
import { initialize${baseName}Store } from './stores/${baseName}Store';
import { ${baseName}Dashboard } from './components';
import { ${upperName}_EVENTS } from './types';

// Create the ${originalName} plugin
const ${baseNameLower}Plugin: Plugin = {
  name: '${kebabName}',
  version: '1.0.0',

  async init(context: PluginContext) {
    try {
      console.log('[${baseName} Plugin] Initializing...');

      // Initialize ${originalName} store with event bus
      initialize${baseName}Store(context.eventBus);

      // Register ${originalName} dashboard as a header widget (optional)
      context.registerDashboardWidget(
        '${baseNameLower}-overview',
        () => React.createElement('div', { style: { padding: 16 } }, [
          React.createElement('h3', { key: 'title' }, '${baseName} Overview'),
          React.createElement('p', { key: 'description' }, 'Quick ${originalName} overview widget - customize as needed')
        ]),
        1 // priority
      );

      // Listen to core app events
      const unsubscribeAppInit = context.eventBus.on('core.app.initialized', () => {
        console.log('[${baseName} Plugin] App initialized');
        // Handle app initialization if needed
      });

      // Listen to auth events to handle user context
      const unsubscribeLogin = context.eventBus.on('core.user.logged_in', () => {
        console.log('[${baseName} Plugin] User logged in');
        // Load user-specific ${originalName} data here
      });

      const unsubscribeLogout = context.eventBus.on('core.user.logged_out', () => {
        console.log('[${baseName} Plugin] User logged out');
        // Clear ${originalName} context
      });

      // Listen to ${originalName}-specific events
      const unsubscribeItemCreated = context.eventBus.on(${upperName}_EVENTS.ITEM_CREATED, (payload) => {
        console.log('[${baseName} Plugin] Item created:', payload);
        // Handle ${originalName} item creation
      });

      const unsubscribeItemUpdated = context.eventBus.on(${upperName}_EVENTS.ITEM_UPDATED, (payload) => {
        console.log('[${baseName} Plugin] Item updated:', payload);
        // Handle ${originalName} item updates
      });

      const unsubscribeItemDeleted = context.eventBus.on(${upperName}_EVENTS.ITEM_DELETED, (payload) => {
        console.log('[${baseName} Plugin] Item deleted:', payload);
        // Handle ${originalName} item deletion
      });

      // Store cleanup functions (would be used in destroy method)
      (${baseNameLower}Plugin as { unsubscribers?: (() => void)[] }).unsubscribers = [
        unsubscribeAppInit,
        unsubscribeLogin,
        unsubscribeLogout,
        unsubscribeItemCreated,
        unsubscribeItemUpdated,
        unsubscribeItemDeleted
      ];

      // Emit plugin-specific initialization event
      context.eventBus.emit('${baseNameLower}.plugin.initialized', {
        pluginName: ${baseNameLower}Plugin.name,
        version: ${baseNameLower}Plugin.version,
        timestamp: new Date()
      });

      console.log('[${baseName} Plugin] Successfully initialized');
    } catch (error) {
      console.error('[${baseName} Plugin] Failed to initialize:', error);
      throw error;
    }
  },

  async destroy() {
    try {
      // Clean up event listeners
      const unsubscribers = (${baseNameLower}Plugin as { unsubscribers?: (() => void)[] }).unsubscribers || [];
      unsubscribers.forEach((unsubscribe: () => void) => {
        try {
          unsubscribe();
        } catch (error) {
          // Ignore cleanup errors
        }
      });

      console.log('[${baseName} Plugin] Destroyed successfully');
    } catch (error) {
      console.error('[${baseName} Plugin] Error during cleanup:', error);
    }
  }
};

export default ${baseNameLower}Plugin;
`;
  }

  getStoreTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Store with Zustand
 *
 * Manages ${originalName} state and operations
 * Generated by AI-First SaaS React Starter CLI
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ${baseName}Item, Create${baseName}Request, Update${baseName}Request, ${upperName}_EVENTS } from '../types';
import { ${baseName}Service } from '../services/${baseNameLower}Service';

// Base request state for consistent loading/error handling
interface RequestState {
  loading: boolean;
  error: string | null;
  currentRequest: string | null;
}

interface ${baseName}State extends RequestState {
  // Core ${originalName} data
  items: ${baseName}Item[];
  selectedItem: ${baseName}Item | null;

  // Actions
  setItems: (items: ${baseName}Item[]) => void;
  setSelectedItem: (item: ${baseName}Item | null) => void;
  loadItems: () => Promise<void>;
  createItem: (data: Create${baseName}Request) => Promise<${baseName}Item>;
  updateItem: (id: string, data: Update${baseName}Request) => Promise<${baseName}Item>;
  deleteItem: (id: string) => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const use${baseName}Store = create<${baseName}State>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      selectedItem: null,
      loading: false,
      error: null,
      currentRequest: null,

      // Setters
      setItems: (items: ${baseName}Item[]) => set({ items }),

      setSelectedItem: (item: ${baseName}Item | null) => set({ selectedItem: item }),

      // Load all items
      loadItems: async () => {
        set({ loading: true, error: null, currentRequest: 'loadItems' });

        try {
          const items = await ${baseName}Service.getAll();
          set({
            items,
            loading: false,
            currentRequest: null
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load ${originalName} items',
            loading: false,
            currentRequest: null
          });
          throw error;
        }
      },

      // Create new item
      createItem: async (data: Create${baseName}Request) => {
        set({ loading: true, error: null, currentRequest: 'createItem' });

        try {
          const newItem = await ${baseName}Service.create(data);
          set(state => ({
            items: [...state.items, newItem],
            loading: false,
            currentRequest: null
          }));

          return newItem;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create ${originalName} item',
            loading: false,
            currentRequest: null
          });
          throw error;
        }
      },

      // Update existing item
      updateItem: async (id: string, data: Update${baseName}Request) => {
        set({ loading: true, error: null, currentRequest: 'updateItem' });

        try {
          const updatedItem = await ${baseName}Service.update(id, data);
          set(state => ({
            items: state.items.map(item => item.id === id ? updatedItem : item),
            selectedItem: state.selectedItem?.id === id ? updatedItem : state.selectedItem,
            loading: false,
            currentRequest: null
          }));

          return updatedItem;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update ${originalName} item',
            loading: false,
            currentRequest: null
          });
          throw error;
        }
      },

      // Delete item
      deleteItem: async (id: string) => {
        set({ loading: true, error: null, currentRequest: 'deleteItem' });

        try {
          await ${baseName}Service.delete(id);
          set(state => ({
            items: state.items.filter(item => item.id !== id),
            selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
            loading: false,
            currentRequest: null
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete ${originalName} item',
            loading: false,
            currentRequest: null
          });
          throw error;
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ loading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set({
        items: [],
        selectedItem: null,
        loading: false,
        error: null,
        currentRequest: null
      }),
    }),
    {
      name: '${baseNameLower}-storage',
      partialize: (state) => ({
        items: state.items,
        selectedItem: state.selectedItem
      }),
    }
  )
);

// Plugin store initialization function
let eventBus: any = null;

export const initialize${baseName}Store = (pluginEventBus?: any) => {
  if (pluginEventBus) {
    eventBus = pluginEventBus;

    // Listen for relevant events and update store accordingly
    eventBus.on(${upperName}_EVENTS.LIST_LOADED, (payload: any) => {
      use${baseName}Store.getState().setItems(payload.items);
    });

    console.log('[${baseName} Store] Initialized with event bus integration');
  }
};

export default use${baseName}Store;
`;
  }

  getRoutesTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;
    return `/**
 * @fileoverview ${baseName} Routes
 *
 * Route configuration for ${originalName} plugin
 * Generated by AI-First SaaS React Starter CLI
 */

import { PluginContext, RouteConfig } from '../../core/plugins/pluginTypes';

export const ${baseNameLower}Routes = (context: PluginContext): RouteConfig[] => [
  {
    path: '/${kebabName}',
    component: () => import('./components/${baseName}Dashboard').then(m => m.default),
    requiresAuth: true,
    requiresTenant: true,
    onEnter: () => context.emit('navigation.${kebabName}.entered', {}),
    onExit: () => context.emit('navigation.${kebabName}.exited', {})
  },
  {
    path: '/${kebabName}/:id',
    component: () => import('./components/${baseName}Detail').then(m => m.default),
    requiresAuth: true,
    requiresTenant: true,
    onEnter: () => context.emit('navigation.${kebabName}.detail.entered', {})
  }
];
`;
  }

  getComponentTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Dashboard Component
 *
 * Main dashboard component for ${originalName} plugin
 * Generated by AI-First SaaS React Starter CLI
 */

import React, { useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  message,
  Spin
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';${this.options.hasStore ? `
import { use${baseName}Store } from '../stores/${baseName}Store';` : ''}

const { Title } = Typography;

export const ${baseName}Dashboard: React.FC = () => {${this.options.hasStore ? `
  const {
    items,
    loading,
    error,
    fetchItems,
    deleteItem,
    clearError
  } = use${baseName}Store();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (error) {
      message.error(error.message);
      clearError();
    }
  }, [error, clearError]);

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      message.success('Item deleted successfully');
    } catch (error) {
      // Error handled by store
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];` : `
  // Plugin component logic here`}

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2}>${baseName} Dashboard</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
          >
            Add New
          </Button>
        </div>

        ${this.options.hasStore ? `<Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={{
              total: items.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        </Spin>` : `<div>
          <p>${baseName} plugin dashboard content goes here.</p>
          <p>Implement your plugin functionality in this component.</p>
        </div>`}
      </Card>
    </div>
  );
};

export default ${baseName}Dashboard;
`;
  }

  getTestTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;
    return `/**
 * @fileoverview ${baseName} Plugin Tests
 *
 * Unit tests for ${baseName} plugin
 * Generated by AI-First SaaS React Starter CLI
 */

import { ${baseName}Plugin } from '../${baseName}Plugin';
import { setupPluginTest } from '../../../core/plugins/__tests__/pluginTestHelper';

describe('${baseName}Plugin', () => {
  let plugin: ${baseName}Plugin;
  let mockContext: any;

  beforeEach(async () => {
    const setup = await setupPluginTest(${baseName}Plugin, {
      autoActivate: false
    });

    plugin = setup.plugin;
    mockContext = setup.context;
  });

  describe('Plugin Lifecycle', () => {
    it('should install successfully', async () => {
      await expect(plugin.install(mockContext)).resolves.not.toThrow();
    });

    it('should activate successfully', async () => {
      await expect(plugin.activate(mockContext)).resolves.not.toThrow();
    });

    it('should deactivate successfully', async () => {
      await expect(plugin.deactivate()).resolves.not.toThrow();
    });
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin information', () => {
      expect(plugin.name).toBe('${originalName}');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('${baseName}');
      expect(plugin.author).toBe('AI-First SaaS');
    });
  });

  describe('Event Listeners', () => {
    it('should register event listeners', () => {
      const listeners = plugin.getEventListeners();
      expect(listeners).toHaveLength(2);
      expect(listeners[0].eventType).toContain('auth');
      expect(listeners[1].eventType).toContain('tenant');
    });
  });${this.options.hasStore ? `

  describe('Store Registration', () => {
    it('should register plugin store', () => {
      const stores = plugin.registerStores(mockContext);
      expect(stores).toHaveProperty('${baseNameLower}');
      expect(typeof stores.${baseNameLower}).toBe('function');
    });
  });` : ''}${this.options.withRoutes ? `

  describe('Route Registration', () => {
    it('should register plugin routes', () => {
      const routes = plugin.registerRoutes(mockContext);
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0]).toHaveProperty('path');
      expect(routes[0]).toHaveProperty('component');
    });
  });` : ''}
});
`;
  }

  getIndexTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Plugin Entry Point
 *
 * Main exports for the ${baseNameLower} plugin
 * Generated by AI-First SaaS React Starter CLI
 */

import { PluginManager } from '../../core/plugin-system/PluginManager';
import ${baseNameLower}Plugin from './${baseName}Plugin';

// Auto-register the plugin
PluginManager.register(${baseNameLower}Plugin);

// Export the main plugin
export { default as ${baseNameLower}Plugin } from './${baseName}Plugin';

// Export types
export * from './types';

// Export services
export { ${baseName}Service } from './services/${baseNameLower}Service';

// Export store
export { use${baseName}Store, initialize${baseName}Store } from './stores/${baseName}Store';

// Export components
export * from './components';

// Export API helpers
export { ${baseName}BackendHelper } from './api/backendHelper';
export { ${baseName}MockHandlers } from './api/mockHandlers';

// For backward compatibility
export default ${baseNameLower}Plugin;
export { ${baseNameLower}Plugin as ${baseNameLower}ManagementPlugin };

// Plugin metadata
export const ${upperName}_PLUGIN_INFO = {
  name: '${originalName}',
  version: '1.0.0',
  type: '${this.options.type}',
  features: ['api', 'store', 'components', 'types', 'services']
};
`;
  }

  getEventImports() {
    return 'AUTH_EVENTS, TENANT_EVENTS';
  }

  getFeaturesList() {
    const features = [this.options.type];
    if (this.options.hasStore) features.push('store');
    if (this.options.withRoutes) features.push('routing');
    if (this.options.withComponents) features.push('ui');
    return features.map(f => `'${f}'`).join(', ');
  }

  getEndpointsTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} API Endpoints
 *
 * Centralized endpoint definitions for ${originalName} operations
 * Generated by AI-First SaaS React Starter CLI
 */

export const ${upperName}_ENDPOINTS = {
  // ${baseName} operations
  LIST: '/${baseNameLower}s',
  GET: '/${baseNameLower}s/:${baseNameLower}Id',
  CREATE: '/${baseNameLower}s',
  UPDATE: '/${baseNameLower}s/:${baseNameLower}Id',
  DELETE: '/${baseNameLower}s/:${baseNameLower}Id',

  // Additional operations (customize as needed)
  BULK_CREATE: '/${baseNameLower}s/bulk',
  BULK_UPDATE: '/${baseNameLower}s/bulk',
  SEARCH: '/${baseNameLower}s/search',
} as const;

export type ${baseName}EndpointType = typeof ${upperName}_ENDPOINTS[keyof typeof ${upperName}_ENDPOINTS];
`;
  }

  getBackendHelperTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Backend Helper - API calls with mock/real backend switching
 *
 * Helper for making API calls for ${baseNameLower} management operations
 * Generated by AI-First SaaS React Starter CLI
 */

import { apiHelper } from '../../../core/api/apiHelper';
import { ${upperName}_ENDPOINTS } from './endpoints';
import { ${baseName}Item, Create${baseName}Request, Update${baseName}Request } from '../types';

// Dynamic import for mock handlers to avoid circular dependencies
let ${baseName}MockHandlers: any = null;
const isMockMode = () => process.env.REACT_APP_USE_MOCK_API === 'true';

const getMockHandlers = async () => {
  if (!${baseName}MockHandlers) {
    const module = await import('./mockHandlers');
    ${baseName}MockHandlers = module.default;
  }
  return ${baseName}MockHandlers;
};

/**
 * ${baseName} Backend Helper
 * Provides API functions for ${baseNameLower} operations
 */
export class ${baseName}BackendHelper {

  static async get${baseName}List(): Promise<${baseName}Item[]> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.get${baseName}List();
    }

    const response = await apiHelper.get(${upperName}_ENDPOINTS.LIST);
    return response.data as ${baseName}Item[];
  }

  static async get${baseName}(id: string): Promise<${baseName}Item> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.get${baseName}(id);
    }

    const response = await apiHelper.get(${upperName}_ENDPOINTS.GET.replace(':${baseNameLower}Id', id));
    return response.data as ${baseName}Item;
  }

  static async create${baseName}(data: Create${baseName}Request): Promise<${baseName}Item> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.create${baseName}(data);
    }

    const response = await apiHelper.post(${upperName}_ENDPOINTS.CREATE, data);
    return response.data as ${baseName}Item;
  }

  static async update${baseName}(id: string, data: Update${baseName}Request): Promise<${baseName}Item> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.update${baseName}(id, data);
    }

    const response = await apiHelper.put(${upperName}_ENDPOINTS.UPDATE.replace(':${baseNameLower}Id', id), data);
    return response.data as ${baseName}Item;
  }

  static async delete${baseName}(id: string): Promise<void> {
    if (isMockMode()) {
      const mockHandlers = await getMockHandlers();
      return mockHandlers.delete${baseName}(id);
    }

    await apiHelper.delete(${upperName}_ENDPOINTS.DELETE.replace(':${baseNameLower}Id', id));
  }
}

export default ${baseName}BackendHelper;
`;
  }

  getMockHandlersTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Mock Handlers
 *
 * Mock API handlers for ${baseNameLower} operations during development
 * Generated by AI-First SaaS React Starter CLI
 */

import { ${baseName}Item, Create${baseName}Request, Update${baseName}Request } from '../types';

// Mock data storage
let mock${baseName}Items: ${baseName}Item[] = [
  {
    id: '1',
    name: 'Sample ${baseName}',
    description: 'This is a sample ${baseNameLower} item generated by the CLI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * ${baseName} Mock Handlers
 * Simulates backend API responses for development
 */
export class ${baseName}MockHandlers {

  static async get${baseName}List(): Promise<${baseName}Item[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mock${baseName}Items];
  }

  static async get${baseName}(id: string): Promise<${baseName}Item> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const item = mock${baseName}Items.find(item => item.id === id);
    if (!item) {
      throw new Error(\`${baseName} with id \${id} not found\`);
    }
    return { ...item };
  }

  static async create${baseName}(data: Create${baseName}Request): Promise<${baseName}Item> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newItem: ${baseName}Item = {
      id: (mock${baseName}Items.length + 1).toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mock${baseName}Items.push(newItem);
    return { ...newItem };
  }

  static async update${baseName}(id: string, data: Update${baseName}Request): Promise<${baseName}Item> {
    await new Promise(resolve => setTimeout(resolve, 350));

    const index = mock${baseName}Items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(\`${baseName} with id \${id} not found\`);
    }

    const updatedItem: ${baseName}Item = {
      ...mock${baseName}Items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    mock${baseName}Items[index] = updatedItem;
    return { ...updatedItem };
  }

  static async delete${baseName}(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 250));

    const index = mock${baseName}Items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(\`${baseName} with id \${id} not found\`);
    }

    mock${baseName}Items.splice(index, 1);
  }
}

export default ${baseName}MockHandlers;
`;
  }

  getServiceTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;

    return `/**
 * @fileoverview ${baseName} Service
 *
 * Business logic layer for ${baseNameLower} operations
 * Generated by AI-First SaaS React Starter CLI
 */

import { ${baseName}BackendHelper } from '../api/backendHelper';
import { ${baseName}Item, Create${baseName}Request, Update${baseName}Request } from '../types';

/**
 * ${baseName} Service
 * Provides business logic for ${baseNameLower} operations
 */
export class ${baseName}Service {

  /**
   * Get all ${baseNameLower} items
   */
  static async getAll(): Promise<${baseName}Item[]> {
    try {
      return await ${baseName}BackendHelper.get${baseName}List();
    } catch (error) {
      console.error('Error fetching ${baseNameLower} list:', error);
      throw new Error('Failed to fetch ${baseNameLower} list');
    }
  }

  /**
   * Get a single ${baseNameLower} item by ID
   */
  static async getById(id: string): Promise<${baseName}Item> {
    try {
      return await ${baseName}BackendHelper.get${baseName}(id);
    } catch (error) {
      console.error(\`Error fetching ${baseNameLower} \${id}:\`, error);
      throw new Error(\`Failed to fetch ${baseNameLower} with id \${id}\`);
    }
  }

  /**
   * Create a new ${baseNameLower} item
   */
  static async create(data: Create${baseName}Request): Promise<${baseName}Item> {
    try {
      // Add any business logic validation here
      if (!data.name || data.name.trim() === '') {
        throw new Error('${baseName} name is required');
      }

      return await ${baseName}BackendHelper.create${baseName}(data);
    } catch (error) {
      console.error('Error creating ${baseNameLower}:', error);
      throw error;
    }
  }

  /**
   * Update a ${baseNameLower} item
   */
  static async update(id: string, data: Update${baseName}Request): Promise<${baseName}Item> {
    try {
      // Add any business logic validation here
      if (data.name !== undefined && data.name.trim() === '') {
        throw new Error('${baseName} name cannot be empty');
      }

      return await ${baseName}BackendHelper.update${baseName}(id, data);
    } catch (error) {
      console.error(\`Error updating ${baseNameLower} \${id}:\`, error);
      throw error;
    }
  }

  /**
   * Delete a ${baseNameLower} item
   */
  static async delete(id: string): Promise<void> {
    try {
      await ${baseName}BackendHelper.delete${baseName}(id);
    } catch (error) {
      console.error(\`Error deleting ${baseNameLower} \${id}:\`, error);
      throw new Error(\`Failed to delete ${baseNameLower} with id \${id}\`);
    }
  }
}

export default ${baseName}Service;
`;
  }

  getTypesTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;
    return `/**
 * @fileoverview ${baseName} Types
 *
 * TypeScript type definitions for ${baseNameLower} plugin
 * Generated by AI-First SaaS React Starter CLI
 */

// Base ${baseName} item interface
export interface ${baseName}Item {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Request types for API operations
export interface Create${baseName}Request {
  name: string;
  description?: string;
}

export interface Update${baseName}Request {
  name?: string;
  description?: string;
}

// Event types for ${baseName} plugin
export const ${upperName}_EVENTS = {
  ITEM_CREATED: '${baseNameLower}.item.created',
  ITEM_UPDATED: '${baseNameLower}.item.updated',
  ITEM_DELETED: '${baseNameLower}.item.deleted',
  LIST_LOADED: '${baseNameLower}.list.loaded',
} as const;

export type ${baseName}EventType = typeof ${upperName}_EVENTS[keyof typeof ${upperName}_EVENTS];

// Event payload types
export interface ${baseName}ItemCreatedPayload {
  item: ${baseName}Item;
}

export interface ${baseName}ItemUpdatedPayload {
  item: ${baseName}Item;
  previousData: Partial<${baseName}Item>;
}

export interface ${baseName}ItemDeletedPayload {
  itemId: string;
}

export interface ${baseName}ListLoadedPayload {
  items: ${baseName}Item[];
  count: number;
}
`;
  }

  getComponentsIndexTemplate(nameparts) {
    const { originalName, baseName, baseNameLower, kebabName, upperName } = nameparts;
    return `/**
 * @fileoverview ${baseName} Components Exports
 *
 * Component exports for the ${baseNameLower} plugin
 * Generated by AI-First SaaS React Starter CLI
 */

export { ${baseName}Dashboard } from './${baseName}Dashboard';

// Add more component exports as you create them
// export { ${baseName}Form } from './${baseName}Form';
// export { ${baseName}List } from './${baseName}List';
`;
  }
}

/**
 * Generate a new plugin
 */
async function generatePlugin(pluginName, options = {}) {
  const generator = new PluginGenerator(options);
  await generator.generate(pluginName);
}

module.exports = {
  PluginGenerator,
  generatePlugin
};