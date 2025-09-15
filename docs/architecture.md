# Architecture

This document provides a comprehensive overview of the AI-First SaaS React Starter architecture, design principles, and implementation patterns.

## 🏗️ High-Level Architecture

### System Overview
```
┌─────────────────────────────────────────────────────┐
│                    Browser Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Plugin A  │ │   Plugin B  │ │   Plugin C  │   │
│  │ Components  │ │ Components  │ │ Components  │   │
│  │   Pages     │ │   Pages     │ │   Pages     │   │
│  │   Routes    │ │   Routes    │ │   Routes    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
├─────────────────────────────────────────────────────┤
│                   Event Bus Layer                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Type-Safe Event Communication System          │ │
│  │  • Subscription Management                     │ │
│  │  • Event History & Debugging                   │ │
│  │  • Performance Optimization                    │ │
│  └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                 Core Framework Layer                │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐         │
│  │   Auth    │ │    API    │ │  Stores   │         │
│  │  Service  │ │  Helper   │ │   Base    │         │
│  └───────────┘ └───────────┘ └───────────┘         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐         │
│  │  Plugin   │ │   Utils   │ │   Types   │         │
│  │ Manager   │ │ Library   │ │  System   │         │
│  └───────────┘ └───────────┘ └───────────┘         │
├─────────────────────────────────────────────────────┤
│                Foundation Layer                     │
│       React + TypeScript + Zustand + Ant Design    │
└─────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### 1. **Separation of Concerns**
- **Core Framework** handles foundational services
- **Plugins** implement specific business features
- **Event Bus** manages communication
- **Clear boundaries** between layers

### 2. **Plugin-First Architecture**
- Features are built as **independent plugins**
- **Hot-pluggable** - can be added/removed at runtime
- **Self-contained** - own stores, components, routes
- **Loosely coupled** - communicate via events only

### 3. **Event-Driven Communication**
- **No direct dependencies** between plugins
- **Type-safe events** with TypeScript definitions
- **Subscription management** with automatic cleanup
- **Debugging support** with event tracing

### 4. **Type Safety First**
- **Full TypeScript** support throughout
- **Strict typing** for events, stores, services
- **Interface contracts** for plugin APIs
- **Compile-time validation** of integrations

### 5. **Testability by Design**
- **Isolated testing** of plugins
- **Mockable services** and APIs
- **Event simulation** for integration testing
- **Test utilities** built into framework

## 📁 Directory Structure

### Core Framework Structure
```
src/core/
├── auth/                       # Authentication & Authorization
│   ├── AuthStore.ts           # Auth state management
│   ├── authService.ts         # Auth business logic
│   ├── types.ts               # Auth type definitions
│   └── __tests__/             # Auth tests
├── api/                        # API Layer
│   ├── apiHelper.ts           # HTTP client wrapper
│   ├── backendHelper.ts       # Backend integration
│   ├── types.ts               # API type definitions
│   └── __tests__/             # API tests
├── stores/                     # Base Store Patterns
│   ├── base/                  # Base store utilities
│   │   ├── types.ts           # Store type definitions
│   │   ├── requestLifecycle.ts # Request state patterns
│   │   └── pagination.ts      # Pagination patterns
│   └── __tests__/             # Store tests
├── plugins/                    # Plugin Management
│   ├── PluginManager.ts       # Plugin lifecycle management
│   ├── types.ts               # Plugin type definitions
│   ├── pluginTestHelper.ts    # Testing utilities
│   └── __tests__/             # Plugin system tests
├── EventBus/                   # Event Communication
│   ├── EventBus.ts           # Core event system
│   ├── types.ts               # Event type definitions
│   ├── events.ts              # Event definitions
│   └── __tests__/             # Event bus tests
└── utils/                      # Shared Utilities
    ├── localStorage.ts         # Storage utilities
    ├── dateUtils.ts           # Date utilities
    ├── validation.ts          # Validation helpers
    └── __tests__/             # Utility tests
