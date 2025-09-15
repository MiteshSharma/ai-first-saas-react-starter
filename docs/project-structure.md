# Project Structure Guide

This guide provides a comprehensive overview of the AI-First SaaS React Starter project structure, explaining how the Core Framework + Plugin Architecture is organized and why.

## 🏗️ High-Level Overview

The project follows a **layered architecture** with clear separation of concerns:

```
ai-first-saas-react-starter/
├── 📁 src/                         # Application Source Code
│   ├── 🏗️ core/                    # Core Framework (Foundation)
│   ├── 🔌 plugins/                 # Plugin System (Features)
│   ├── 🎨 shared/                  # Shared Resources
│   ├── 📄 App.tsx                  # Application Root
│   ├── 📄 main.tsx                 # Entry Point
│   └── 📄 plugin-registry.ts       # Plugin Registration
├── 📁 public/                      # Static Assets
├── 📁 docs/                        # Documentation
├── 📁 tests/                       # Test Utilities
├── 📁 config/                      # Configuration Files
└── 📄 Package Files                # Dependencies & Scripts
```

## 🔍 Detailed Structure

### 📁 `/src` - Application Source

The main application source code, organized by architectural layer:

```
src/
├── core/                           # 🏗️ Core Framework
├── plugins/                        # 🔌 Plugin System
├── shared/                         # 🎨 Shared Resources
├── App.tsx                         # Application Bootstrap
├── main.tsx                        # Application Entry Point
├── plugin-registry.ts              # Plugin Registration
├── vite-env.d.ts                   # Vite Type Definitions
└── globals.d.ts                    # Global Type Definitions
```

## 🏗️ Core Framework (`/src/core`)

The **Core Framework** provides the foundation that all plugins build upon:

```
src/core/
├── 🔐 auth/                        # Authentication System
│   ├── AuthService.ts              # Auth business logic
│   ├── AuthStore.ts                # Auth state management
│   ├── authAPI.ts                  # Auth API client
│   ├── types/                      # Auth TypeScript types
│   │   ├── auth.types.ts
│   │   └── user.types.ts
│   └── __tests__/                  # Auth tests
│       ├── AuthService.test.ts
│       └── AuthStore.test.ts
├── 🌐 api/                         # API Layer
│   ├── ApiHelper.ts                # HTTP client wrapper
│   ├── interceptors/               # Request/Response interceptors
│   │   ├── authInterceptor.ts
│   │   ├── errorInterceptor.ts
│   │   └── loggingInterceptor.ts
│   ├── types/                      # API types
│   │   ├── api.types.ts
│   │   └── response.types.ts
│   └── __tests__/                  # API tests
├── 🏪 stores/                      # Base Store Patterns
│   ├── base/                       # Base store utilities
│   │   ├── createBaseStore.ts      # Store factory
│   │   ├── requestLifecycle.ts     # Async request patterns
│   │   ├── cacheManager.ts         # Caching utilities
│   │   └── storeTypes.ts           # Store TypeScript types
│   ├── app/                        # App-level stores
│   │   ├── appStore.ts             # Global app state
│   │   ├── uiStore.ts              # UI state (modals, drawers)
│   │   └── navigationStore.ts      # Navigation state
│   └── __tests__/                  # Store tests
├── 🎛️ events/                      # Event Bus System
│   ├── EventBus.ts                 # Main event bus implementation
│   ├── EventLogger.ts              # Event logging & debugging
│   ├── types/                      # Event types
│   │   ├── eventTypes.ts           # All event definitions
│   │   ├── coreEvents.ts           # Core framework events
│   │   └── pluginEvents.ts         # Plugin-specific events
│   └── __tests__/                  # Event bus tests
├── 🔌 plugins/                     # Plugin Management
│   ├── PluginManager.ts            # Plugin lifecycle management
│   ├── PluginContext.ts            # Context provided to plugins
│   ├── pluginTestHelper.ts         # Plugin testing utilities
│   ├── types/                      # Plugin types
│   │   ├── plugin.types.ts         # Plugin interfaces
│   │   └── lifecycle.types.ts      # Lifecycle types
│   └── __tests__/                  # Plugin system tests
├── 🛣️ router/                      # Routing System
│   ├── RouterManager.ts            # Route management
│   ├── RouteGuard.ts               # Authentication guards
│   ├── navigationHelpers.ts        # Navigation utilities
│   └── __tests__/                  # Router tests
├── 🔧 utils/                       # Shared Utilities
│   ├── storage/                    # Storage utilities
│   │   ├── localStorage.ts
│   │   └── sessionStorage.ts
│   ├── validation/                 # Validation helpers
│   │   ├── validators.ts
│   │   └── schemas.ts
│   ├── formatting/                 # Data formatting
│   │   ├── dateFormatter.ts
│   │   ├── numberFormatter.ts
│   │   └── textFormatter.ts
│   ├── constants/                  # App constants
│   │   ├── routes.ts
│   │   ├── config.ts
│   │   └── defaults.ts
│   └── __tests__/                  # Utility tests
└── 🌍 types/                       # Core TypeScript Types
    ├── global.types.ts             # Global type definitions
    ├── common.types.ts             # Common interfaces
    └── index.ts                    # Type exports
```

