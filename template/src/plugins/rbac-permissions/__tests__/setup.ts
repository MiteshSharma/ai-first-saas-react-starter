/**
 * @fileoverview Test Setup for RBAC Plugin
 *
 * Global test configuration and setup for RBAC tests
 */

import '@testing-library/jest-dom';

// Mock MSW (Mock Service Worker) - minimal setup for tests
import { setupServer } from 'msw/node';

// Setup MSW server with empty handlers (no API calls anymore)
export const server = setupServer();

// Start server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Mock zustand persist to avoid localStorage issues in tests
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  setTimeout(callback, 0);
  return 0;
};

// Mock cancelAnimationFrame
global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock URL.createObjectURL and URL.revokeObjectURL for file download tests
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock createElement for dynamic link creation in export functions
const originalCreateElement = document.createElement;
document.createElement = jest.fn().mockImplementation((tagName: string) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: jest.fn(),
      style: {},
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
    };
  }
  return originalCreateElement.call(document, tagName);
});

// Helper function to create mock user context
export const createMockContext = (overrides = {}) => ({
  userId: 'test-user',
  tenantId: 'test-tenant',
  workspaceId: 'test-workspace',
  ...overrides,
});

// Helper function to create mock permission
export const createMockPermission = (overrides = {}) => ({
  id: 'test.permission',
  name: 'Test Permission',
  description: 'A test permission',
  action: 'read' as const,
  resource: 'test' as const,
  scope: 'workspace' as const,
  category: 'Test',
  isSystem: false,
  granted: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper function to create mock role
export const createMockRole = (overrides = {}) => ({
  id: 'test-role',
  name: 'Test Role',
  description: 'A test role',
  permissions: ['test.permission'],
  isSystem: false,
  isActive: true,
  userCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper function to wait for async operations
export const waitForAsyncOperations = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Helper function to create mock store state
export const createMockStoreState = (overrides = {}) => ({
  permissions: [],
  userPermissions: [],
  loading: false,
  error: null,
  setPermissions: jest.fn(),
  setUserPermissionsFromEvent: jest.fn(),
  checkPermission: jest.fn(),
  checkMultiplePermissions: jest.fn(),
  clearError: jest.fn(),
  isPermissionApplicableToContext: jest.fn(),
  ...overrides,
});

// Helper to mock React hooks
export const mockHook = <T>(hook: () => T, mockImplementation: Partial<T>) => {
  return jest.mocked(hook).mockReturnValue({
    ...mockImplementation,
  } as T);
};

// Export common test utilities
export * from '@testing-library/react';
export * from '@testing-library/jest-dom';
export { act } from 'react';

// Custom render function with providers if needed
export const renderWithProviders = (
  ui: React.ReactElement,
  options: any = {}
) => {
  // For now, just use the standard render
  // In a full app, this would wrap with context providers
  const { render } = require('@testing-library/react');
  return render(ui, options);
};

// Test data constants
export const TEST_PERMISSIONS = [
  createMockPermission({ id: 'tenant.read', name: 'Read Tenant' }),
  createMockPermission({ id: 'tenant.update', name: 'Update Tenant' }),
  createMockPermission({ id: 'workspace.read', name: 'Read Workspace' }),
  createMockPermission({ id: 'workspace.manage', name: 'Manage Workspace' }),
];

export const TEST_ROLES = [
  createMockRole({
    id: 'admin',
    name: 'Administrator',
    permissions: ['tenant.read', 'tenant.update', 'workspace.read', 'workspace.manage'],
    isSystem: true,
  }),
  createMockRole({
    id: 'user',
    name: 'User',
    permissions: ['workspace.read'],
    isSystem: false,
  }),
];

export const TEST_CONTEXTS = {
  system: { userId: 'test-user' },
  tenant: { userId: 'test-user', tenantId: 'test-tenant' },
  workspace: { userId: 'test-user', tenantId: 'test-tenant', workspaceId: 'test-workspace' },
  resource: {
    userId: 'test-user',
    tenantId: 'test-tenant',
    workspaceId: 'test-workspace',
    resourceId: 'test-resource',
    resourceType: 'document',
  },
};