# Testing Guide

This guide covers the comprehensive testing strategy for the AI-First SaaS React Starter framework, including unit testing, component testing, plugin testing, and end-to-end testing.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [Component Testing](#component-testing)
- [Plugin Testing](#plugin-testing)
- [Event Testing](#event-testing)
- [API Testing](#api-testing)
- [E2E Testing](#e2e-testing)
- [Test Utilities](#test-utilities)
- [Mocking Strategies](#mocking-strategies)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Testing Philosophy

Our testing strategy follows a pyramid approach:

```
    /\     E2E Tests (Few)
   /  \    - User workflows
  /    \   - Critical paths
 /______\  - Plugin integration
/        \ Integration Tests (Some)
|        | - API endpoints
|        | - Event flows
|        | - Store interactions
|________| Unit Tests (Many)
           - Pure functions
           - Components
           - Services
           - Utilities
```

### Core Principles

1. **Test Pyramid**: Many unit tests, some integration tests, few E2E tests
2. **Plugin Isolation**: Each plugin should be testable in isolation
3. **Event-Driven Testing**: Test event flows and reactions
4. **Mock External Dependencies**: Use mocks for APIs, storage, and external services
5. **Test Behavior, Not Implementation**: Focus on what the code does, not how

## Test Structure

```
src/
├── plugins/
│   └── UserManagement/
│       ├── __tests__/
│       │   ├── components/
│       │   │   ├── UserList.test.tsx
│       │   │   └── UserForm.test.tsx
│       │   ├── services/
│       │   │   └── userService.test.ts
│       │   ├── stores/
│       │   │   └── userStore.test.ts
│       │   └── integration/
│       │       └── userWorkflow.test.tsx
├── core/
│   ├── __tests__/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── plugins/
│   │   └── stores/
└── utils/
    └── test/
        ├── setup.ts
        ├── helpers.tsx
        ├── mocks.ts
        └── factories.ts
```

## Unit Testing

### Testing Core Services

```typescript
// src/core/auth/__tests__/authService.test.ts
import { authService } from '../authService';
import { apiService } from '../../api/apiService';
import { eventBus } from '../../events/eventBus';

jest.mock('../../api/apiService');
jest.mock('../../events/eventBus');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockEventBus = eventBus as jest.Mocked<typeof eventBus>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user and emit login event', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password' };
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };

      mockApiService.post.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'jwt-token' }
      });

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(mockApiService.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(mockEventBus.emit).toHaveBeenCalledWith('auth:login', mockUser);
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockUser);
    });

    it('should handle login failure', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrong' };

      mockApiService.post.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockEventBus.emit).not.toHaveBeenCalledWith('auth:login', expect.anything());
    });
  });
});
```

### Testing Zustand Stores

```typescript
// src/core/stores/base/__tests__/baseStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { createBaseStore } from '../createBaseStore';

interface TestItem {
  id: string;
  name: string;
}

const useTestStore = createBaseStore<TestItem>('test');

describe('BaseStore', () => {
  beforeEach(() => {
    act(() => {
      useTestStore.getState().reset();
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTestStore());

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetchAll lifecycle', async () => {
    const mockItems: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ];

    const { result } = renderHook(() => useTestStore());

    // Start loading
    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    // Set items
    act(() => {
      result.current.setItems(mockItems);
      result.current.setLoading(false);
    });

    expect(result.current.items).toEqual(mockItems);
    expect(result.current.loading).toBe(false);
  });

  it('should handle error states', () => {
    const { result } = renderHook(() => useTestStore());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });
});
```

## Component Testing

### Testing React Components

```typescript
// src/plugins/UserManagement/__tests__/components/UserList.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserList } from '../../components/UserList';
import { TestWrapper } from '../../../../utils/test/helpers';
import { userFactory } from '../../../../utils/test/factories';

const mockUsers = [
  userFactory({ id: '1', name: 'John Doe', email: 'john@example.com' }),
  userFactory({ id: '2', name: 'Jane Smith', email: 'jane@example.com' })
];

jest.mock('../../stores/userStore', () => ({
  useUserStore: () => ({
    users: mockUsers,
    loading: false,
    error: null,
    fetchUsers: jest.fn(),
    deleteUser: jest.fn()
  })
}));

describe('UserList', () => {
  it('should render user list', () => {
    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should handle user deletion', async () => {
    const mockDeleteUser = jest.fn();

    jest.mocked(require('../../stores/userStore').useUserStore).mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: jest.fn(),
      deleteUser: mockDeleteUser
    });

    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByLabelText('Delete user');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText('Yes, delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('1');
    });
  });

  it('should show loading state', () => {
    jest.mocked(require('../../stores/userStore').useUserStore).mockReturnValue({
      users: [],
      loading: true,
      error: null,
      fetchUsers: jest.fn(),
      deleteUser: jest.fn()
    });

    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Testing Forms

```typescript
// src/plugins/UserManagement/__tests__/components/UserForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '../../components/UserForm';
import { TestWrapper } from '../../../../utils/test/helpers';

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('UserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Fill form
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.selectOptions(screen.getByLabelText('Role'), 'admin');

    // Submit
    fireEvent.click(screen.getByText('Save User'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
      });
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Submit empty form
    fireEvent.click(screen.getByText('Save User'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
```

## Plugin Testing

### Plugin Integration Tests

```typescript
// src/plugins/UserManagement/__tests__/integration/userWorkflow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementPlugin } from '../../UserManagementPlugin';
import { TestWrapper } from '../../../../utils/test/helpers';
import { setupPluginTest } from '../../../../utils/test/pluginHelpers';

describe('User Management Workflow', () => {
  beforeEach(async () => {
    await setupPluginTest();
  });

  it('should complete full CRUD workflow', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <UserManagementPlugin />
      </TestWrapper>
    );

    // Create user
    fireEvent.click(screen.getByText('Add User'));

    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');

    fireEvent.click(screen.getByText('Save User'));

    // Verify user created
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Edit user
    fireEvent.click(screen.getByLabelText('Edit user'));

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Updated User');

    fireEvent.click(screen.getByText('Save User'));

    // Verify user updated
    await waitFor(() => {
      expect(screen.getByText('Updated User')).toBeInTheDocument();
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    // Delete user
    fireEvent.click(screen.getByLabelText('Delete user'));
    fireEvent.click(screen.getByText('Yes, delete'));

    // Verify user deleted
    await waitFor(() => {
      expect(screen.queryByText('Updated User')).not.toBeInTheDocument();
    });
  });
});
```

### Plugin Lifecycle Testing

```typescript
// src/core/plugins/__tests__/pluginManager.test.ts
import { PluginManager } from '../PluginManager';
import { eventBus } from '../../events/eventBus';
import { UserManagementPlugin } from '../../../plugins/UserManagement/UserManagementPlugin';

jest.mock('../../events/eventBus');

describe('PluginManager', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
    jest.clearAllMocks();
  });

  it('should install and activate plugin', async () => {
    // Install
    await pluginManager.install('user-management', UserManagementPlugin);

    expect(eventBus.emit).toHaveBeenCalledWith('plugin:installed', {
      id: 'user-management',
      name: 'User Management'
    });

    // Activate
    await pluginManager.activate('user-management');

    expect(eventBus.emit).toHaveBeenCalledWith('plugin:activated', {
      id: 'user-management'
    });

    expect(pluginManager.isActive('user-management')).toBe(true);
  });

  it('should deactivate and uninstall plugin', async () => {
    // Setup
    await pluginManager.install('user-management', UserManagementPlugin);
    await pluginManager.activate('user-management');

    // Deactivate
    await pluginManager.deactivate('user-management');

    expect(eventBus.emit).toHaveBeenCalledWith('plugin:deactivated', {
      id: 'user-management'
    });

    expect(pluginManager.isActive('user-management')).toBe(false);

    // Uninstall
    await pluginManager.uninstall('user-management');

    expect(eventBus.emit).toHaveBeenCalledWith('plugin:uninstalled', {
      id: 'user-management'
    });

    expect(pluginManager.isInstalled('user-management')).toBe(false);
  });
});
```

## Event Testing

### Testing Event Flows

```typescript
// src/core/events/__tests__/eventBus.test.ts
import { EventBus } from '../EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should emit and receive events', () => {
    const handler = jest.fn();

    eventBus.on('test:event', handler);
    eventBus.emit('test:event', { data: 'test' });

    expect(handler).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should support multiple handlers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    eventBus.on('test:event', handler1);
    eventBus.on('test:event', handler2);
    eventBus.emit('test:event', { data: 'test' });

    expect(handler1).toHaveBeenCalledWith({ data: 'test' });
    expect(handler2).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should unsubscribe handlers', () => {
    const handler = jest.fn();

    const unsubscribe = eventBus.on('test:event', handler);
    unsubscribe();
    eventBus.emit('test:event', { data: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });
});
```

### Testing Event Middleware

```typescript
// src/core/events/__tests__/eventMiddleware.test.ts
import { EventBus } from '../EventBus';
import { createLoggingMiddleware } from '../middleware/loggingMiddleware';

describe('Event Middleware', () => {
  let eventBus: EventBus;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    eventBus = new EventBus();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log events through middleware', () => {
    const loggingMiddleware = createLoggingMiddleware();
    eventBus.use(loggingMiddleware);

    eventBus.emit('test:event', { data: 'test' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Event]',
      'test:event',
      { data: 'test' }
    );
  });
});
```

## API Testing

### Testing API Services

```typescript
// src/core/api/__tests__/apiService.test.ts
import { apiService } from '../apiService';
import { authService } from '../../auth/authService';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

jest.mock('../../auth/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('mock-token');
  });

  it('should make GET request with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    } as Response);

    const result = await apiService.get('/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      }
    });

    expect(result).toEqual({ success: true, data: { data: 'test' } });
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request' })
    } as Response);

    const result = await apiService.get('/test');

    expect(result).toEqual({
      success: false,
      error: 'Bad request',
      status: 400
    });
  });
});
```

## E2E Testing

### Cypress Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    REACT_APP_USE_MOCK_API: 'true'
  }
});
```