### 🔐 Authentication System (`/src/core/auth`)

Provides complete authentication functionality:

```typescript
// AuthService.ts - Main authentication logic
export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult>
  async logout(): Promise<void>
  async refreshToken(): Promise<AuthResult>
  async getCurrentUser(): Promise<User | null>
  isAuthenticated(): boolean
}

// AuthStore.ts - Authentication state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
```

### 🌐 API Layer (`/src/core/api`)

Centralized HTTP client with interceptors:

```typescript
// ApiHelper.ts - HTTP client wrapper
export class ApiHelper {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}
```

## 🔌 Plugin System (`/src/plugins`)

Each plugin is a **self-contained feature module**:

```
src/plugins/
├── 📁 UserManagement/              # User Management Plugin
│   ├── UserManagementPlugin.ts     # Main plugin class
│   ├── 🏪 stores/                  # Plugin-specific stores
│   │   ├── userStore.ts            # User state management
│   │   └── userPreferencesStore.ts # User preferences
│   ├── 🎨 components/              # Plugin components
│   │   ├── UserList.tsx            # User listing
│   │   ├── UserForm.tsx            # User creation/editing
│   │   ├── UserProfile.tsx         # User profile display
│   │   └── UserCard.tsx            # User card component
│   ├── 📄 pages/                   # Plugin pages
│   │   ├── UserListPage.tsx        # Users listing page
│   │   ├── UserDetailPage.tsx      # User detail page
│   │   └── UserSettingsPage.tsx    # User settings page
│   ├── 🌐 services/                # Plugin services
│   │   ├── userService.ts          # User API integration
│   │   └── userValidation.ts       # User validation logic
│   ├── 🛣️ routes/                  # Plugin routes
│   │   ├── userRoutes.ts           # Route definitions
│   │   └── routeGuards.ts          # Plugin-specific guards
│   ├── 🌍 types/                   # Plugin types
│   │   ├── user.types.ts           # User interfaces
│   │   └── userEvents.types.ts     # User event types
│   ├── 🎨 styles/                  # Plugin styles
│   │   ├── UserList.module.css
│   │   └── UserForm.module.css
│   ├── 🧪 __tests__/               # Plugin tests
│   │   ├── UserManagementPlugin.test.ts
│   │   ├── stores/
│   │   ├── components/
│   │   └── services/
│   └── 📖 README.md                # Plugin documentation
├── 📁 Dashboard/                   # Dashboard Plugin
│   ├── DashboardPlugin.ts
│   ├── stores/
│   │   ├── dashboardStore.ts
│   │   └── widgetStore.ts
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   ├── Widget.tsx
│   │   ├── MetricCard.tsx
│   │   └── Chart.tsx
│   ├── pages/
│   │   └── DashboardPage.tsx
│   ├── services/
│   │   └── dashboardService.ts
│   ├── types/
│   │   └── dashboard.types.ts
│   └── __tests__/
├── 📁 ProjectManagement/           # Project Management Plugin
│   ├── ProjectManagementPlugin.ts
│   ├── stores/
│   │   ├── projectStore.ts
│   │   └── taskStore.ts
│   ├── components/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── TaskList.tsx
│   │   └── TaskForm.tsx
│   ├── pages/
│   │   ├── ProjectListPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── TaskBoardPage.tsx
│   ├── services/
│   │   ├── projectService.ts
│   │   └── taskService.ts
│   └── __tests__/
├── 📁 Analytics/                   # Analytics Plugin
│   ├── AnalyticsPlugin.ts
│   ├── stores/
│   │   └── analyticsStore.ts
│   ├── components/
│   │   ├── AnalyticsChart.tsx
│   │   └── MetricsGrid.tsx
│   ├── services/
│   │   └── analyticsService.ts
│   └── __tests__/
└── 📄 index.ts                     # Plugin exports
```

