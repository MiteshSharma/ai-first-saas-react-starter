/**
 * @fileoverview Plugin Testing Utilities
 * Helper functions and mocks for testing plugins and the plugin system
 * @jest-environment node
 */

import { EventBus } from './EventBus';
import { PluginManager } from './PluginManager';
import { Plugin, PluginContext } from './pluginTypes';

// Mock LocalStorage for testing
export class MockLocalStorage {
  private store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Mock Plugin for testing
export class MockPlugin implements Plugin {
  name: string;
  version: string;
  description?: string;
  author?: string;

  // Mock methods
  install = jest.fn();
  activate = jest.fn();
  deactivate = jest.fn();
  getEventListeners = jest.fn(() => []);
  registerStores = jest.fn(() => ({}));
  registerRoutes = jest.fn(() => []);
  registerComponents = jest.fn(() => ({}));

  constructor(name: string = 'MockPlugin', version: string = '1.0.0') {
    this.name = name;
    this.version = version;
    this.description = `Mock plugin ${name}`;
    this.author = 'Test Suite';
  }

  // Helper to reset all mocks
  resetMocks(): void {
    this.install.mockReset();
    this.activate.mockReset();
    this.deactivate.mockReset();
    this.getEventListeners.mockReset();
    this.registerStores.mockReset();
    this.registerRoutes.mockReset();
    this.registerComponents.mockReset();
  }
}

// Plugin Test Environment
export class PluginTestEnvironment {
  private eventBus: EventBus;
  private pluginManager: PluginManager;
  private mockLocalStorage: MockLocalStorage;

  constructor() {
    this.eventBus = new EventBus();
    this.pluginManager = new PluginManager(this.eventBus);
    this.mockLocalStorage = new MockLocalStorage();

    // Mock localStorage globally
    (global as any).localStorage = this.mockLocalStorage;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  getMockLocalStorage(): MockLocalStorage {
    return this.mockLocalStorage;
  }

  // Register core stores and services for testing
  setupCoreEnvironment(): void {
    // Mock core stores
    const mockAuthStore = {
      getState: () => ({ user: null, isAuthenticated: false }),
      subscribe: jest.fn(),
      setState: jest.fn()
    };

    const mockTenantStore = {
      getState: () => ({ currentTenant: null, tenants: [] }),
      subscribe: jest.fn(),
      setState: jest.fn()
    };

    // Mock core services
    const mockApiService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };

    const mockNotificationService = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn()
    };

    // Register with plugin manager
    this.pluginManager.registerCoreStore('authStore', mockAuthStore);
    this.pluginManager.registerCoreStore('tenantStore', mockTenantStore);
    this.pluginManager.registerCoreService('apiService', mockApiService);
    this.pluginManager.registerCoreService('notificationService', mockNotificationService);
  }

  // Create a plugin instance for testing
  async createTestPlugin(
    pluginClass: new () => Plugin,
    autoActivate: boolean = true
  ): Promise<{ plugin: Plugin; context: PluginContext }> {
    const plugin = new pluginClass();
    await this.pluginManager.installPlugin(plugin);

    if (autoActivate) {
      await this.pluginManager.activatePlugin(plugin.name);
    }

    // Return both plugin and its context
    const context = (this.pluginManager as any).pluginContexts.get(plugin.name);
    return { plugin, context };
  }

  // Simulate events for testing
  emitTestEvent(eventType: string, payload: any, source: string = 'TestSuite'): void {
    this.eventBus.emit(eventType, payload, source);
  }

  // Wait for async operations in tests
  async waitForNextTick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  // Clean up after tests
  cleanup(): void {
    this.eventBus.clearHistory();
    this.mockLocalStorage.clear();

    // Reset singleton
    (PluginManager as any).instance = null;

    // Clear console mocks if any
    if (jest.isMockFunction(console.log)) {
      (console.log as jest.Mock).mockClear();
    }
    if (jest.isMockFunction(console.error)) {
      (console.error as jest.Mock).mockClear();
    }
  }
}

// Event testing utilities
export class EventTestUtils {
  private eventBus: EventBus;
  private listeners: Map<string, jest.Mock[]> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  // Create a spy listener for an event type
  spyOnEvent(eventType: string): jest.Mock {
    const spy = jest.fn();
    this.eventBus.on(eventType, spy);

    // Track spies for cleanup
    const existingSpies = this.listeners.get(eventType) || [];
    existingSpies.push(spy);
    this.listeners.set(eventType, existingSpies);

    return spy;
  }

