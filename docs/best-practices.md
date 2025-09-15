# Best Practices Guide

This guide outlines recommended patterns, conventions, and best practices for developing with the AI-First SaaS React Starter framework.

## Table of Contents

- [Architecture Principles](#architecture-principles)
- [Plugin Development](#plugin-development)
- [State Management](#state-management)
- [Event System](#event-system)
- [Component Design](#component-design)
- [API Integration](#api-integration)
- [Testing Strategies](#testing-strategies)
- [Performance Optimization](#performance-optimization)
- [Security Guidelines](#security-guidelines)
- [Code Organization](#code-organization)
- [Error Handling](#error-handling)
- [TypeScript Usage](#typescript-usage)

## Architecture Principles

### Separation of Concerns

**✅ Good: Clear separation between layers**

```typescript
// Plugin structure
MyPlugin/
├── components/     # UI components only
├── stores/         # State management only
├── services/       # Business logic only
├── types/          # Type definitions only
└── utils/          # Pure functions only
```

**❌ Bad: Mixed responsibilities**

```typescript
// Don't mix UI logic with business logic
const UserList = () => {
  const [users, setUsers] = useState([]);

  // Business logic in component (bad)
  const loadUsers = async () => {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
  };
};
```

### Single Responsibility Principle

**✅ Good: Each plugin has a single purpose**

```typescript
// UserManagement plugin - only handles user operations
export const UserManagementPlugin = {
  id: 'user-management',
  name: 'User Management',
  components: { UserList, UserForm, UserDetail },
  services: { userService },
  stores: { useUserStore }
};

// Notifications plugin - only handles notifications
export const NotificationsPlugin = {
  id: 'notifications',
  name: 'Notifications',
  components: { NotificationList, NotificationItem },
  services: { notificationService },
  stores: { useNotificationStore }
};
```

### Dependency Inversion

**✅ Good: Depend on abstractions, not concretions**

```typescript
// Abstract interface
interface PaymentProvider {
  processPayment(amount: number): Promise<PaymentResult>;
}

// Concrete implementations
class StripeProvider implements PaymentProvider {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Stripe-specific implementation
  }
}

class PayPalProvider implements PaymentProvider {
  async processPayment(amount: number): Promise<PaymentResult> {
    // PayPal-specific implementation
  }
}

// Service depends on abstraction
class PaymentService {
  constructor(private provider: PaymentProvider) {}

  async processPayment(amount: number) {
    return this.provider.processPayment(amount);
  }
}
```

## Plugin Development

### Plugin Structure

**✅ Good: Consistent structure**

```typescript
// Standard plugin structure
export const MyPlugin: PluginInterface = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',

  // Clear lifecycle methods
  async onInstall() {
    // Setup plugin resources
  },

  async onActivate() {
    // Register event listeners
    // Initialize stores
  },

  async onDeactivate() {
    // Cleanup resources
    // Unregister listeners
  },

  // Exported functionality
  components: {
    MyComponent,
    MyForm
  },

  services: {
    myService
  },

  stores: {
    useMyStore
  }
};
```

### Plugin Communication

**✅ Good: Use events for loose coupling**

```typescript
// Plugin A emits events
const handleUserAction = (data: UserData) => {
  // Process the action
  processUserAction(data);

  // Notify other plugins
  eventBus.emit('user:action-completed', {
    userId: data.id,
    action: data.action,
    timestamp: new Date().toISOString()
  });
};

// Plugin B listens for events
eventBus.on('user:action-completed', (data) => {
  // React to the event without tight coupling
  logUserActivity(data);
});
```

**❌ Bad: Direct plugin dependencies**

```typescript
// Don't directly import other plugins
import { UserManagementPlugin } from '../UserManagement';

// This creates tight coupling (bad)
const processOrder = () => {
  UserManagementPlugin.services.userService.updateUser();
};
```

### Plugin Configuration

**✅ Good: Declarative configuration**

```typescript
export const pluginConfig: PluginConfig = {
  id: 'advanced-analytics',
  name: 'Advanced Analytics',
  version: '2.1.0',
  description: 'Provides advanced analytics and reporting capabilities',

  // Clear dependencies
  dependencies: ['user-management', 'data-export'],

  // Version compatibility
  compatibility: {
    framework: '>=1.0.0',
    dependencies: {
      'user-management': '>=1.5.0'
    }
  },

  // Feature flags
  features: {
    realtimeAnalytics: true,
    advancedReports: true,
    dataExport: false
  },

  // Permissions required
  permissions: ['analytics:read', 'reports:create'],

  // Settings schema
  settings: {
    refreshInterval: {
      type: 'number',
      default: 30000,
      min: 5000,
      max: 300000
    }
  }
};
```

## State Management

### Store Design

**✅ Good: Normalized state structure**

```typescript
interface UserState {
  // Normalized data
  users: Record<string, User>;
  userIds: string[];

  // UI state
  loading: boolean;
  error: string | null;
  selectedUserId: string | null;

  // Computed values
  selectedUser: User | null;

  // Actions
  actions: {
    fetchUsers: () => Promise<void>;
    selectUser: (id: string) => void;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  };
}

const useUserStore = create<UserState>((set, get) => ({
  users: {},
  userIds: [],
  loading: false,
  error: null,
  selectedUserId: null,

  // Computed values
  get selectedUser() {
    const { users, selectedUserId } = get();
    return selectedUserId ? users[selectedUserId] || null : null;
  },

  actions: {
    fetchUsers: async () => {
      set({ loading: true, error: null });
      try {
        const users = await userService.fetchUsers();
        const normalized = normalizeUsers(users);
        set({
          users: normalized.entities,
          userIds: normalized.ids,
          loading: false
        });
      } catch (error) {
        set({ loading: false, error: error.message });
      }
    },

    selectUser: (id: string) => {
      set({ selectedUserId: id });
    },

    updateUser: async (id: string, updates: Partial<User>) => {
      try {
        const updatedUser = await userService.updateUser(id, updates);
        set((state) => ({
          users: {
            ...state.users,
            [id]: updatedUser
          }
        }));
      } catch (error) {
        set({ error: error.message });
      }
    }
  }
}));
```

**❌ Bad: Denormalized and inconsistent state**

```typescript
// Don't do this
const useBadUserStore = create((set) => ({
  userList: [],           // Inconsistent naming
  isLoading: false,       // Mixed naming conventions
  err: null,              // Abbreviated names
  currentUser: null,      // Duplicate data

  // Actions mixed with state
  fetchUsers: async () => {
    // Implementation
  }
}));
```

### State Updates

**✅ Good: Immutable updates with proper error handling**

```typescript
const useOrderStore = create<OrderState>((set, get) => ({
  orders: {},

  actions: {
    updateOrderStatus: async (orderId: string, status: OrderStatus) => {
      // Optimistic update
      const previousOrder = get().orders[orderId];
      set((state) => ({
        orders: {
          ...state.orders,
          [orderId]: {
            ...state.orders[orderId],
            status,
            updatedAt: new Date().toISOString()
          }
        }
      }));

      try {
        // API call
        await orderService.updateStatus(orderId, status);

        // Emit event for other plugins
        eventBus.emit('order:status-updated', { orderId, status });
      } catch (error) {
        // Revert optimistic update
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: previousOrder
          }
        }));

        throw error;
      }
    }
  }
}));
```

## Event System

### Event Naming

**✅ Good: Consistent event naming convention**

```typescript
// Use namespace:action pattern
eventBus.emit('user:created', userData);
eventBus.emit('user:updated', userData);
eventBus.emit('user:deleted', { userId });

eventBus.emit('order:placed', orderData);
eventBus.emit('order:fulfilled', orderData);
eventBus.emit('order:cancelled', orderData);

eventBus.emit('plugin:installed', { pluginId });
eventBus.emit('plugin:activated', { pluginId });
eventBus.emit('plugin:deactivated', { pluginId });
```

**❌ Bad: Inconsistent naming**

```typescript
// Don't do this
eventBus.emit('userCreated', userData);        // No namespace
eventBus.emit('UPDATE_USER', userData);        // Wrong case
eventBus.emit('user-deleted', userData);       // Mixed separators
eventBus.emit('user_updated_profile', userData); // Too verbose
```

### Event Payloads

**✅ Good: Well-structured event payloads**

```typescript
interface UserCreatedEvent {
  userId: string;
  email: string;
  role: UserRole;
  metadata: {
    source: 'admin' | 'signup' | 'invitation';
    timestamp: string;
    version: string;
  };
}

// Type-safe event emission
eventBus.emit('user:created', {
  userId: newUser.id,
  email: newUser.email,
  role: newUser.role,
  metadata: {
    source: 'admin',
    timestamp: new Date().toISOString(),
    version: '1.0'
  }
});
```

### Event Handlers

**✅ Good: Robust event handlers**

```typescript
// Error handling and logging
eventBus.on('user:created', async (data: UserCreatedEvent) => {
  try {
    // Log the event
    logger.info('User created', { userId: data.userId });

    // Perform actions
    await sendWelcomeEmail(data.email);
    await createUserProfile(data.userId);
    await assignDefaultPermissions(data.userId, data.role);

    // Emit success event
    eventBus.emit('user:onboarding-completed', {
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Log error
    logger.error('User onboarding failed', {
      userId: data.userId,
      error: error.message
    });

    // Emit error event
    eventBus.emit('user:onboarding-failed', {
      userId: data.userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## Component Design

### Component Structure

**✅ Good: Single responsibility components**

```typescript
// Focused, reusable component
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  showActions?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const handleEdit = () => onEdit?.(user);
  const handleDelete = () => onDelete?.(user.id);

  return (
    <Card className="user-card">
      <UserAvatar user={user} />
      <UserInfo user={user} />
      {showActions && (
        <UserActions
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </Card>
  );
};
```

### Props Design

**✅ Good: Well-typed, extensible props**

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: PaginationConfig;
  selection?: SelectionConfig<T>;
  actions?: ActionConfig<T>[];
  onRowClick?: (item: T) => void;
  onSort?: (field: keyof T, direction: 'asc' | 'desc') => void;
  className?: string;
  testId?: string;
}

// Usage with type safety
<DataTable<User>
  data={users}
  columns={userColumns}
  loading={loading}
  pagination={{ pageSize: 10, total: userCount }}
  onRowClick={handleUserSelect}
  testId="user-table"
/>
```

### Custom Hooks

**✅ Good: Reusable business logic**

```typescript
interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
}

export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await operation();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      options.onError?.(error as Error);
      throw error;
    }
  }, [operation, options]);

  return { ...state, execute };
}

// Usage
const { data, loading, error, execute } = useAsyncOperation(
  () => userService.fetchUsers(),
  {
    onSuccess: (users) => console.log(`Loaded ${users.length} users`),
    onError: (error) => showErrorToast(error.message)
  }
);
```

## API Integration

### Service Layer

**✅ Good: Consistent service patterns**

```typescript
export class UserService {
  constructor(private apiClient: ApiClient) {}

  async fetchUsers(params: FetchUsersParams = {}): Promise<User[]> {
    const response = await this.apiClient.get('/users', { params });
    return response.data;
  }

  async fetchUser(id: string): Promise<User> {
    const response = await this.apiClient.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await this.apiClient.post('/users', userData);

    // Emit event after successful creation
    eventBus.emit('user:created', response.data);

    return response.data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await this.apiClient.patch(`/users/${id}`, updates);

    // Emit event after successful update
    eventBus.emit('user:updated', response.data);

    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.apiClient.delete(`/users/${id}`);

    // Emit event after successful deletion
    eventBus.emit('user:deleted', { userId: id });
  }
}
```

### Error Handling

**✅ Good: Comprehensive error handling**

```typescript
export class ApiService {
  async request<T>(
    method: HttpMethod,
    url: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.statusText,
          await response.json().catch(() => null)
        );
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
        status: response.status
      };
    } catch (error) {
      if (error instanceof ApiError) {
        // Re-throw API errors
        throw error;
      }

      // Handle network errors
      throw new NetworkError('Network request failed', error as Error);
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public details?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

## Testing Strategies

### Test Organization

**✅ Good: Comprehensive test structure**

```typescript
// src/plugins/UserManagement/__tests__/UserService.test.ts
describe('UserService', () => {
  let userService: UserService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    userService = new UserService(mockApiClient);
  });

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      // Arrange
      const mockUsers = [userFactory(), userFactory()];
      mockApiClient.get.mockResolvedValue({ data: mockUsers });

      // Act
      const result = await userService.fetchUsers();

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/users', { params: {} });
      expect(result).toEqual(mockUsers);
    });

    it('should handle API errors', async () => {
      // Arrange
      const apiError = new ApiError(500, 'Internal Server Error');
      mockApiClient.get.mockRejectedValue(apiError);

      // Act & Assert
      await expect(userService.fetchUsers()).rejects.toThrow(ApiError);
    });
  });

  describe('createUser', () => {
    it('should create user and emit event', async () => {
      // Arrange
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createdUser = userFactory(userData);
      mockApiClient.post.mockResolvedValue({ data: createdUser });

      const eventSpy = jest.spyOn(eventBus, 'emit');

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(createdUser);
      expect(eventSpy).toHaveBeenCalledWith('user:created', createdUser);
    });
  });
});
```

### Component Testing

**✅ Good: Behavior-focused component tests**

```typescript
// src/plugins/UserManagement/__tests__/UserList.test.tsx
describe('UserList', () => {
  const mockUsers = [
    userFactory({ id: '1', name: 'John Doe' }),
    userFactory({ id: '2', name: 'Jane Smith' })
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should display list of users', () => {
    // Arrange
    mockUseUserStore.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      actions: {
        fetchUsers: jest.fn(),
        deleteUser: jest.fn()
      }
    });

    // Act
    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle user deletion', async () => {
    // Arrange
    const mockDeleteUser = jest.fn();
    mockUseUserStore.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      actions: {
        fetchUsers: jest.fn(),
        deleteUser: mockDeleteUser
      }
    });

    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    // Act
    const deleteButton = screen.getByTestId('delete-user-1');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm Delete');
    fireEvent.click(confirmButton);

    // Assert
    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('1');
    });
  });
});
```

## Performance Optimization

### Component Optimization

**✅ Good: Optimized component rendering**

```typescript
// Memoized components for expensive operations
const UserCard = React.memo<UserCardProps>(({ user, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => onEdit(user), [user, onEdit]);
  const handleDelete = useCallback(() => onDelete(user.id), [user.id, onDelete]);

  return (
    <Card>
      <UserInfo user={user} />
      <UserActions onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
});

// Memoized expensive computations
const UserStats = ({ users }: { users: User[] }) => {
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      premium: users.filter(u => u.plan === 'premium').length
    };
  }, [users]);

  return <StatsDisplay stats={stats} />;
};
```

### Store Optimization

**✅ Good: Efficient state updates**

```typescript
const useOptimizedUserStore = create<UserState>((set, get) => ({
  users: {},
  userIds: [],

  actions: {
    // Batch updates to prevent multiple re-renders
    batchUpdateUsers: (updates: Array<{ id: string; updates: Partial<User> }>) => {
      set((state) => {
        const newUsers = { ...state.users };
        updates.forEach(({ id, updates }) => {
          newUsers[id] = { ...newUsers[id], ...updates };
        });
        return { users: newUsers };
      });
    },

    // Selective updates using shallow comparison
    updateUserField: (id: string, field: keyof User, value: any) => {
      set((state) => {
        if (state.users[id]?.[field] === value) {
          return state; // No change, prevent re-render
        }

        return {
          users: {
            ...state.users,
            [id]: {
              ...state.users[id],
              [field]: value
            }
          }
        };
      });
    }
  }
}));
```

### Bundle Optimization

**✅ Good: Code splitting and lazy loading**

```typescript
// Lazy load heavy components
const UserAnalytics = lazy(() => import('./UserAnalytics'));
const BulkUserEditor = lazy(() => import('./BulkUserEditor'));