### 🔌 Plugin Structure Example

Each plugin follows a **standardized structure**:

```typescript
// UserManagementPlugin.ts - Main plugin class
export class UserManagementPlugin implements Plugin {
  name = 'UserManagement';
  version = '1.0.0';
  dependencies = ['AuthPlugin']; // Optional dependencies

  async install(context: PluginContext): Promise<void> {
    // One-time setup: database, configuration, etc.
    console.log('🔧 Installing User Management plugin');
  }

  async activate(context: PluginContext): Promise<void> {
    // Register routes
    context.registerRoute('/users', UserListPage);
    context.registerRoute('/users/:id', UserDetailPage);
    context.registerRoute('/users/:id/settings', UserSettingsPage);

    // Subscribe to events
    context.eventBus.subscribe('AUTH_LOGIN', this.handleUserLogin);
    context.eventBus.subscribe('AUTH_LOGOUT', this.handleUserLogout);

    // Register navigation items
    context.registerNavItem({
      path: '/users',
      label: 'Users',
      icon: 'UserOutlined',
      order: 2
    });

    console.log('✅ User Management plugin activated');
  }

  async deactivate(context: PluginContext): Promise<void> {
    // Cleanup: unsubscribe from events, clear timers, etc.
    context.eventBus.unsubscribe('AUTH_LOGIN', this.handleUserLogin);
    context.eventBus.unsubscribe('AUTH_LOGOUT', this.handleUserLogout);

    console.log('❌ User Management plugin deactivated');
  }

  async uninstall(context: PluginContext): Promise<void> {
    // Complete removal: delete data, configuration, etc.
    console.log('🗑️ Uninstalling User Management plugin');
  }

  private handleUserLogin = (event: AuthLoginEvent) => {
    // Plugin-specific logic for user login
    const userStore = useUserStore.getState();
    userStore.loadCurrentUser(event.user.id);
  };

  private handleUserLogout = () => {
    // Plugin-specific cleanup for user logout
    const userStore = useUserStore.getState();
    userStore.clearUser();
  };
}
```

## 🎨 Shared Resources (`/src/shared`)

Common resources used across the application:

```
src/shared/
├── 🎨 components/                  # Reusable UI Components
│   ├── common/                     # Basic components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Table/
│   ├── forms/                      # Form components
│   │   ├── FormField/
│   │   ├── FormSelect/
│   │   └── FormDatePicker/
│   ├── layout/                     # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── MainLayout/
│   └── feedback/                   # Feedback components
│       ├── Loading/
│       ├── ErrorBoundary/
│       └── Toast/
├── 🖼️ assets/                      # Static Assets
│   ├── images/                     # Images and icons
│   │   ├── logos/
│   │   ├── icons/
│   │   └── illustrations/
│   ├── fonts/                      # Custom fonts
│   └── styles/                     # Global styles
│       ├── globals.css             # Global CSS
│       ├── variables.css           # CSS variables
│       ├── antd-overrides.css      # Ant Design customizations
│       └── themes/                 # Theme definitions
│           ├── light.css
│           └── dark.css
├── 🛠️ hooks/                       # Custom React Hooks
│   ├── useApi.ts                   # API interaction hook
│   ├── useDebounce.ts              # Debounce hook
│   ├── useLocalStorage.ts          # Local storage hook
│   ├── useEventBus.ts              # Event bus hook
│   └── __tests__/                  # Hook tests
├── 🔧 utils/                       # Utility Functions
│   ├── constants.ts                # App constants
│   ├── helpers.ts                  # General helpers
│   ├── permissions.ts              # Permission utilities
│   └── __tests__/                  # Utility tests
└── 🌍 types/                       # Shared TypeScript Types
    ├── common.ts                   # Common interfaces
    ├── ui.ts                       # UI-related types
    └── index.ts                    # Type exports
```

### 🎨 Component Organization

Shared components follow a **consistent structure**:

```typescript
// Example: Button component structure
src/shared/components/common/Button/
├── Button.tsx                      # Main component
├── Button.module.css               # Component styles
├── Button.test.tsx                 # Component tests
├── Button.stories.tsx              # Storybook stories (if using)
├── types.ts                        # Component-specific types
└── index.ts                        # Export file

// Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  onClick
}) => {
  // Component implementation
};
```

## 📄 Root Files

### `App.tsx` - Application Bootstrap