  // Wait for a specific number of events
  async waitForEvents(eventType: string, count: number, timeout: number = 1000): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const events: any[] = [];
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${count} events of type ${eventType}`));
      }, timeout);

      const listener = (event: any) => {
        events.push(event);
        if (events.length >= count) {
          clearTimeout(timer);
          this.eventBus.off(eventType, listener);
          resolve(events);
        }
      };

      this.eventBus.on(eventType, listener);
    });
  }

  // Verify event was emitted with specific payload
  expectEventEmitted(eventType: string, expectedPayload?: any): void {
    const history = this.eventBus.getEventHistory();
    const matchingEvents = history.filter(event => event.type === eventType);

    expect(matchingEvents.length).toBeGreaterThan(0);

    if (expectedPayload) {
      const matchingPayload = matchingEvents.find(event =>
        JSON.stringify(event.payload) === JSON.stringify(expectedPayload)
      );
      expect(matchingPayload).toBeDefined();
    }
  }

  // Verify event was NOT emitted
  expectEventNotEmitted(eventType: string): void {
    const history = this.eventBus.getEventHistory();
    const matchingEvents = history.filter(event => event.type === eventType);
    expect(matchingEvents.length).toBe(0);
  }

  // Get all events of a specific type from history
  getEventsOfType(eventType: string): any[] {
    return this.eventBus.getEventHistory().filter(event => event.type === eventType);
  }

  // Clean up all spies
  cleanup(): void {
    for (const [eventType, spies] of this.listeners) {
      spies.forEach(spy => this.eventBus.off(eventType, spy));
    }
    this.listeners.clear();
  }
}

// Component testing utilities for plugin UI components
export const createMockPluginContext = (overrides: Partial<PluginContext> = {}): PluginContext => {
  const eventBus = new EventBus();

  return {
    getCoreStore: jest.fn().mockImplementation((storeName: string) => {
      // Return mock stores based on name
      switch (storeName) {
        case 'authStore':
          return { getState: () => ({ user: null, isAuthenticated: false }) };
        case 'tenantStore':
          return { getState: () => ({ currentTenant: null, tenants: [] }) };
        default:
          throw new Error(`Mock store '${storeName}' not found`);
      }
    }),
    getCoreService: jest.fn().mockImplementation((serviceName: string) => {
      // Return mock services based on name
      switch (serviceName) {
        case 'apiService':
          return { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
        case 'notificationService':
          return { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
        default:
          throw new Error(`Mock service '${serviceName}' not found`);
      }
    }),
    emit: jest.fn().mockImplementation((eventType: string, payload: any) => {
      eventBus.emit(eventType, payload, 'MockPlugin');
    }),
    on: jest.fn().mockImplementation((eventType: string, listener: Function) => {
      return eventBus.on(eventType, listener);
    }),
    off: jest.fn().mockImplementation((eventType: string, listener: Function) => {
      eventBus.off(eventType, listener);
    }),
    pluginName: 'MockPlugin',
    pluginVersion: '1.0.0',
    ...overrides
  };
};

// Mock React testing utilities
export const mockReactTestingLibrary = {
  render: jest.fn(),
  screen: {
    getByText: jest.fn(),
    getByRole: jest.fn(),
    queryByText: jest.fn(),
    findByText: jest.fn()
  },
  fireEvent: {
    click: jest.fn(),
    change: jest.fn(),
    submit: jest.fn()
  },
  waitFor: jest.fn()
};

// Export commonly used testing constants
export const TEST_EVENTS = {
  TEST_EVENT: 'test.event',
  TEST_ERROR: 'test.error',
  TEST_SUCCESS: 'test.success'
} as const;

export const TEST_PLUGIN_CONFIGS = {
  BASIC: {
    name: 'TestPlugin',
    pluginClass: MockPlugin,
    autoLoad: true,
    enabled: true
  },
  DISABLED: {
    name: 'DisabledPlugin',
    pluginClass: MockPlugin,
    autoLoad: false,
    enabled: false
  }
} as const;