const UserManagementPage = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div>
      <UserList />

      {showAnalytics && (
        <Suspense fallback={<LoadingSpinner />}>
          <UserAnalytics />
        </Suspense>
      )}

      <button onClick={() => setShowAnalytics(true)}>
        Show Analytics
      </button>
    </div>
  );
};

// Dynamic plugin loading
const loadPlugin = async (pluginId: string) => {
  const module = await import(`./plugins/${pluginId}`);
  return module.default;
};
```

## Security Guidelines

### Input Validation

**✅ Good: Comprehensive input validation**

```typescript
import { z } from 'zod';

// Define schemas for validation
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'viewer']),
  permissions: z.array(z.string()).optional()
});

export class UserService {
  async createUser(userData: unknown): Promise<User> {
    // Validate input
    const validatedData = CreateUserSchema.parse(userData);

    // Sanitize data
    const sanitizedData = {
      ...validatedData,
      name: sanitizeString(validatedData.name),
      email: sanitizeEmail(validatedData.email)
    };

    return this.apiClient.post('/users', sanitizedData);
  }
}

// Sanitization functions
function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
```

### Authentication & Authorization

**✅ Good: Secure authentication patterns**

```typescript
export class AuthService {
  private tokenStorage: TokenStorage;

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate credentials
    const validatedCredentials = LoginSchema.parse(credentials);