```typescript
// App.tsx - Main application component
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { PluginManager } from './core/plugins/PluginManager';
import { MainLayout } from './shared/components/layout/MainLayout';
import { ErrorBoundary } from './shared/components/feedback/ErrorBoundary';
import { plugins } from './plugin-registry';
import './shared/assets/styles/globals.css';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider theme={customTheme}>
        <BrowserRouter>
          <PluginManager plugins={plugins}>
            <MainLayout />
          </PluginManager>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
};
```

### `main.tsx` - Application Entry Point

```typescript
// main.tsx - Application entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Initialize core services
import { eventBus } from './core/events/EventBus';
import { authService } from './core/auth/AuthService';

// Global error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  eventBus.emit('GLOBAL_ERROR', { error: event.reason });
});

// Start the application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `plugin-registry.ts` - Plugin Registration

```typescript
// plugin-registry.ts - Central plugin registration
import { Plugin } from './core/plugins/types/plugin.types';
import { UserManagementPlugin } from './plugins/UserManagement/UserManagementPlugin';
import { DashboardPlugin } from './plugins/Dashboard/DashboardPlugin';
import { ProjectManagementPlugin } from './plugins/ProjectManagement/ProjectManagementPlugin';
import { AnalyticsPlugin } from './plugins/Analytics/AnalyticsPlugin';

export const plugins: Plugin[] = [
  new UserManagementPlugin(),
  new DashboardPlugin(),
  new ProjectManagementPlugin(),
  new AnalyticsPlugin(),
];

// Plugin metadata for documentation and debugging
export const PLUGIN_METADATA = {
  total: plugins.length,
  list: plugins.map(plugin => ({
    name: plugin.name,
    version: plugin.version,
    dependencies: plugin.dependencies || []
  }))
};
```

## 📁 Configuration & Build Files

### Configuration Structure

```
config/
├── 🔧 build/                       # Build configuration
│   ├── webpack.config.js           # Webpack configuration
│   ├── vite.config.ts              # Vite configuration
│   └── paths.js                    # Path constants
├── 🧪 test/                        # Test configuration
│   ├── jest.config.js              # Jest configuration
│   ├── setupTests.ts               # Test setup
│   └── testUtils.tsx               # Test utilities
├── 🔍 eslint/                      # ESLint configuration
│   ├── .eslintrc.js                # Main ESLint config
│   ├── react.js                    # React-specific rules
│   └── typescript.js               # TypeScript rules
└── 📋 tsconfig/                    # TypeScript configuration
    ├── tsconfig.json               # Main TS config
    ├── tsconfig.app.json           # App-specific config
    └── tsconfig.test.json          # Test-specific config
```

### Environment Configuration

```typescript
// Environment variables structure
interface EnvironmentConfig {
  // API Configuration
  REACT_APP_API_URL: string;
  REACT_APP_API_TIMEOUT: number;

  // Authentication
  REACT_APP_AUTH_PROVIDER: 'jwt' | 'oauth' | 'saml';
  REACT_APP_JWT_SECRET: string;

  // Features
  REACT_APP_USE_MOCK_API: boolean;
  REACT_APP_ENABLE_ANALYTICS: boolean;
  REACT_APP_DEBUG_MODE: boolean;

  // Plugin Configuration
  REACT_APP_PLUGIN_DEV_MODE: boolean;
  REACT_APP_PLUGIN_HOT_RELOAD: boolean;
}
```

## 🧪 Testing Structure

### Test Organization

```
tests/
├── 🧪 unit/                        # Unit tests
│   ├── core/                       # Core framework tests
│   ├── plugins/                    # Plugin tests
│   └── shared/                     # Shared component tests
├── 🔗 integration/                 # Integration tests
│   ├── plugin-interactions/        # Plugin interaction tests
│   ├── api-integration/            # API integration tests
│   └── user-flows/                 # User flow tests
├── 🎭 e2e/                         # End-to-end tests
│   ├── auth/                       # Authentication flows
│   ├── user-management/            # User management flows
│   └── project-workflows/          # Project workflows
├── 🔧 utils/                       # Test utilities
│   ├── mockHelpers.ts              # Mock utilities
│   ├── testSetup.ts                # Test setup helpers
│   └── pluginTestHelpers.ts        # Plugin testing utilities
└── 📋 fixtures/                    # Test data
    ├── users.json                  # User test data
    ├── projects.json               # Project test data
    └── events.json                 # Event test data
