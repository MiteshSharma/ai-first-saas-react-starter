# Plugin Development Guide

## Overview

The AI-First SaaS React Starter provides a comprehensive plugin architecture that allows you to build modular, reusable features for your SaaS applications. This guide covers everything you need to know about developing plugins using our framework.

## Table of Contents

1. [Plugin Architecture](#plugin-architecture)
2. [Quick Start](#quick-start)
3. [Plugin Types](#plugin-types)
4. [Core Concepts](#core-concepts)
5. [Generator Commands](#generator-commands)
6. [Plugin Structure](#plugin-structure)
7. [Event System](#event-system)
8. [State Management](#state-management)
9. [Routing](#routing)
10. [API Integration](#api-integration)
11. [Testing](#testing)
12. [Best Practices](#best-practices)
13. [Examples](#examples)

## Plugin Architecture

Our plugin system is built on several core principles:

- **Event-Driven Communication**: Plugins communicate through a centralized Event Bus
- **Modular Design**: Each plugin is self-contained with its own components, stores, and services
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Hot Reloading**: Development-friendly with instant updates
- **Lifecycle Management**: Proper initialization, activation, and cleanup

### Core Components

```
src/
├── core/
│   ├── plugins/
│   │   ├── pluginManager.ts     # Central plugin management
│   │   ├── pluginTypes.ts       # Type definitions
│   │   └── basePlugin.ts        # Base plugin class
│   ├── events/
│   │   └── eventBus.ts          # Event communication system
│   └── stores/
│       └── base/                # Base store patterns
└── plugins/
    ├── [PluginName]/
    │   ├── index.ts             # Plugin entry point
    │   ├── [PluginName]Plugin.ts # Main plugin class
    │   ├── components/          # Plugin-specific components
    │   ├── stores/              # Plugin-specific stores
    │   ├── services/            # Plugin-specific API services
    │   ├── routes/              # Plugin routes
    │   └── __tests__/           # Plugin tests
```

## Quick Start

### 1. Generate a New Plugin

```bash
# Create a feature plugin with store and routes
ai-first g plugin UserManagement --type feature --hasStore true --hasRoutes true

# Create a simple component-only plugin
ai-first g plugin NotificationBadge --type feature --hasComponents true

# Create a core system plugin
ai-first g plugin Analytics --type core --hasStore true
```

### 2. Register Your Plugin

```typescript
// src/plugins/index.ts
import { UserManagementPlugin } from './UserManagement';

export const plugins = [
  new UserManagementPlugin(),
  // ... other plugins
];
```

### 3. Use Plugin Features

```typescript
// In your components
import { useUserManagementStore } from '../plugins/UserManagement';

function MyComponent() {
  const { users, fetchUsers } = useUserManagementStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return <div>{/* Your component */}</div>;
}
```

## Plugin Types

### Feature Plugins

Feature plugins add specific business functionality:

- **User Management**: User CRUD operations, profiles, permissions
- **Billing**: Subscription management, payment processing
- **Analytics**: Custom analytics dashboards and tracking
- **Notifications**: In-app notifications, email templates

### Core Plugins

Core plugins extend framework capabilities:

- **Authentication**: Advanced auth flows, SSO integration
- **Caching**: Custom caching strategies
- **Logging**: Enhanced logging and monitoring
- **Security**: Advanced security features

## Core Concepts

### BasePlugin Class

All plugins extend the `BasePlugin` class:

```typescript
import { BasePlugin } from '../../core/plugins/basePlugin';

export class UserManagementPlugin extends BasePlugin {
  name = 'UserManagement';
  version = '1.0.0';
  description = 'User management and profile features';

  async initialize(): Promise<void> {
    // Plugin initialization logic
    this.eventBus.emit('PLUGIN_INITIALIZED', { plugin: this.name });
  }

  async activate(): Promise<void> {
    // Plugin activation logic
    this.registerEventHandlers();
  }

  async deactivate(): Promise<void> {
    // Cleanup logic
    this.removeEventHandlers();
  }

  getRoutes(): RouteConfig[] {
    return [
      {
        path: '/users',
        component: () => import('./components/UserListPage'),
        protected: true
      }
    ];
  }
}
```

### Event Bus Integration

Plugins communicate through events:

```typescript
// Emit events
this.eventBus.emit('USER_CREATED', { userId: '123', userData: {...} });

// Listen to events
this.eventBus.on('USER_UPDATED', this.handleUserUpdate);

// Event with payload types
interface UserCreatedPayload {
  userId: string;
  userData: UserData;
}

this.eventBus.emit<UserCreatedPayload>('USER_CREATED', payload);
```

## Generator Commands

### Plugin Generator

```bash
ai-first g plugin <name> [options]

Options:
  --type feature|core           Plugin type (default: feature)
  --hasStore true|false         Include Zustand store (default: false)
  --hasRoutes true|false        Include routing (default: false)
  --hasComponents true|false    Include components (default: true)
  --description "text"          Custom description
```

### Core Framework Generators

```bash
# Generate event bus extensions
ai-first g eventbus UserEvents --events [] --handlers []

# Generate extended stores
ai-first g storeext ProductStore --eventIntegration true

# Generate API helpers
ai-first g apihelper UserAPI --withAuth true --withTenant false

# Generate custom hooks
ai-first g hook useUserData --dependencies [] --returnType object
```

## Plugin Structure

### Complete Plugin Example

```typescript
// UserManagementPlugin.ts
import { BasePlugin } from '../../core/plugins/basePlugin';
import { createUserStore } from './stores/userStore';
import { UserService } from './services/userService';

export class UserManagementPlugin extends BasePlugin {
  name = 'UserManagement';
  private userStore = createUserStore();
  private userService = new UserService();

  async initialize(): Promise<void> {
    // Initialize plugin services
    await this.userService.initialize();

    // Setup event handlers
    this.eventBus.on('AUTH_USER_LOGGED_IN', this.handleUserLogin);
    this.eventBus.on('TENANT_SWITCHED', this.handleTenantSwitch);
  }

  getRoutes(): RouteConfig[] {
    return [
      {
        path: '/users',
        component: () => import('./components/UserListPage'),
        protected: true,
        permissions: ['users.read']
      },
      {
        path: '/users/:id',
        component: () => import('./components/UserDetailPage'),
        protected: true,
        permissions: ['users.read']
      }
    ];
  }

  getMenuItems(): MenuItemConfig[] {
    return [
      {
        key: 'users',
        label: 'Users',
        icon: 'UserOutlined',
        path: '/users',
        permissions: ['users.read']
      }
    ];
  }

  private handleUserLogin = (payload: any) => {
    this.userStore.getState().setCurrentUser(payload.user);
  };

  private handleTenantSwitch = (payload: any) => {
    this.userStore.getState().clearUsers();
    this.userService.refreshUsers();
  };
}
```

### Store Integration

```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { EventBus } from '../../../core/events/eventBus';

interface UserStore {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;

  // Actions
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (user: User | null) => void;
}

export const createUserStore = (eventBus?: EventBus) => {
  return create<UserStore>()(
    subscribeWithSelector((set, get) => ({
      users: [],
      currentUser: null,
      isLoading: false,

      setUsers: (users) => {
        set({ users });
        eventBus?.emit('USERS_LOADED', { count: users.length });
      },

      addUser: (user) => {
        set(state => ({ users: [...state.users, user] }));
        eventBus?.emit('USER_ADDED', { user });
      },

      updateUser: (id, updates) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === id ? { ...user, ...updates } : user
          )
        }));
        eventBus?.emit('USER_UPDATED', { id, updates });
      },

      deleteUser: (id) => {
        set(state => ({ users: state.users.filter(user => user.id !== id) }));
        eventBus?.emit('USER_DELETED', { id });
      },

      setCurrentUser: (user) => set({ currentUser: user })
    }))
  );
};
```

## Event System

### Event Types

```typescript
// events/userEvents.ts
export const USER_EVENTS = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT'
} as const;

export interface UserEventPayloads {
  [USER_EVENTS.USER_CREATED]: { user: User };
  [USER_EVENTS.USER_UPDATED]: { id: string; updates: Partial<User> };
  [USER_EVENTS.USER_DELETED]: { id: string };
  [USER_EVENTS.USER_LOGIN]: { user: User; timestamp: Date };
  [USER_EVENTS.USER_LOGOUT]: { userId: string; timestamp: Date };
}
```

### Event Handlers

```typescript
// events/userHandlers.ts
export class UserEventHandlers {
  constructor(private eventBus: EventBus) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.eventBus.on(USER_EVENTS.USER_CREATED, this.handleUserCreated);
    this.eventBus.on(USER_EVENTS.USER_LOGIN, this.handleUserLogin);
  }

  private handleUserCreated = (payload: UserEventPayloads[typeof USER_EVENTS.USER_CREATED]) => {
    // Analytics tracking
    this.eventBus.emit('ANALYTICS_TRACK', {
      event: 'user_registered',
      properties: { userId: payload.user.id }
    });

    // Send welcome email
    this.eventBus.emit('EMAIL_SEND', {
      template: 'welcome',
      to: payload.user.email,
      data: { userName: payload.user.name }
    });
  };

  private handleUserLogin = (payload: UserEventPayloads[typeof USER_EVENTS.USER_LOGIN]) => {
    // Update last login
    this.eventBus.emit('USER_UPDATE', {
      id: payload.user.id,
      updates: { lastLogin: payload.timestamp }
    });
  };
}
```

## State Management

### Best Practices

1. **Use subscriptions for cross-plugin communication**:

```typescript
// Subscribe to store changes in other plugins
userStore.subscribe(
  (state) => state.currentUser,
  (currentUser) => {
    if (currentUser) {
      notificationStore.getState().loadUserNotifications(currentUser.id);
    }
  }
);
```

2. **Implement proper cleanup**:

```typescript
export class UserManagementPlugin extends BasePlugin {
  private unsubscribes: Array<() => void> = [];

  async activate(): Promise<void> {
    // Store subscriptions
    const unsubscribe = userStore.subscribe(
      (state) => state.users,
      (users) => this.eventBus.emit('USERS_CHANGED', { users })
    );
    this.unsubscribes.push(unsubscribe);
  }

  async deactivate(): Promise<void> {
    // Cleanup subscriptions
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }
}
```

3. **Use computed values for derived state**:

```typescript
const userStore = create<UserStore>()((set, get) => ({
  users: [],
  searchTerm: '',

  get filteredUsers() {
    const { users, searchTerm } = get();
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  get userCount() {
    return get().users.length;
  }
}));
```

## Routing

### Dynamic Route Registration

```typescript
// Plugin routes are automatically registered
export class UserManagementPlugin extends BasePlugin {
  getRoutes(): RouteConfig[] {
    return [
      {
        path: '/users',
        component: () => import('./components/UserListPage'),
        protected: true,
        permissions: ['users.read'],
        meta: {
          title: 'User Management',
          breadcrumb: 'Users'
        }
      },
      {
        path: '/users/create',
        component: () => import('./components/CreateUserPage'),
        protected: true,
        permissions: ['users.create']
      },
      {
        path: '/users/:id/edit',
        component: () => import('./components/EditUserPage'),
        protected: true,
        permissions: ['users.update']
      }
    ];
  }
}
```

### Route Guards

```typescript
// Custom route guard
export const userRouteGuard = (route: RouteConfig, user: User): boolean => {
  if (route.permissions) {
    return route.permissions.every(permission =>
      user.permissions.includes(permission)
    );
  }
  return true;
};
```

## API Integration

### Service Layer

```typescript
// services/userService.ts
import { apiClient } from '../../../helpers/apiClient';
import { EventBus } from '../../../core/events/eventBus';

export class UserService {
  constructor(private eventBus: EventBus) {}

  async getUsers(): Promise<User[]> {
    try {
      this.eventBus.emit('API_REQUEST_START', { service: 'UserService', method: 'getUsers' });

      const response = await apiClient.get('/api/users');
      const users = response.data;

      this.eventBus.emit('API_REQUEST_SUCCESS', { service: 'UserService', method: 'getUsers' });
      this.eventBus.emit('USERS_LOADED', { users });

      return users;
    } catch (error) {
      this.eventBus.emit('API_REQUEST_ERROR', {
        service: 'UserService',
        method: 'getUsers',
        error
      });
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post('/api/users', userData);
    const user = response.data;

    this.eventBus.emit('USER_CREATED', { user });
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/api/users/${id}`, updates);
    const user = response.data;

    this.eventBus.emit('USER_UPDATED', { id, user, updates });
    return user;
  }
}
```

### API Helpers

```typescript
// Generated API helper
export const userHelper = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/api/users', {
      headers: { ...getAuthHeaders(), ...getTenantHeaders() }
    });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/api/users/${id}`, {
      headers: { ...getAuthHeaders(), ...getTenantHeaders() }
    });
    return response.data;
  },

  create: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post('/api/users', data, {
      headers: { ...getAuthHeaders(), ...getTenantHeaders() }
    });
    return response.data;
  }
};
```

## Testing

### Plugin Testing

```typescript
// __tests__/UserManagementPlugin.test.ts
import { UserManagementPlugin } from '../UserManagementPlugin';
import { EventBus } from '../../../core/events/eventBus';
import { createTestEventBus } from '../../../core/__tests__/testUtils';

describe('UserManagementPlugin', () => {
  let plugin: UserManagementPlugin;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = createTestEventBus();
    plugin = new UserManagementPlugin();
    plugin.setEventBus(eventBus);
  });

  test('should initialize successfully', async () => {
    await plugin.initialize();
    expect(plugin.isInitialized).toBe(true);
  });

  test('should register routes', () => {
    const routes = plugin.getRoutes();
    expect(routes).toHaveLength(3);
    expect(routes[0].path).toBe('/users');
  });

  test('should handle user creation events', async () => {
    const handler = jest.fn();
    eventBus.on('USER_CREATED', handler);

    await plugin.activate();
    eventBus.emit('USER_CREATED', { user: { id: '1', name: 'Test User' } });

    expect(handler).toHaveBeenCalledWith({ user: { id: '1', name: 'Test User' } });
  });
});
```

### Store Testing

```typescript
// __tests__/userStore.test.ts
import { createUserStore } from '../stores/userStore';
import { createTestEventBus } from '../../../core/__tests__/testUtils';

describe('User Store', () => {
  test('should add user and emit event', () => {
    const eventBus = createTestEventBus();
    const store = createUserStore(eventBus);
    const emitSpy = jest.spyOn(eventBus, 'emit');

    const user = { id: '1', name: 'Test User', email: 'test@example.com' };
    store.getState().addUser(user);

    expect(store.getState().users).toContain(user);
    expect(emitSpy).toHaveBeenCalledWith('USER_ADDED', { user });
  });
});
```

### Component Testing

```typescript
// __tests__/UserListPage.test.tsx
import { render, screen } from '@testing-library/react';
import { UserListPage } from '../components/UserListPage';
import { createTestWrapper } from '../../../core/__tests__/testUtils';

describe('UserListPage', () => {
  test('should render user list', () => {
    const wrapper = createTestWrapper({
      initialState: {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
        ]
      }
    });

    render(<UserListPage />, { wrapper });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Plugin Design

- **Single Responsibility**: Each plugin should have a clear, focused purpose
- **Loose Coupling**: Plugins should communicate through events, not direct dependencies
- **Self-Contained**: Include all necessary components, stores, and services
- **Configurable**: Allow customization through configuration options

### 2. Performance

- **Lazy Loading**: Use dynamic imports for components and routes
- **Memory Management**: Properly cleanup subscriptions and event handlers
- **Efficient Updates**: Use selective subscriptions and computed values

### 3. Type Safety

- **Strong Typing**: Define comprehensive TypeScript interfaces
- **Event Typing**: Type all event payloads
- **API Typing**: Use Zod or similar for runtime validation

### 4. Error Handling

- **Graceful Degradation**: Handle plugin failures without breaking the app
- **Error Boundaries**: Wrap plugin components in error boundaries
- **Logging**: Comprehensive error logging and reporting

## Examples

### Simple Notification Plugin

```typescript
// NotificationPlugin.ts
export class NotificationPlugin extends BasePlugin {
  name = 'Notification';

  async initialize(): Promise<void> {
    this.eventBus.on('SHOW_NOTIFICATION', this.showNotification);
  }

  private showNotification = (payload: { message: string; type: 'success' | 'error' }) => {
    // Show notification using your preferred library (antd, react-hot-toast, etc.)
    notification[payload.type]({
      message: payload.message,
      placement: 'topRight',
    });
  };
}
```

### Analytics Plugin

```typescript
// AnalyticsPlugin.ts
export class AnalyticsPlugin extends BasePlugin {
  name = 'Analytics';

  async initialize(): Promise<void> {
    this.eventBus.on('ANALYTICS_TRACK', this.trackEvent);
    this.eventBus.on('PAGE_VIEW', this.trackPageView);
  }

  private trackEvent = (payload: { event: string; properties?: Record<string, any> }) => {
    // Track with your analytics provider
    analytics.track(payload.event, payload.properties);
  };

  private trackPageView = (payload: { page: string; title?: string }) => {
    analytics.page(payload.page, payload.title);
  };
}
```

### Feature Flag Plugin

```typescript
// FeatureFlagPlugin.ts
export class FeatureFlagPlugin extends BasePlugin {
  name = 'FeatureFlag';
  private flags: Record<string, boolean> = {};

  async initialize(): Promise<void> {
    await this.loadFlags();
    this.eventBus.on('CHECK_FEATURE', this.checkFeature);
  }

  private async loadFlags(): Promise<void> {
    // Load from API or config
    const response = await apiClient.get('/api/feature-flags');
    this.flags = response.data;
  }

  private checkFeature = (payload: { feature: string }) => {
    const isEnabled = this.flags[payload.feature] || false;
    this.eventBus.emit('FEATURE_CHECKED', {
      feature: payload.feature,
      enabled: isEnabled
    });
  };
}
```

## Conclusion

The plugin system provides a powerful way to build modular, maintainable SaaS applications. By following the patterns and practices outlined in this guide, you can create robust plugins that integrate seamlessly with the AI-First SaaS React Starter framework.

For more examples and advanced usage, see the `/examples` directory in the project repository.