    try {
      const response = await this.apiClient.post('/auth/login', {
        email: validatedCredentials.email,
        password: await this.hashPassword(validatedCredentials.password)
      });

      // Store tokens securely
      await this.tokenStorage.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });

      // Don't log sensitive data
      logger.info('User logged in', { userId: response.user.id });

      return response;
    } catch (error) {
      // Don't expose internal errors
      throw new AuthError('Invalid credentials');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Use proper password hashing
    return bcrypt.hash(password, 10);
  }
}
```

### Data Protection

**✅ Good: Secure data handling**

```typescript
// Mask sensitive data in logs
export function maskSensitiveData(data: any): any {
  const sensitiveFields = ['password', 'token', 'ssn', 'creditCard'];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***masked***';
    }
  }

  return masked;
}

// Use environment variables for secrets
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  // Never hardcode secrets in the frontend
  publicKey: process.env.REACT_APP_PUBLIC_KEY
};
```

## Code Organization

### File Naming

**✅ Good: Consistent naming conventions**

```
src/
├── plugins/
│   └── UserManagement/
│       ├── components/
│       │   ├── UserList.tsx           # PascalCase for components
│       │   ├── UserForm.tsx
│       │   └── index.ts               # Barrel exports
│       ├── stores/
│       │   ├── userStore.ts           # camelCase for stores
│       │   └── userSelectors.ts       # camelCase for utilities
│       ├── services/
│       │   ├── userService.ts         # camelCase for services
│       │   └── userValidation.ts      # camelCase for utilities
│       ├── types/
│       │   ├── User.ts                # PascalCase for type files
│       │   └── UserApi.ts
│       ├── utils/
│       │   ├── userHelpers.ts         # camelCase for utilities
│       │   └── userConstants.ts       # camelCase for constants
│       └── __tests__/                 # Test directories
│           ├── components/
│           ├── services/
│           └── utils/
```

### Import Organization

**✅ Good: Organized imports**

```typescript
// External libraries (alphabetically)
import React, { useState, useCallback } from 'react';
import { Button, Form, Input } from 'antd';
import { z } from 'zod';

