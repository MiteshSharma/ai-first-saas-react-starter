# Frequently Asked Questions (FAQ)

This document answers the most commonly asked questions about the AI-First SaaS React Starter framework.

## Table of Contents

- [General Questions](#general-questions)
- [Plugin Development](#plugin-development)
- [State Management](#state-management)
- [Event System](#event-system)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

## General Questions

### What is the AI-First SaaS React Starter?

The AI-First SaaS React Starter is a plugin-based React framework designed for building scalable SaaS applications. It provides a "WordPress for React applications" approach where core functionality is extended through plugins.

### How is this different from Create React App?

While Create React App provides a basic React setup, our framework offers:
- **Plugin Architecture**: Modular, reusable components
- **Event-Driven System**: Decoupled communication between modules
- **Built-in State Management**: Zustand with standardized patterns
- **API Mocking**: Development-friendly mock system
- **Code Generation**: CLI tools for rapid development
- **SaaS Patterns**: Authentication, multi-tenancy, user management

### Can I use this with existing React projects?

Yes, but it requires some refactoring. You'll need to:
1. Restructure your code into plugins
2. Adopt the event-driven architecture
3. Migrate to Zustand for state management
4. Follow the framework's file structure conventions

### What's the learning curve like?

- **Familiar with React**: 1-2 weeks to become productive
- **New to React**: 3-4 weeks to understand both React and our patterns
- **Experienced developers**: Few days to understand the architecture

## Plugin Development

### How do I create my first plugin?

Use the CLI generator:

```bash
npm run generate plugin MyAwesomePlugin
```

This creates a complete plugin structure with components, stores, services, and tests.

### Can plugins communicate with each other?

Yes, through the Event Bus system:

```typescript
// Plugin A emits an event
eventBus.emit('user:created', { userId: '123' });

// Plugin B listens for the event
eventBus.on('user:created', (data) => {
  console.log('User created:', data.userId);
});
```

### How do I share data between plugins?

1. **Events**: For notifications and triggers
2. **Core Stores**: For shared application state
3. **Plugin Services**: For shared business logic
4. **Context**: For React-specific data sharing

### Can I disable plugins at runtime?

Yes, through the Plugin Manager:

```typescript
await pluginManager.deactivate('plugin-id');
```

Plugins are designed to be hot-swappable without affecting the core application.

### How do I handle plugin dependencies?

Define dependencies in your plugin configuration:

```typescript
export const pluginConfig: PluginConfig = {
  id: 'advanced-reports',
  dependencies: ['user-management', 'analytics'],
  // ... other config
};
```

The framework ensures dependencies are loaded first.

### Can I create nested plugins?

Yes, plugins can contain sub-plugins:

```
MyPlugin/
├── SubPlugins/
│   ├── FeatureA/
│   └── FeatureB/
├── components/
└── index.ts
```

### How do I version my plugins?

Use semantic versioning and include compatibility information:

```typescript
export const pluginConfig: PluginConfig = {
  version: '2.1.0',
  compatibility: {
    framework: '>=1.0.0',
    dependencies: {
      'user-management': '>=1.5.0'
    }
  }
};
```

## State Management

### Why Zustand instead of Redux?

Zustand offers:
- **Simplicity**: Less boilerplate code
- **Performance**: No unnecessary re-renders
- **TypeScript**: Excellent TypeScript support
- **Flexibility**: Works well with our plugin architecture

### How do I share state between plugins?

Use the core store pattern:

```typescript
// Create a shared store
const useSharedStore = createBaseStore<SharedData>('shared');

// Access from any plugin
const { data, setData } = useSharedStore();
```

### Can I use Redux alongside Zustand?

Not recommended. It creates complexity and conflicts. If you need Redux patterns, implement them within Zustand stores.

### How do I handle complex state logic?

Use store composition and actions:

```typescript
const useComplexStore = create<ComplexState>((set, get) => ({
  data: [],
  computed: {
    total: () => get().data.reduce((sum, item) => sum + item.value, 0)
  },
  actions: {
    complexOperation: async () => {
      const result = await apiService.complexCall();
      set({ data: result });
    }
  }
}));
```

### How do I persist state?

Use Zustand's persist middleware:

```typescript
const usePersistentStore = create(
  persist(
    (set) => ({
      settings: {},
      updateSettings: (newSettings) => set({ settings: newSettings })
    }),
    { name: 'app-settings' }
  )
);
```

## Event System

### When should I use events vs. direct function calls?

Use events for:
- **Cross-plugin communication**
- **Notifications and alerts**
- **Loosely coupled interactions**
- **Audit trails and logging**

Use direct calls for:
- **Internal plugin logic**
- **Synchronous operations**
- **Type-safe interactions**

### Can events be async?

Yes, event handlers can be async:

```typescript
eventBus.on('user:created', async (userData) => {
  await sendWelcomeEmail(userData.email);
  await setupUserDefaults(userData.id);
});
```

### How do I handle event errors?

Wrap handlers in try-catch and use error events:

```typescript
eventBus.on('data:process', async (data) => {
  try {
    await processData(data);
    eventBus.emit('data:processed', { success: true });
  } catch (error) {
    eventBus.emit('data:error', { error: error.message });
  }
});
```

### Can I create typed events?

Yes, define event types:

```typescript
interface AppEvents {
  'user:created': { userId: string; email: string };
  'order:completed': { orderId: string; amount: number };
}

const typedEventBus = eventBus as TypedEventBus<AppEvents>;
```

## Authentication

### How do I add custom authentication providers?

Extend the auth service:

```typescript
class CustomAuthProvider implements AuthProvider {
  async login(credentials: CustomCredentials): Promise<AuthResult> {
    // Custom implementation
  }

  async logout(): Promise<void> {
    // Custom implementation
  }
}

authService.registerProvider('custom', new CustomAuthProvider());
```

### How do I protect routes?

Use the ProtectedRoute component:

```typescript
<ProtectedRoute roles={['admin']}>
  <AdminPanel />
</ProtectedRoute>
```

### Can I customize the token storage?

Yes, implement a custom token storage:

```typescript
class CustomTokenStorage implements TokenStorage {
  async getToken(): Promise<string | null> {
    // Custom storage logic
  }

  async setToken(token: string): Promise<void> {
    // Custom storage logic
  }
}

authService.setTokenStorage(new CustomTokenStorage());
```

### How do I handle token refresh?

The framework handles it automatically, but you can customize:

```typescript
authService.onTokenRefresh((newToken) => {
  // Custom logic after token refresh
  console.log('Token refreshed:', newToken);
});
```

## API Integration

### How do I add custom API endpoints?

Extend the API service:

```typescript
class MyApiService extends BaseApiService {
  async getCustomData() {
    return this.get('/custom-endpoint');
  }
}

const myApi = new MyApiService();
```

### How do I handle API errors globally?

Use API interceptors:

```typescript
apiService.addInterceptor('response', (response) => {
  if (!response.ok) {
    eventBus.emit('api:error', {
      status: response.status,
      message: response.statusText
    });
  }
  return response;
});
```

### Can I use different API clients?

Yes, implement the ApiClient interface:

```typescript
class AxiosApiClient implements ApiClient {
  async get(url: string, options?: RequestOptions) {
    // Axios implementation
  }
  // ... other methods
}

apiService.setClient(new AxiosApiClient());
```

### How do I mock specific API calls?

Use the mock API system:

```typescript
// In mock-api.ts
mockApi.get('/api/users/:id', (req) => {
  return mockResponse({
    id: req.params.id,
    name: 'Mocked User'
  });
});
```

## Testing

### How do I test plugins in isolation?

Use the plugin test utilities:

```typescript
import { setupPluginTest } from '../utils/test/pluginHelpers';

describe('MyPlugin', () => {
  beforeEach(async () => {
    await setupPluginTest({
      plugins: ['my-plugin'],
      mocks: ['user-api']
    });
  });
});
```

### How do I mock the event bus?

Use the test event bus:

```typescript
import { createTestEventBus } from '../utils/test/eventBusHelpers';

const mockEventBus = createTestEventBus();
mockEventBus.on('test:event', jest.fn());
```

### Can I test components without the full framework?

Yes, use the TestWrapper:

```typescript
import { TestWrapper } from '../utils/test/helpers';

render(
  <TestWrapper>
    <MyComponent />
  </TestWrapper>
);
```

### How do I test async operations?

Use React Testing Library's async utilities:

```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## Deployment

### What are the minimum requirements for production?

- **Node.js**: 18+ for building
- **Web Server**: Nginx, Apache, or any static file server
- **HTTPS**: Required for production
- **Environment Variables**: All REACT_APP_* variables configured

### How do I deploy to multiple environments?

Use environment-specific configs:

```bash
npm run build:staging  # Uses .env.staging
npm run build:production  # Uses .env.production
```

### Can I deploy plugins separately?

The framework supports plugin hot-loading, but it's recommended to bundle plugins with the main application for production stability.

### How do I handle database migrations for plugins?

Plugins shouldn't directly handle database migrations. Use your backend API to handle data schema changes and version your API endpoints accordingly.

## Performance

### How do I optimize bundle size?

1. **Code Splitting**: Automatic with plugin architecture
2. **Tree Shaking**: Remove unused exports
3. **Bundle Analysis**: Use `npm run build:analyze`
4. **Lazy Loading**: Load plugins on demand

### Why is my app slow to start?

Common causes:
- **Too many plugins loading at startup**
- **Heavy computations in plugin initialization**
- **Unoptimized API calls**
- **Large bundle sizes**

Use the Performance tab in DevTools to identify bottlenecks.

### How do I profile plugin performance?

Use the built-in performance monitoring:

```typescript
import { performanceMonitor } from '../utils/performance';

performanceMonitor.measure('plugin-load', () => {
  // Plugin loading code
});
```

### Can I lazy load plugins?

Yes, use dynamic imports:

```typescript
const loadPlugin = async () => {
  const { MyPlugin } = await import('./plugins/MyPlugin');
  await pluginManager.install('my-plugin', MyPlugin);
};
```

## Troubleshooting

### My plugin isn't loading. What should I check?

1. **Plugin configuration**: Verify the plugin exports are correct
2. **Dependencies**: Check if all dependencies are available
3. **Errors**: Look in browser console for errors
4. **Plugin manager**: Check if the plugin is installed and activated

### Events aren't working between plugins. Why?

Common issues:
- **Event names**: Ensure exact string matching
- **Timing**: Listener might not be registered when event is emitted
- **Scope**: Check if you're using the same event bus instance

### I'm getting TypeScript errors. How do I fix them?

1. **Update types**: Run `npm run typecheck` to see all errors
2. **Plugin types**: Ensure your plugin exports proper types
3. **Event types**: Define event payload types
4. **Store types**: Use proper TypeScript interfaces for stores

### The build is failing. What could be wrong?

Check these common issues:
1. **Environment variables**: Missing required REACT_APP_* variables
2. **Dependencies**: Run `npm ci` to ensure clean install
3. **TypeScript**: Fix all type errors
4. **Circular dependencies**: Check for import cycles

### My tests are failing randomly. Why?

Common causes:
- **Async operations**: Use proper `await` and `waitFor`
- **Cleanup**: Ensure proper test cleanup between tests
- **Mocks**: Reset mocks between tests
- **Timing issues**: Use deterministic test data

### How do I debug plugin communication?

Enable event logging:

```typescript
// In development
eventBus.enableLogging();

// Or use the debug middleware
eventBus.use(createDebugMiddleware());
```

### The app crashes on plugin activation. What do I check?

1. **Plugin errors**: Check browser console for plugin-specific errors
2. **Dependencies**: Verify all plugin dependencies are met
3. **Store conflicts**: Check for store naming conflicts
4. **Event conflicts**: Ensure unique event names

### How do I get help with specific issues?

1. **Documentation**: Check the relevant documentation sections
2. **Examples**: Look at the plugin examples
3. **Community**: Join our Discord/Slack community
4. **Issues**: Create an issue in the GitHub repository with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Code snippets

### Performance is degrading over time. What could cause this?

- **Memory leaks**: Unsubscribed event listeners
- **Growing state**: Data not being cleaned up
- **API calls**: Repeated or unnecessary requests
- **Re-renders**: Unnecessary component updates

Use React DevTools Profiler to identify performance bottlenecks.

---

## Need More Help?

If your question isn't answered here:

1. Check the [documentation](/docs)
2. Look at [plugin examples](/docs/plugin-examples.md)
3. Search [existing issues](https://github.com/your-org/ai-first-saas-react-starter/issues)
4. Join our [community discussions](https://github.com/your-org/ai-first-saas-react-starter/discussions)
5. Create a [new issue](https://github.com/your-org/ai-first-saas-react-starter/issues/new) with detailed information

Remember to include:
- Framework version
- Node.js version
- Browser and version
- Steps to reproduce the issue
- Expected vs actual behavior
- Error messages (if any)