### E2E Test Examples

```typescript
// cypress/e2e/user-management.cy.ts
describe('User Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login(); // Custom command
  });

  it('should create a new user', () => {
    cy.visit('/users');

    cy.get('[data-testid="add-user-button"]').click();

    cy.get('[data-testid="user-name-input"]').type('John Doe');
    cy.get('[data-testid="user-email-input"]').type('john@example.com');
    cy.get('[data-testid="user-role-select"]').select('admin');

    cy.get('[data-testid="save-user-button"]').click();

    cy.get('[data-testid="user-list"]').should('contain', 'John Doe');
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should edit existing user', () => {
    cy.visit('/users');

    cy.get('[data-testid="user-row"]').first().find('[data-testid="edit-button"]').click();

    cy.get('[data-testid="user-name-input"]').clear().type('Jane Smith');
    cy.get('[data-testid="save-user-button"]').click();

    cy.get('[data-testid="user-list"]').should('contain', 'Jane Smith');
  });
});
```

### Custom Cypress Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      createUser(userData: any): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth-token', 'mock-jwt-token');
    win.localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }));
  });
});

Cypress.Commands.add('createUser', (userData) => {
  cy.request('POST', '/api/users', userData);
});
```

## Test Utilities

### Test Wrapper

```typescript
// src/utils/test/helpers.tsx
import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { EventBusProvider } from '../../core/events/EventBusContext';
import { AuthProvider } from '../../core/auth/AuthContext';

