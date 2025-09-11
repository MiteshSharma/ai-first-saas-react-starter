# Testing Strategy

The AI-First React Framework provides a comprehensive testing strategy with Jest, React Testing Library, and best practices for unit, integration, and end-to-end testing.

## 🧪 Testing Philosophy

### Testing Pyramid
```
        /\
       /  \
      / E2E \
     /______\
    /        \
   /Integration\
  /_____________\
 /               \
/  Unit Tests     \
/__________________\
```

1. **Unit Tests (70%)**: Fast, isolated component and function tests
2. **Integration Tests (20%)**: Component interaction and store integration
3. **End-to-End Tests (10%)**: Full user workflow testing

## ⚙️ Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Setup File
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:3001';

// Mock modules
jest.mock('@services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Global test utilities
global.mockConsole = () => {
  const originalConsole = console;
  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  afterEach(() => {
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
};
```

## 🎨 Component Testing

### Basic Component Test
```typescript
// UserProfile.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
};

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockUser.avatar);
  });

  it('handles edit button click', () => {
    const mockOnEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it('shows loading state', () => {
    render(<UserProfile user={mockUser} loading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Component with Zustand Store
```typescript
// UserList.test.tsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useUserStore } from '@stores/useUserStore';
import { UserList } from './UserList';

// Mock the Zustand store
jest.mock('@stores/useUserStore');
const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;

describe('UserList', () => {
  const mockStore = {
    users: [],
    loading: false,
    error: null,
    fetchUsers: jest.fn(),
    deleteUser: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserStore.mockReturnValue(mockStore);
  });

  it('displays users when loaded', async () => {
    mockUseUserStore.mockReturnValue({
      ...mockStore,
      users: [mockUser],
    });
    
    render(<UserList />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseUserStore.mockReturnValue({
      ...mockStore,
      loading: true,
    });
    
    render(<UserList />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error message when error occurs', () => {
    mockUseUserStore.mockReturnValue({
      ...mockStore,
      error: 'Failed to load users',
    });
    
    render(<UserList />);

    expect(screen.getByText('Failed to load users')).toBeInTheDocument();
  });
});
```

## 🗄️ Store Testing

### Zustand Store Tests
```typescript
// useUserStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useUserStore } from './useUserStore';
import { userService } from '@services/UserService';

jest.mock('@services/UserService');
const mockUserService = userService as jest.Mocked<typeof userService>;

// Helper to create a fresh store instance for each test
const createStoreWrapper = () => {
  const { result } = renderHook(() => useUserStore());
  return result;
};

describe('useUserStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state before each test
    useUserStore.setState({
      users: [],
      loading: false,
      error: null,
    });
  });

  describe('fetchUsers', () => {
    it('loads users successfully', async () => {
      const mockUsers = [{ id: '1', name: 'John' }];
      mockUserService.getUsers.mockResolvedValue(mockUsers);
      
      const store = createStoreWrapper();

      await act(async () => {
        await store.current.fetchUsers();
      });

      expect(store.current.users).toEqual(mockUsers);
      expect(store.current.loading).toBe(false);
      expect(store.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      mockUserService.getUsers.mockRejectedValue(error);
      
      const store = createStoreWrapper();

      await act(async () => {
        await store.current.fetchUsers();
      });

      expect(store.current.users).toEqual([]);
      expect(store.current.loading).toBe(false);
      expect(store.current.error).toBe('Network error');
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockUserService.getUsers.mockReturnValue(promise);
      
      const store = createStoreWrapper();

      act(() => {
        store.current.fetchUsers();
      });

      expect(store.current.loading).toBe(true);
      
      // Resolve the promise
      act(() => {
        resolvePromise([]);
      });
    });
  });

  describe('selectors and computed values', () => {
    it('calculates active users correctly', () => {
      const store = createStoreWrapper();
      
      act(() => {
        useUserStore.setState({
          users: [
            { id: '1', name: 'John', isActive: true },
            { id: '2', name: 'Jane', isActive: false },
            { id: '3', name: 'Bob', isActive: true },
          ],
        });
      });

      const activeUsers = store.current.users.filter(user => user.isActive);
      expect(activeUsers).toHaveLength(2);
      expect(activeUsers[0].name).toBe('John');
    });

    it('returns user count', () => {
      const store = createStoreWrapper();
      
      act(() => {
        useUserStore.setState({
          users: [{ id: '1', name: 'John' }, { id: '2', name: 'Jane' }],
        });
      });

      expect(store.current.users.length).toBe(2);
    });
  });

  describe('actions', () => {
    it('adds user successfully', async () => {
      const newUser = { id: '1', name: 'John', email: 'john@example.com' };
      mockUserService.createUser.mockResolvedValue(newUser);
      
      const store = createStoreWrapper();

      await act(async () => {
        await store.current.addUser({ name: 'John', email: 'john@example.com' });
      });

      expect(store.current.users).toContainEqual(newUser);
    });

    it('removes user successfully', async () => {
      const store = createStoreWrapper();
      
      act(() => {
        useUserStore.setState({
          users: [{ id: '1', name: 'John' }, { id: '2', name: 'Jane' }],
        });
      });

      await act(async () => {
        await store.current.removeUser('1');
      });

      expect(store.current.users).toHaveLength(1);
      expect(store.current.users[0].id).toBe('2');
    });
  });
});
```

### Testing Store with Subscriptions
```typescript
// useUserStore.subscription.test.ts
import { renderHook } from '@testing-library/react';
import { useUserStore } from './useUserStore';

describe('useUserStore subscriptions', () => {
  it('notifies subscribers when state changes', () => {
    const { result } = renderHook(() => useUserStore());
    const callback = jest.fn();
    
    // Subscribe to state changes
    const unsubscribe = useUserStore.subscribe(callback);
    
    // Change state
    useUserStore.setState({ loading: true });
    
    expect(callback).toHaveBeenCalled();
    
    unsubscribe();
  });

  it('allows selective subscriptions', () => {
    const { result } = renderHook(() => 
      useUserStore(state => ({ users: state.users, loading: state.loading }))
    );
    
    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
```

## 🌐 Service Testing

### API Service Tests
```typescript
// UserService.test.ts
import { UserService } from './UserService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('fetches users successfully', async () => {
      const mockUsers = [{ id: '1', name: 'John' }];
      mockApiClient.get.mockResolvedValue({ data: mockUsers });

      const result = await service.getUsers();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockUsers);
    });

    it('handles API error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('createUser', () => {
    it('creates user with validation', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      const createdUser = { id: '1', ...userData };
      
      mockApiClient.post.mockResolvedValue({ data: createdUser });

      const result = await service.createUser(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(createdUser);
    });

    it('validates input data', async () => {
      const invalidData = { name: '', email: 'invalid-email' };

      await expect(service.createUser(invalidData)).rejects.toThrow();
    });
  });
});
```

## 🔗 Integration Testing

### Component + Store Integration
```typescript
// UserManagement.integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UserManagement } from './UserManagement';
import { useUserStore } from '@stores/useUserStore';
import { userService } from '@services/UserService';

jest.mock('@services/UserService');
const mockUserService = userService as jest.Mocked<typeof userService>;

// Mock the store hook
jest.mock('@stores/useUserStore');
const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;

describe('UserManagement Integration', () => {
  const mockStore = {
    users: [],
    loading: false,
    error: null,
    fetchUsers: jest.fn(),
    addUser: jest.fn(),
    removeUser: jest.fn(),
    updateUser: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserStore.mockReturnValue(mockStore);
  });

  it('loads and displays users on mount', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];
    
    mockUserService.getUsers.mockResolvedValue(mockUsers);
    mockUseUserStore.mockReturnValue({
      ...mockStore,
      users: mockUsers,
    });

    render(<UserManagement />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles user deletion flow', async () => {
    const initialUsers = [{ id: '1', name: 'John Doe' }];
    mockUseUserStore.mockReturnValue({
      ...mockStore,
      users: initialUsers,
    });
    
    mockUserService.deleteUser.mockResolvedValue(undefined);

    render(<UserManagement />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    // Confirm deletion in modal
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockStore.removeUser).toHaveBeenCalledWith('1');
    });
  });

  it('shows error state on fetch failure', async () => {
    mockUseUserStore.mockReturnValue({
      ...mockStore,
      error: 'Network error',
    });

    render(<UserManagement />);

    expect(screen.getByText(/error.*network error/i)).toBeInTheDocument();
  });

  it('handles user creation', async () => {
    const newUserData = { name: 'New User', email: 'new@example.com' };
    const createdUser = { id: '3', ...newUserData };
    
    mockUserService.createUser.mockResolvedValue(createdUser);
    mockUseUserStore.mockReturnValue(mockStore);

    render(<UserManagement />);

    // Open create user modal
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: newUserData.name } 
    });
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: newUserData.email } 
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockStore.addUser).toHaveBeenCalledWith(newUserData);
    });
  });
});
```

### Testing Async Actions
```typescript
// useUserStore.async.test.ts
import { renderHook, act } from '@testing-library/react';
import { useUserStore } from './useUserStore';
import { userService } from '@services/UserService';

jest.mock('@services/UserService');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('useUserStore async actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.setState({ users: [], loading: false, error: null });
  });

  it('handles concurrent requests properly', async () => {
    const { result } = renderHook(() => useUserStore());
    
    // Mock delayed responses
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    mockUserService.getUsers
      .mockImplementationOnce(() => delay(100).then(() => [{ id: '1', name: 'First' }]))
      .mockImplementationOnce(() => delay(50).then(() => [{ id: '2', name: 'Second' }]));

    // Start two concurrent requests
    const promise1 = act(() => result.current.fetchUsers());
    const promise2 = act(() => result.current.fetchUsers());

    await Promise.all([promise1, promise2]);

    // Should have the result from the last completed request
    expect(result.current.users).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('handles request cancellation', async () => {
    const { result } = renderHook(() => useUserStore());
    
    // Create a promise that won't resolve immediately
    let rejectPromise: (reason: any) => void;
    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });
    
    mockUserService.getUsers.mockReturnValue(promise);
    
    // Start request
    act(() => {
      result.current.fetchUsers();
    });
    
    expect(result.current.loading).toBe(true);
    
    // Simulate cancellation (component unmount, etc.)
    act(() => {
      rejectPromise(new Error('Request cancelled'));
    });
    
    // Should handle cancellation gracefully
    expect(result.current.loading).toBe(false);
  });
});
```

## 🎭 Custom Testing Utilities

### Test Utilities
```typescript
// src/test-utils/index.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RootStore } from '@stores/RootStore';

// Zustand store test wrapper
interface StoreWrapperProps {
  children: React.ReactNode;
  initialState?: Partial<any>;
}

// Helper to create isolated store instances for testing
const StoreWrapper: React.FC<StoreWrapperProps> = ({ 
  children, 
  initialState = {} 
}) => {
  // Reset store state for testing
  React.useEffect(() => {
    Object.keys(initialState).forEach(key => {
      // Apply initial state to all stores that need it
      if (useUserStore.getState) {
        useUserStore.setState(initialState);
      }
    });
  }, [initialState]);

  return (
    <div data-testid="store-wrapper">
      {children}
    </div>
  );
};

// Router wrapper
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>
);

// Combined wrapper
const AllProviders: React.FC<{ 
  children: React.ReactNode; 
  initialState?: Partial<any> 
}> = ({ children, initialState }) => (
  <RouterWrapper>
    <StoreWrapper initialState={initialState}>
      {children}
    </StoreWrapper>
  </RouterWrapper>
);

// Custom render function with Zustand support
const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions & { initialState?: Partial<any> }
) => {
  const { initialState, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialState={initialState}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
};

// Helper for testing components with specific store states
export const renderWithStore = (
  ui: React.ReactElement,
  initialState?: Partial<any>
) => {
  return customRender(ui, { initialState });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

### Mock Factories
```typescript
// src/test-utils/mockFactories.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  isActive: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockUserStore = () => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: jest.fn(),
  addUser: jest.fn(),
  updateUser: jest.fn(),
  removeUser: jest.fn(),
  clearError: jest.fn(),
  // Selectors
  getActiveUsers: jest.fn(() => []),
  getUserById: jest.fn((id: string) => null),
});

export const createMockAuthStore = () => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  clearError: jest.fn(),
});

// Helper to mock multiple stores
export const createMockStores = () => ({
  userStore: createMockUserStore(),
  authStore: createMockAuthStore(),
});

// Helper to setup store mocks
export const setupStoreMocks = () => {
  const mocks = createMockStores();
  
  jest.mock('@stores/useUserStore', () => ({
    useUserStore: jest.fn(() => mocks.userStore),
  }));
  
  jest.mock('@stores/useAuthStore', () => ({
    useAuthStore: jest.fn(() => mocks.authStore),
  }));
  
  return mocks;
};

export const createMockApiResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});
```

## 🚀 E2E Testing with Playwright

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example
```typescript
// e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('should display user list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByTestId('user-list')).toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });
});
```

## 📊 Testing Metrics & Reports

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 🎯 Zustand-Specific Testing Best Practices

### Testing Store Persistence
```typescript
// useUserStore.persistence.test.ts
import { useUserStore } from './useUserStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('useUserStore persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists user data to localStorage', () => {
    const users = [{ id: '1', name: 'John' }];
    
    useUserStore.setState({ users });
    
    // Verify that the state was persisted
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user-store',
      JSON.stringify({ users })
    );
  });

  it('loads persisted data on initialization', () => {
    const persistedData = { users: [{ id: '1', name: 'John' }] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedData));
    
    // Re-initialize the store
    const { result } = renderHook(() => useUserStore());
    
    expect(result.current.users).toEqual(persistedData.users);
  });
});
```

### Testing Store Slices and Composition
```typescript
// storeSlices.test.ts
import { createUserSlice } from '@stores/slices/userSlice';
import { createAuthSlice } from '@stores/slices/authSlice';
import { StateCreator } from 'zustand';