```

### Plugin Structure
```
src/plugins/
├── UserManagement/            # User Management Plugin
│   ├── UserManagementPlugin.ts # Main plugin class
│   ├── stores/                # Plugin stores
│   │   ├── userStore.ts
│   │   └── profileStore.ts
│   ├── components/            # Plugin components
│   │   ├── UserProfile.tsx
│   │   ├── UserList.tsx
│   │   └── UserSettings.tsx
│   ├── pages/                 # Plugin pages
│   │   ├── UserProfilePage.tsx
│   │   └── UserSettingsPage.tsx
│   ├── services/              # Plugin services
│   │   └── userService.ts
│   ├── types.ts               # Plugin types
│   └── __tests__/             # Plugin tests
├── ProjectManagement/         # Project Management Plugin
└── Analytics/                 # Analytics Plugin
```

## 🔌 Plugin Architecture

### Plugin Lifecycle
```typescript
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];

  // Lifecycle hooks
  install?(context: PluginContext): Promise<void>;
  activate?(context: PluginContext): Promise<void>;
  deactivate?(context: PluginContext): Promise<void>;
  uninstall?(context: PluginContext): Promise<void>;
}
```

### Plugin Context
```typescript
interface PluginContext {
  // Core services
  auth: AuthService;
  api: ApiHelper;
  eventBus: EventBus;

  // Core stores
  stores: {
    auth: AuthStore;
    tenant: TenantStore;
  };

  // Plugin utilities
  registerRoute: (path: string, component: React.ComponentType) => void;
  registerNavItem: (item: NavItem) => void;
  getConfig: (key: string) => any;
  setConfig: (key: string, value: any) => void;
}
```

### Plugin Communication Flow
```
┌─────────────┐    Event     ┌─────────────┐
│   Plugin A  │────────────→ │ Event Bus   │
└─────────────┘              └─────────────┘
                                    │
                             Event  │  Event
                                    ↓
┌─────────────┐              ┌─────────────┐
│   Plugin B  │←──────────── │   Plugin C  │
└─────────────┘   Direct     └─────────────┘
                   Call
```

## 🎛️ Event System Architecture

### Event Bus Implementation
```typescript
class EventBus {
  private listeners: Map<string, Set<EventListener>>;
  private eventHistory: EventRecord[];
  private isDebugging: boolean;

  emit<T>(eventName: string, data: T): void;
  subscribe<T>(eventName: string, listener: (data: T) => void): Unsubscribe;
  unsubscribe(eventName: string, listener: EventListener): void;
  clear(): void;
}
```

### Event Types System
```typescript
// Core event definitions
export const AUTH_EVENTS = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH'
} as const;

export const TENANT_EVENTS = {
  TENANT_SWITCHED: 'TENANT_SWITCHED',
  TENANT_CREATED: 'TENANT_CREATED'
} as const;

// Event payload types
export interface UserLoginEvent {
  user: User;
  token: string;
  timestamp: Date;
}

export interface TenantSwitchedEvent {
  tenantId: string;
  tenantName: string;
  previousTenantId?: string;
}
```

### Event Flow Patterns

#### 1. **Command Events** (Action Triggers)
```typescript
// Plugin initiates an action
eventBus.emit('CREATE_PROJECT', {
  name: 'New Project',
  description: 'Project description'
});

// Core or other plugins handle the action
eventBus.subscribe('CREATE_PROJECT', async (data) => {
  const project = await projectAPI.create(data);
  eventBus.emit('PROJECT_CREATED', { project });
});
```

#### 2. **State Change Events** (Data Updates)
```typescript
// Core updates state and notifies
const updateUser = (userId: string, updates: Partial<User>) => {
  const updatedUser = { ...user, ...updates };
  setUser(updatedUser);

  eventBus.emit('USER_UPDATED', {
    userId,
    user: updatedUser,
    changes: updates
  });
};
```

#### 3. **UI Events** (Interface Changes)
```typescript
// Register navigation items
eventBus.emit('REGISTER_NAV_ITEM', {
  id: 'projects',
  label: 'Projects',
  path: '/projects',
  icon: 'ProjectOutlined',
  order: 2
});