// Internal utilities
import { apiService } from '../../../core/api/apiService';
import { eventBus } from '../../../core/events/eventBus';
import { logger } from '../../../core/utils/logger';

// Plugin-specific imports
import { useUserStore } from '../stores/userStore';
import { UserFormSchema } from '../types/UserValidation';
import { formatUserName } from '../utils/userHelpers';

// Type-only imports (keep separate)
import type { User } from '../types/User';
import type { FormSubmitHandler } from '../../../core/types/forms';
```

### Barrel Exports

**✅ Good: Clean barrel exports**

```typescript
// src/plugins/UserManagement/index.ts
export { UserManagementPlugin } from './UserManagementPlugin';

// Components
export { UserList } from './components/UserList';
export { UserForm } from './components/UserForm';
export { UserDetail } from './components/UserDetail';

// Stores
export { useUserStore } from './stores/userStore';

// Services
export { userService } from './services/userService';

// Types
export type { User, CreateUserData, UpdateUserData } from './types/User';
export type { UserFormData } from './types/UserValidation';

// Don't export internal utilities
// export { internalHelper } from './utils/internalHelper'; // ❌ Don't do this
```

## Error Handling

### Error Boundaries

**✅ Good: Comprehensive error boundaries**

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class PluginErrorBoundary extends Component<
  { children: ReactNode; pluginId: string },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    logger.error('Plugin error boundary caught error', {
      pluginId: this.props.pluginId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Report to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          pluginId: this.props.pluginId,
          errorBoundary: true
        },
        extra: errorInfo
      });
    }

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          pluginId={this.props.pluginId}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

### Error Types

**✅ Good: Structured error hierarchy**

```typescript
// Base error class
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(field: string, value: any, reason: string) {
    super(`Validation failed for field '${field}': ${reason}`);
    this.context = { field, value, reason };
  }
}