```

## 📦 Package Structure

### Root Package Files

```
ai-first-saas-react-starter/
├── 📄 package.json                 # Main package configuration
├── 📄 package-lock.json            # Dependency lock file
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 vite.config.ts               # Vite build configuration
├── 📄 .eslintrc.js                 # ESLint configuration
├── 📄 .prettierrc                  # Prettier configuration
├── 📄 .gitignore                   # Git ignore rules
├── 📄 README.md                    # Project documentation
├── 📄 CHANGELOG.md                 # Version history
├── 📄 LICENSE                      # License information
└── 📄 CLAUDE.md                    # AI assistant configuration
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "typecheck": "tsc --noEmit",
    "generate:plugin": "ai-first g plugin",
    "generate:component": "ai-first g component",
    "analyze:bundle": "npm run build && npx vite-bundle-analyzer",
    "docs:serve": "docsify serve docs"
  }
}
```

## 🎯 Key Architectural Principles

### 1. **Separation of Concerns**
- **Core Framework**: Provides foundation services
- **Plugins**: Implement specific business features
- **Shared**: Common UI and utilities

### 2. **Dependency Direction**
```
Plugins → Core Framework → Shared
     ↓
No dependencies between plugins (event-driven communication)
```

### 3. **Plugin Independence**
- Each plugin is self-contained
- Plugins communicate via events, not direct imports
- Plugins can be developed, tested, and deployed independently

### 4. **Type Safety**
- Full TypeScript throughout the stack
- Shared type definitions for events and core interfaces
- Plugin-specific types co-located with plugin code

### 5. **Testing Strategy**
- Unit tests for individual components and services
- Integration tests for plugin interactions
- End-to-end tests for complete user workflows

## 🚀 Navigation Patterns

### File Naming Conventions

```typescript
// Components (PascalCase)
UserList.tsx
UserForm.tsx
DashboardWidget.tsx

// Stores (camelCase with Store suffix)
userStore.ts
authStore.ts
projectStore.ts

// Services (camelCase with Service suffix)
userService.ts
authService.ts
apiService.ts

// Types (camelCase with .types suffix)
user.types.ts
auth.types.ts
api.types.ts

// Tests (same name with .test suffix)
UserList.test.tsx
userStore.test.ts
authService.test.ts

// CSS Modules (.module.css)
UserList.module.css
DashboardWidget.module.css
```

### Import Patterns

```typescript
// Core imports (absolute paths from src)
import { AuthService } from 'core/auth/AuthService';
import { eventBus } from 'core/events/EventBus';
import { useUserStore } from 'core/stores/userStore';

// Plugin imports (relative within plugin)
import { UserForm } from './components/UserForm';
import { userService } from './services/userService';

// Shared imports (absolute paths)
import { Button } from 'shared/components/common/Button';
import { useApi } from 'shared/hooks/useApi';

// External library imports
import React from 'react';
import { Form, Input } from 'antd';
import { create } from 'zustand';
```

## 🔍 Finding Your Way Around

### When You Need To...

#### **🔐 Work with Authentication**
```
📁 src/core/auth/
├── AuthService.ts      ← Business logic
├── AuthStore.ts        ← State management
└── authAPI.ts          ← API integration
```

#### **🔌 Create a New Plugin**
```
📁 src/plugins/MyPlugin/
├── MyPlugin.ts         ← Start here
├── stores/             ← State management
├── components/         ← UI components
└── services/           ← API integration
```

#### **🎨 Add Shared Components**
```
📁 src/shared/components/
├── common/             ← Basic components
├── forms/              ← Form components
└── layout/             ← Layout components
```

#### **🌐 Work with APIs**
```
📁 src/core/api/
├── ApiHelper.ts        ← HTTP client
└── interceptors/       ← Request/response handling
```

#### **🎛️ Handle Events**
```
📁 src/core/events/
├── EventBus.ts         ← Event system
└── types/eventTypes.ts ← Event definitions
```

## 📚 Next Steps

Now that you understand the project structure:

1. **[Architecture](./architecture.md)** - Understand the system design principles
2. **[Plugin Development](./plugin-development.md)** - Learn to create plugins
3. **[Core Framework](./core-framework.md)** - Deep dive into core services
4. **[State Management](./state-management.md)** - Master the store patterns

---

This structure is designed to **scale with your team** and **grow with your features**. The clear separation makes it easy for multiple developers to work simultaneously without conflicts, while the plugin architecture ensures your codebase remains maintainable as it grows.

**Happy coding!** 🚀