// Plugin responds to navigation
eventBus.subscribe('NAV_ITEM_CLICKED', (item) => {
  trackEvent('navigation', { item: item.id });
});
```

## 🗄️ State Management Architecture

### Store Hierarchy
```typescript
// Global Core Stores
interface CoreStores {
  auth: AuthStore;          // Authentication state
  tenant: TenantStore;      // Multi-tenant state
  navigation: NavStore;     // Navigation state
  ui: UIStore;             // UI preferences
}

// Plugin Stores (isolated)
interface PluginStores {
  [pluginName: string]: {
    [storeName: string]: any;
  };
}
```

### Base Store Patterns
```typescript
// Request lifecycle pattern
interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

// Pagination pattern
interface PaginatedState<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Cache pattern
interface CacheState<T> {
  data: Map<string, T>;
  expiryTimes: Map<string, Date>;
  maxAge: number;
}
```

### Store Integration with Events
```typescript
export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,

  createProject: async (projectData) => {
    set({ loading: true });

    try {
      const project = await projectAPI.create(projectData);
      set(state => ({
        projects: [...state.projects, project],
        loading: false
      }));

      // Emit event for other plugins
      eventBus.emit('PROJECT_CREATED', { project });
    } catch (error) {
      set({ error: error.message, loading: false });
      eventBus.emit('PROJECT_CREATE_FAILED', { error });
    }
  }
}));
```

## 🌐 API Architecture

### API Layer Structure
```typescript
// Core API helper
class ApiHelper {
  private client: AxiosInstance;
  private authStore: AuthStore;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth headers
    this.client.interceptors.request.use((config) => {
      const token = this.authStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          eventBus.emit('AUTH_TOKEN_EXPIRED');
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Backend Helper Pattern
```typescript
// Plugin-specific API services
export class ProjectAPIService {
  constructor(private apiHelper: ApiHelper) {}

  async getProjects(params?: ProjectFilters): Promise<Project[]> {
    const response = await this.apiHelper.get('/projects', { params });
    return response.data;
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await this.apiHelper.post('/projects', project);

    // Emit event for caching/state updates
    eventBus.emit('PROJECT_API_CREATED', { project: response.data });
    return response.data;
  }
}
```

## 🔐 Security Architecture

### Authentication Flow
```typescript
class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // 1. Validate credentials with backend
    const response = await this.apiHelper.post('/auth/login', credentials);

    // 2. Store tokens securely
    this.tokenStorage.setTokens(response.data);

    // 3. Update auth state
    this.authStore.getState().setAuth(response.data.user, response.data.token);

    // 4. Emit login event
    eventBus.emit('USER_LOGIN', {
      user: response.data.user,
      timestamp: new Date()
    });

    return response.data;
  }

  async refreshToken(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.apiHelper.post('/auth/refresh', {
      refreshToken
    });

    this.tokenStorage.setTokens(response.data);
    eventBus.emit('TOKEN_REFRESHED', { timestamp: new Date() });
  }
}
```

### Permission System
```typescript
interface PluginPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  customPermissions: Record<string, boolean>;
}

class PermissionManager {
  checkPluginPermission(
    pluginName: string,
    permission: string
  ): boolean {
    const userPermissions = this.authStore.getState().user?.permissions;
    const pluginPerms = userPermissions?.[pluginName];
    return pluginPerms?.[permission] ?? false;
  }
}
```

## 📊 Performance Architecture

### Lazy Loading Strategy
```typescript
// Plugin lazy loading
const PluginLoader = {
  async loadPlugin(name: string): Promise<Plugin> {
    const module = await import(`../plugins/${name}/${name}Plugin.ts`);
    return new module[`${name}Plugin`]();
  }
};

// Component lazy loading
const LazyUserProfile = lazy(() =>
  import('./components/UserProfile').then(module => ({
    default: module.UserProfile
  }))
);
```

### Caching Strategy
```typescript
class CacheManager {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
}
```

### Bundle Optimization
```typescript
// Code splitting by plugin
const routes = [
  {
    path: '/users/*',
    component: lazy(() => import('./plugins/UserManagement')),
  },
  {
    path: '/projects/*',
    component: lazy(() => import('./plugins/ProjectManagement')),
  }
];
```

## 🧪 Testing Architecture

### Testing Strategy
```
┌─────────────────────────────────────────┐
│              Testing Pyramid             │
├─────────────────────────────────────────┤
│                   E2E                   │
│            (Cypress/Playwright)         │
├─────────────────────────────────────────┤
│               Integration               │
│          (Plugin Interactions)         │
├─────────────────────────────────────────┤
│                  Unit                   │
│        (Components, Stores, Utils)     │
└─────────────────────────────────────────┘
```

### Plugin Test Environment
```typescript
interface PluginTestEnvironment {
  plugin: Plugin;
  context: MockPluginContext;
  eventBus: EventBus;
  cleanup: () => void;
}

export async function setupPluginTest(
  PluginClass: new () => Plugin
): Promise<PluginTestEnvironment> {
  const eventBus = new EventBus();
  const context = createMockContext(eventBus);
  const plugin = new PluginClass();

  await plugin.install?.(context);
  await plugin.activate?.(context);

  return {
    plugin,
    context,
    eventBus,
    cleanup: async () => {
      await plugin.deactivate?.(context);
      await plugin.uninstall?.(context);
      eventBus.clear();
    }
  };
}
```

## 🔮 Advanced Patterns

### Plugin Composition
```typescript
// Composite plugin pattern
class CompositePlugin implements Plugin {
  constructor(private plugins: Plugin[]) {}

  async activate(context: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.activate?.(context);
    }
  }
}

// Usage
const ecommercePlugin = new CompositePlugin([
  new InventoryPlugin(),
  new OrdersPlugin(),
  new PaymentsPlugin()
]);
```

### Event Middleware
```typescript
// Event middleware pattern
class EventMiddleware {
  private middlewares: MiddlewareFunction[] = [];

  use(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  async process(event: Event): Promise<Event> {
    let result = event;
    for (const middleware of this.middlewares) {
      result = await middleware(result);
    }
    return result;
  }
}

// Logging middleware
const loggingMiddleware: MiddlewareFunction = async (event) => {
  console.log('Event:', event.name, event.data);
  return event;
};
```

### Dynamic Plugin Loading
```typescript
class DynamicPluginLoader {
  async loadFromURL(url: string): Promise<Plugin> {
    const module = await import(/* webpackIgnore: true */ url);
    return new module.default();
  }

  async loadFromRegistry(name: string, version: string): Promise<Plugin> {
    const url = `${PLUGIN_REGISTRY_URL}/${name}/${version}/index.js`;
    return this.loadFromURL(url);
  }
}
```

## 📈 Scalability Considerations

### Horizontal Scaling
- **Plugin isolation** - Independent failure domains
- **Event partitioning** - Route events efficiently
- **State sharding** - Distribute state across plugins
- **API rate limiting** - Per-plugin request limits

### Vertical Scaling
- **Memory management** - Plugin lifecycle controls memory
- **CPU optimization** - Event batching and debouncing
- **Bundle splitting** - Load only needed plugins
- **Caching strategies** - Multi-level caching system

### Monitoring & Observability
```typescript
class PerformanceMonitor {
  trackPluginPerformance(pluginName: string, operation: string): void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      eventBus.emit('PLUGIN_PERFORMANCE', {
        plugin: pluginName,
        operation,
        duration
      });
    };
  }
}
```

This architecture provides a robust, scalable foundation for building complex SaaS applications while maintaining code quality, testability, and developer experience.

Next: **[Plugin System](./plugin-system.md)** - Deep dive into plugin development