export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
}

export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

// Usage
const handleUserCreation = async (userData: any) => {
  try {
    const user = await userService.createUser(userData);
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      showFieldError(error.context.field, error.message);
    } else if (error instanceof AuthorizationError) {
      redirectToLogin();
    } else {
      showGenericError('Failed to create user');
    }

    throw error;
  }
};
```

## TypeScript Usage

### Type Definitions

**✅ Good: Comprehensive type definitions**

```typescript
// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Domain types
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  preferences: UserPreferences;
}

export type UserRole = 'admin' | 'user' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// API types
export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

// Component prop types
export interface UserListProps {
  users: User[];
  loading?: boolean;
  error?: string | null;
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserDelete?: (userId: string) => void;
  className?: string;
  testId?: string;
}

// Generic types for reusability
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Utility types
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type UserFormData = Pick<User, 'name' | 'email' | 'role'>;
export type UserSummary = Pick<User, 'id' | 'name' | 'email' | 'status'>;
```

### Type Guards

**✅ Good: Runtime type checking**

```typescript
// Type guard functions
export function isUser(value: any): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    ['admin', 'user', 'viewer'].includes(value.role)
  );
}

export function isApiError(error: any): error is ApiError {
  return error instanceof Error && 'status' in error && 'statusText' in error;
}

// Usage
const handleApiResponse = (response: unknown) => {
  if (isUser(response)) {
    // TypeScript knows response is User
    console.log(response.name);
  } else {
    throw new Error('Invalid user data');
  }
};
```

---

## Summary

Following these best practices will help you:

1. **Build maintainable code** that's easy to understand and modify
2. **Create reusable components** that work across different plugins
3. **Implement robust error handling** that gracefully handles failures
4. **Optimize performance** through efficient patterns and techniques
5. **Ensure type safety** with comprehensive TypeScript usage
6. **Maintain security** through proper validation and data protection

Remember: **Consistency is key**. Choose patterns that work for your team and stick to them throughout your application.