describe('Store slices', () => {
  it('creates user slice with correct initial state', () => {
    const mockSet = jest.fn();
    const mockGet = jest.fn();
    
    const userSlice = createUserSlice(mockSet as any, mockGet as any, {} as any);
    
    expect(userSlice.users).toEqual([]);
    expect(userSlice.loading).toBe(false);
    expect(typeof userSlice.fetchUsers).toBe('function');
  });

  it('composes multiple slices correctly', () => {
    const mockSet = jest.fn();
    const mockGet = jest.fn();
    
    const userSlice = createUserSlice(mockSet as any, mockGet as any, {} as any);
    const authSlice = createAuthSlice(mockSet as any, mockGet as any, {} as any);
    
    const combinedState = { ...userSlice, ...authSlice };
    
    expect(combinedState).toHaveProperty('users');
    expect(combinedState).toHaveProperty('user');
    expect(combinedState).toHaveProperty('fetchUsers');
    expect(combinedState).toHaveProperty('login');
  });
});
```

### Testing Store Middleware
```typescript
// storeMiddleware.test.ts
import { useUserStore } from './useUserStore';
import { act, renderHook } from '@testing-library/react';

describe('Store middleware', () => {
  it('logs state changes in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useUserStore());
    
    act(() => {
      useUserStore.setState({ loading: true });
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it('validates state updates with middleware', () => {\n    const { result } = renderHook(() => useUserStore());
    
    // This should work
    act(() => {
      useUserStore.setState({ users: [{ id: '1', name: 'John' }] });
    });
    
    expect(result.current.users).toHaveLength(1);
    
    // This should be validated and potentially rejected
    act(() => {
      try {
        useUserStore.setState({ users: 'invalid' as any });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
```

### Performance Testing
```typescript
// storePerformance.test.ts
import { renderHook } from '@testing-library/react';
import { useUserStore } from './useUserStore';

describe('Store performance', () => {
  it('does not cause unnecessary re-renders', () => {
    const renderSpy = jest.fn();
    
    const TestComponent = () => {
      renderSpy();
      const users = useUserStore(state => state.users);
      return users.length;
    };
    
    const { rerender } = render(<TestComponent />);
    
    // Change unrelated state
    act(() => {
      useUserStore.setState({ loading: true });
    });
    
    rerender(<TestComponent />);
    
    // Should not cause extra renders since we're only selecting users
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('selectors work correctly', () => {
    const { result: fullStore } = renderHook(() => useUserStore());
    const { result: usersOnly } = renderHook(() => 
      useUserStore(state => state.users)
    );
    const { result: activeUsers } = renderHook(() => 
      useUserStore(state => state.users.filter(u => u.isActive))
    );
    
    act(() => {
      useUserStore.setState({ 
        users: [
          { id: '1', name: 'John', isActive: true },
          { id: '2', name: 'Jane', isActive: false }
        ]
      });
    });
    
    expect(fullStore.current.users).toHaveLength(2);
    expect(usersOnly.current).toHaveLength(2);
    expect(activeUsers.current).toHaveLength(1);
  });
});
```

---

This comprehensive testing strategy ensures code quality and reliability across your AI-First React applications with robust Zustand state management testing.