interface TestWrapperProps {
  children: ReactNode;
}

export function TestWrapper({ children }: TestWrapperProps) {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <EventBusProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </EventBusProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export function renderWithProviders(ui: ReactNode) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}
```

### Factory Functions

```typescript
// src/utils/test/factories.ts
export function userFactory(overrides: Partial<User> = {}): User {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function pluginFactory(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    enabled: true,
    ...overrides
  };
}
```

### Plugin Test Helpers

```typescript
// src/utils/test/pluginHelpers.ts
import { PluginManager } from '../../core/plugins/PluginManager';
import { eventBus } from '../../core/events/eventBus';

export async function setupPluginTest() {
  // Reset plugin manager
  const pluginManager = PluginManager.getInstance();
  await pluginManager.reset();

  // Clear event listeners
  eventBus.removeAllListeners();

  // Setup mock API responses
  setupMockApi();
}

export function setupMockApi() {
  global.fetch = jest.fn().mockImplementation((url: string, options: any) => {
    // Mock different API endpoints
    if (url.includes('/api/users')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  });
}
```

## Mocking Strategies

### API Mocking

```typescript
// src/utils/test/mocks.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ]
    }));
  }),

  rest.post('/api/users', (req, res, ctx) => {
    return res(ctx.json({
      data: { id: '3', ...req.body }
    }));
  }),

  rest.delete('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
];

export const server = setupServer(...handlers);
```

### Store Mocking

```typescript
// src/utils/test/storeMocks.ts
export function createMockStore<T>(initialState: Partial<T> = {}) {
  return {
    ...initialState,
    loading: false,
    error: null,
    setLoading: jest.fn(),
    setError: jest.fn(),
    reset: jest.fn()
  };
}

export const mockUserStore = createMockStore({
  users: [],
  currentUser: null,
  fetchUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn()
});
```

## Coverage Requirements

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/utils/test/setup.ts']
};
```

### Test Setup

```typescript
// src/utils/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks';

// MSW setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open"
  }
}
```

## Best Practices

### Testing Guidelines

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Test Names**: Use descriptive names that explain the scenario
3. **One Assertion**: Focus on one behavior per test
4. **Mock Dependencies**: Mock external dependencies and side effects
5. **Test Data**: Use factories for consistent test data
6. **Cleanup**: Always cleanup after tests to avoid side effects

### Common Patterns

```typescript
describe('Component/Service Name', () => {
  // Setup and teardown
  beforeEach(() => {
    // Setup common test state
  });

  afterEach(() => {
    // Cleanup
  });

  describe('specific functionality', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = 'test input';
      const expected = 'expected output';

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Performance Testing

```typescript
// Performance test example
it('should handle large datasets efficiently', () => {
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: i.toString(),
    name: `Item ${i}`
  }));

  const start = performance.now();

  const result = processLargeDataset(largeDataset);

  const end = performance.now();
  const duration = end - start;

  expect(duration).toBeLessThan(100); // Should complete in under 100ms
  expect(result).toHaveLength(10000);
});
```

This comprehensive testing guide ensures that all aspects of the AI-First SaaS React Starter framework are thoroughly tested, from individual components to complete user workflows.