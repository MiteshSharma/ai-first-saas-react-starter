/**
 * @fileoverview Plugin Test Helper
 * Utilities for testing individual plugins in isolation
 */

import { EventBus } from './EventBus';
import { PluginManager } from './PluginManager';
import { Plugin, PluginContext } from './pluginTypes';

export interface PluginTestSetup {
  plugin: Plugin;
  context: PluginContext;
  eventBus: EventBus;
  pluginManager: PluginManager;
  emittedEvents: Array<{ type: string; payload: any; source: string }>;
  receivedEvents: Array<{ type: string; payload: any }>;
}

/**
 * Creates an isolated test environment for a single plugin
 */
export async function setupPluginTest(
  PluginClass: new () => Plugin,
  options: {
    coreStores?: Record<string, any>;
    coreServices?: Record<string, any>;
    autoActivate?: boolean;
  } = {}
): Promise<PluginTestSetup> {
  const eventBus = new EventBus();
  const pluginManager = new PluginManager(eventBus);

  // Track emitted events
  const emittedEvents: Array<{ type: string; payload: any; source: string }> = [];
  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = (type: string, payload: any, source: string) => {
    emittedEvents.push({ type, payload, source });
    originalEmit(type, payload, source);
  };

  // Track received events
  const receivedEvents: Array<{ type: string; payload: any }> = [];

  // Register core stores and services
  if (options.coreStores) {
    Object.entries(options.coreStores).forEach(([name, store]) => {
      pluginManager.registerCoreStore(name, store);
    });
  }

  if (options.coreServices) {
    Object.entries(options.coreServices).forEach(([name, service]) => {
      pluginManager.registerCoreService(name, service);
    });
  }

  // Create and install plugin
  const plugin = new PluginClass();
  await pluginManager.installPlugin(plugin);

  // Get plugin context
  const context = (pluginManager as any).pluginContexts.get(plugin.name);

  // Optionally activate plugin
  if (options.autoActivate !== false) {
    await pluginManager.activatePlugin(plugin.name);
  }

  // Setup event tracking for the plugin
  if (plugin.getEventListeners) {
    plugin.getEventListeners().forEach(({ eventType }) => {
      eventBus.on(eventType, (event) => {
        receivedEvents.push({ type: eventType, payload: event.payload });
      });
    });
  }

  return {
    plugin,
    context,
    eventBus,
    pluginManager,
    emittedEvents,
    receivedEvents
  };
}

/**
 * Simulates an event and waits for async processing
 */
export async function simulateEvent(
  setup: PluginTestSetup,
  eventType: string,
  payload: any,
  source: string = 'TestSource',
  waitMs: number = 10
): Promise<void> {
  setup.eventBus.emit(eventType, payload, source);
  await new Promise(resolve => setTimeout(resolve, waitMs));
}

/**
 * Verifies that a plugin emitted specific events
 */
export function expectEventEmitted(
  setup: PluginTestSetup,
  eventType: string,
  payload?: any
): void {
  const matchingEvents = setup.emittedEvents.filter(e => e.type === eventType);

  expect(matchingEvents.length).toBeGreaterThan(0);

  if (payload !== undefined) {
    const found = matchingEvents.some(e =>
      JSON.stringify(e.payload) === JSON.stringify(payload)
    );
    expect(found).toBe(true);
  }
}

/**
 * Verifies that a plugin did not emit specific events
 */
export function expectEventNotEmitted(
  setup: PluginTestSetup,
  eventType: string
): void {
  const matchingEvents = setup.emittedEvents.filter(e => e.type === eventType);
  expect(matchingEvents.length).toBe(0);
}

/**
 * Creates mock core stores for testing
 */
export function createMockCoreStores() {
  return {
    authStore: {
      getState: jest.fn(() => ({
        user: null,
        isAuthenticated: false,
        token: null
      })),
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn())
    },
    tenantStore: {
      getState: jest.fn(() => ({
        currentTenant: null,
        tenants: []
      })),
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn())
    }
  };
}

/**
 * Creates mock core services for testing
 */
export function createMockCoreServices() {
  return {
    apiService: {
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} })
    },
    notificationService: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn()
    }
  };
}

/**
 * Waits for a plugin to reach a specific state
 */
export async function waitForPluginState(
  setup: PluginTestSetup,
  checkFn: () => boolean,
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();

  while (!checkFn()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for plugin state');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Cleans up plugin test environment
 */
export async function cleanupPluginTest(setup: PluginTestSetup): Promise<void> {
  try {
    await setup.pluginManager.deactivatePlugin(setup.plugin.name);
  } catch {
    // Plugin might not be active
  }

  setup.eventBus.clearHistory();
  setup.emittedEvents.length = 0;
  setup.receivedEvents.length = 0;
}

/**
 * Test fixture for plugin lifecycle
 */
export class PluginTestFixture {
  private setups: PluginTestSetup[] = [];

  async createPlugin<T extends Plugin>(
    PluginClass: new () => T,
    options?: Parameters<typeof setupPluginTest>[1]
  ): Promise<PluginTestSetup & { plugin: T }> {
    const setup = await setupPluginTest(PluginClass, options);
    this.setups.push(setup);
    return setup as PluginTestSetup & { plugin: T };
  }

  async cleanupAll(): Promise<void> {
    await Promise.all(this.setups.map(setup => cleanupPluginTest(setup)));
    this.setups = [];
  }
}