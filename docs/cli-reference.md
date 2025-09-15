# CLI Reference

The AI-First SaaS React Starter CLI is a powerful code generation and project management tool that accelerates development and maintains consistency across your codebase.

## 🚀 Installation & Setup

### Global Installation
```bash
# Install globally
npm install -g ai-first-saas-react-starter

# Verify installation
ai-first --version
```

### Project-Level Usage
```bash
# Use with npx (recommended)
npx ai-first-saas-react-starter <command>

# Use with npm scripts
npm run ai-first <command>
```

## 📖 Command Structure

```bash
ai-first <command> [options] [arguments]
```

### Global Options
- `--help, -h` - Show help information
- `--version, -v` - Show version information
- `--verbose` - Enable verbose logging
- `--dry-run` - Show what would be generated without creating files
- `--config <path>` - Specify custom config file

## 🏗️ Project Commands

### `create-app`
Create a new AI-First SaaS application.

```bash
ai-first create-app <app-name> [options]
```

#### Options
- `--template <name>` - Use specific template (default: `default`)
- `--with-auth` - Include authentication scaffolding (default: `true`)
- `--with-tenant` - Include multi-tenant patterns (default: `true`)
- `--typescript` - Use TypeScript (default: `true`)
- `--package-manager <npm|yarn|pnpm>` - Package manager to use
- `--git` - Initialize git repository (default: `true`)
- `--install` - Install dependencies after creation (default: `true`)

#### Examples
```bash
# Basic app with all defaults
ai-first create-app my-saas-app

# Minimal app without auth
ai-first create-app simple-app --with-auth=false --with-tenant=false

# Custom configuration
ai-first create-app enterprise-app \
  --template=enterprise \
  --package-manager=yarn \
  --git=true
```

#### Output Structure
```
my-saas-app/
├── src/
│   ├── core/                 # Core framework
│   ├── plugins/              # Default plugins
│   ├── pages/                # Application pages
│   └── components/           # Shared components
├── public/                   # Static assets
├── docs/                     # Documentation
├── package.json
└── README.md
```

## 🔌 Plugin Commands

### `generate plugin` / `g plugin`
Generate a new plugin with complete structure.

```bash
ai-first g plugin <plugin-name> [options]
```

#### Options
- `--description <text>` - Plugin description
- `--with-store` - Include Zustand store (default: `true`)
- `--with-routes` - Include React Router routes (default: `true`)
- `--with-api` - Include API service layer (default: `true`)
- `--with-tests` - Include test files (default: `true`)
- `--antd` - Use Ant Design components (default: `true`)
- `--styled` - Include styled-components (default: `false`)
- `--auth` - Include authentication integration (default: `true`)
- `--tenant` - Include tenant-aware patterns (default: `true`)

#### Examples
```bash
# Full-featured plugin
ai-first g plugin TaskManagement \
  --description="Complete task management system" \
  --with-store \
  --with-routes \
  --with-api

# Minimal plugin
ai-first g plugin SimpleWidget \
  --with-store=false \
  --with-routes=false \
  --with-api=false

# UI-only plugin
ai-first g plugin Dashboard \
  --with-api=false \
  --styled=true
```

#### Generated Structure
```
src/plugins/TaskManagement/
├── TaskManagementPlugin.ts   # Main plugin class
├── stores/                   # State management
│   └── taskStore.ts
├── components/              # React components
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   └── TaskDetail.tsx
├── pages/                   # Route pages
│   ├── TaskListPage.tsx
│   ├── TaskDetailPage.tsx
│   └── CreateTaskPage.tsx
├── services/                # API services
│   └── taskService.ts
├── types.ts                 # TypeScript types
├── config.ts                # Plugin configuration
└── __tests__/               # Test files
    ├── TaskManagementPlugin.test.ts
    ├── stores/
    ├── components/
    └── services/
```

## 🧩 Component Commands

### `generate component` / `g component`
Generate React components with proper structure and tests.

```bash
ai-first g component <component-name> [options]
```

#### Options
- `--type <type>` - Component type: `functional|class|hook` (default: `functional`)
- `--antd` - Use Ant Design components (default: `true`)
- `--styled` - Use styled-components (default: `false`)
- `--props <interface>` - TypeScript props interface name
- `--story` - Generate Storybook story (default: `false`)
- `--test` - Generate test file (default: `true`)
- `--export` - Add to index.ts exports (default: `true`)
- `--path <path>` - Custom path for component

#### Examples
```bash
# Basic functional component
ai-first g component UserCard

# Component with custom props
ai-first g component ProductCard \
  --props="ProductCardProps" \
  --antd \
  --story

# Hook component
ai-first g component useUserData \
  --type=hook \
  --test

# Component in specific path
ai-first g component TaskItem \
  --path="src/plugins/TaskManagement/components"
```

#### Generated Files
```
src/components/UserCard/
├── UserCard.tsx             # Component implementation
├── UserCard.test.tsx        # Unit tests
├── UserCard.stories.tsx     # Storybook story (if --story)
├── UserCard.module.css      # Styles (if --styled=false)
├── UserCard.styled.ts       # Styled components (if --styled)
└── index.ts                 # Barrel export
```

#### Component Template
```typescript
// UserCard.tsx
import React from 'react';
import { Card, Avatar, Typography } from 'antd';

const { Text, Title } = Typography;

export interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onClick?: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  return (
    <Card
      hoverable
      onClick={() => onClick?.(user.id)}
      className="user-card"
    >
      <Card.Meta
        avatar={<Avatar src={user.avatar} size="large">{user.name[0]}</Avatar>}
        title={<Title level={4}>{user.name}</Title>}
        description={<Text type="secondary">{user.email}</Text>}
      />
    </Card>
  );
};
```

## 🗄️ Store Commands

### `generate store` / `g store`
Generate Zustand stores with standardized patterns.

```bash
ai-first g store <store-name> [options]
```

#### Options
- `--api` - Include API integration (default: `true`)
- `--persist` - Add persistence with localStorage (default: `false`)
- `--middleware` - Include middleware (logger, devtools) (default: `true`)
- `--crud` - Generate CRUD operations (default: `true`)
- `--pagination` - Include pagination support (default: `false`)
- `--cache` - Add caching layer (default: `false`)
- `--optimistic` - Optimistic updates (default: `false`)

#### Examples
```bash
# Basic store with API
ai-first g store UserStore \
  --api \
  --crud

# Store with persistence and pagination
ai-first g store ProductStore \
  --persist \
  --pagination \
  --cache

# Simple state store
ai-first g store UIStore \
  --api=false \
  --crud=false
```

#### Generated Store Template
```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createRequestLifecycleMethods } from '../core/stores/base/requestLifecycle';
import { UserAPIService } from '../services/userService';
import { eventBus } from '../core/EventBus';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserState {
  // Data
  users: User[];
  currentUser: User | null;

  // UI State
  loading: boolean;
  error: string | null;

  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;

  // Actions
  loadUsers: () => Promise<void>;
  loadUser: (id: string) => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Pagination
  loadMore: () => Promise<void>;
  setPageSize: (size: number) => void;

  // Utility
  clearUsers: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => {
        const userAPI = new UserAPIService();
        const requestMethods = createRequestLifecycleMethods(set);

        return {
          // Initial state
          users: [],
          currentUser: null,
          loading: false,
          error: null,
          page: 1,
          pageSize: 20,
          totalCount: 0,
          hasMore: true,

          // Actions
          loadUsers: async () => {
            try {
              requestMethods.setLoading(true);
              const response = await userAPI.getUsers({
                page: get().page,
                pageSize: get().pageSize
              });

              set({
                users: response.data,
                totalCount: response.totalCount,
                hasMore: response.hasMore
              });

              eventBus.emit('USERS_LOADED', { count: response.data.length });
            } catch (error) {
              requestMethods.setError(error.message);
              eventBus.emit('USERS_LOAD_FAILED', { error });
            } finally {
              requestMethods.setLoading(false);
            }
          },

          createUser: async (userData) => {
            try {
              requestMethods.setLoading(true);
              const newUser = await userAPI.createUser(userData);

              set(state => ({
                users: [...state.users, newUser],
                totalCount: state.totalCount + 1
              }));

              eventBus.emit('USER_CREATED', { user: newUser });
            } catch (error) {
              requestMethods.setError(error.message);
              throw error;
            } finally {
              requestMethods.setLoading(false);
            }
          },

          // ... other methods
        };
      },
      {
        name: 'user-store',
        partialize: (state) => ({
          users: state.users,
          currentUser: state.currentUser
        })
      }
    ),
    {
      name: 'UserStore'
    }
  )
);
```

## 🌐 Service Commands

### `generate service` / `g service`
Generate API service classes with type safety and error handling.

```bash
ai-first g service <service-name> [options]
```

#### Options
- `--zod` - Use Zod for validation (default: `true`)
- `--cache` - Include caching layer (default: `false`)
- `--retry` - Add retry logic (default: `true`)
- `--auth` - Include authentication headers (default: `true`)
- `--tenant` - Add tenant context (default: `true`)
- `--mock` - Generate mock implementation (default: `true`)

#### Examples
```bash
# Full API service
ai-first g service UserService \
  --zod \
  --cache \
  --retry

# Simple service
ai-first g service NotificationService \
  --zod=false \
  --cache=false

# Core service
ai-first g service PaymentService \
  --auth \
  --tenant
```

#### Generated Service Template
```typescript
// services/userService.ts
import { z } from 'zod';
import { ApiHelper } from '../core/api/apiHelper';
import { CacheManager } from '../core/utils/cache';

// Zod schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'viewer']),
  createdAt: z.date(),
  updatedAt: z.date()
});

const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export class UserAPIService {
  private cache = new CacheManager('user-service');

  constructor(private apiHelper = new ApiHelper()) {}

  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }): Promise<{
    data: User[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const cacheKey = `users-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const response = await this.apiHelper.get('/users', { params });
    const result = {
      data: response.data.map(user => UserSchema.parse(user)),
      totalCount: response.totalCount,
      hasMore: response.hasMore
    };

    this.cache.set(cacheKey, result, 300000); // 5 minutes
    return result;
  }

  async getUser(id: string): Promise<User> {
    const cacheKey = `user-${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const response = await this.apiHelper.get(`/users/${id}`);
    const user = UserSchema.parse(response.data);

    this.cache.set(cacheKey, user, 300000);
    return user;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const validatedData = CreateUserSchema.parse(userData);
    const response = await this.apiHelper.post('/users', validatedData);
    const user = UserSchema.parse(response.data);

    // Invalidate cache
    this.cache.clear();
    return user;
  }

  async updateUser(id: string, updates: Partial<CreateUserRequest>): Promise<User> {
    const response = await this.apiHelper.put(`/users/${id}`, updates);
    const user = UserSchema.parse(response.data);

    // Update cache
    this.cache.delete(`user-${id}`);
    this.cache.clear(); // Clear list cache

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.apiHelper.delete(`/users/${id}`);

    // Clear cache
    this.cache.delete(`user-${id}`);
    this.cache.clear();
  }
}
```

## 📄 Page Commands

### `generate page` / `g page`
Generate complete pages with routing, stores, and services.

```bash
ai-first g page <page-name> [options]
```

#### Options
- `--route <path>` - Custom route path
- `--store` - Include store integration (default: `true`)
- `--service` - Include service integration (default: `true`)
- `--auth` - Require authentication (default: `true`)
- `--permissions <list>` - Required permissions (comma-separated)
- `--layout <name>` - Layout component to use
- `--breadcrumb` - Add breadcrumb navigation (default: `true`)

#### Examples
```bash
# Basic page with store and service
ai-first g page UsersPage \
  --route="/users" \
  --store \
  --service

# Protected admin page
ai-first g page AdminDashboard \
  --route="/admin" \
  --permissions="admin:read,admin:write" \
  --layout="AdminLayout"

# Public page without auth
ai-first g page LandingPage \
  --route="/" \
  --auth=false \
  --store=false
```

## 🔌 API Commands

### `generate endpoints` / `g endpoints`
Generate API endpoint configurations for URL and backend helpers.

```bash
ai-first g endpoints <service-name> [options]
```

#### Options
- `--auth` - Include authentication endpoints (default: `true`)
- `--tenant` - Include tenant-scoped endpoints (default: `true`)
- `--workspace` - Include workspace-scoped endpoints (default: `false`)
- `--crud` - Generate CRUD endpoints (default: `true`)
- `--upload` - Include file upload endpoints (default: `false`)

#### Examples
```bash
# User management endpoints
ai-first g endpoints UserService \
  --auth \
  --tenant \
  --crud

# File management endpoints
ai-first g endpoints FileService \
  --upload \
  --workspace

# Simple API endpoints
ai-first g endpoints SettingsService \
  --crud=false
```

#### Generated Endpoints
```typescript
// services/endpoints/userEndpoints.ts
export const USER_ENDPOINTS = {
  // CRUD operations
  getUsers: {
    method: 'GET',
    url: '/users',
    auth: true,
    tenant: true
  },

  getUser: {
    method: 'GET',
    url: '/users/:id',
    auth: true,
    tenant: true
  },

  createUser: {
    method: 'POST',
    url: '/users',
    auth: true,
    tenant: true,
    permissions: ['users:create']
  },

  updateUser: {
    method: 'PUT',
    url: '/users/:id',
    auth: true,
    tenant: true,
    permissions: ['users:update']
  },

  deleteUser: {
    method: 'DELETE',
    url: '/users/:id',
    auth: true,
    tenant: true,
    permissions: ['users:delete']
  },

  // Bulk operations
  bulkUpdateUsers: {
    method: 'POST',
    url: '/users/bulk-update',
    auth: true,
    tenant: true,
    permissions: ['users:bulk_update']
  }
} as const;
```

## 🧪 Test Commands

### `generate test` / `g test`
Generate test files for existing components, stores, or services.

```bash
ai-first g test <target-file> [options]
```

#### Options
- `--type <type>` - Test type: `unit|integration|e2e` (default: `unit`)
- `--coverage` - Include coverage requirements (default: `true`)
- `--mocks` - Generate mock files (default: `true`)
- `--fixtures` - Include test fixtures (default: `true`)

#### Examples
```bash
# Component tests
ai-first g test UserCard --type=unit --mocks

# Store integration tests
ai-first g test userStore --type=integration --fixtures

# Service tests with coverage
ai-first g test UserService --coverage --mocks
```

## ⚙️ Configuration Commands

### `config`
Manage CLI configuration and project settings.

```bash
ai-first config <action> [key] [value]
```

#### Actions
- `get <key>` - Get configuration value
- `set <key> <value>` - Set configuration value
- `list` - List all configuration
- `reset` - Reset to defaults

#### Examples
```bash
# View all config
ai-first config list

# Set default template
ai-first config set template.default enterprise

# Set default package manager
ai-first config set packageManager yarn

# Reset configuration
ai-first config reset
```

#### Configuration File
```json
// .ai-first.json
{
  "template": {
    "default": "default",
    "enterprise": "enterprise-template"
  },
  "packageManager": "npm",
  "typescript": true,
  "testing": {
    "framework": "jest",
    "coverage": true
  },
  "defaults": {
    "withAuth": true,
    "withTenant": true,
    "antd": true,
    "styled": false
  },
  "plugins": {
    "autoInstall": true,
    "autoActivate": true
  }
}
```

## 🔍 Analysis Commands

### `analyze`
Analyze project structure and provide recommendations.

```bash
ai-first analyze [options]
```

#### Options
- `--plugins` - Analyze plugin architecture
- `--performance` - Performance analysis
- `--security` - Security audit
- `--dependencies` - Dependency analysis
- `--coverage` - Test coverage analysis

#### Examples
```bash
# Full analysis
ai-first analyze --plugins --performance --security

# Plugin-specific analysis
ai-first analyze --plugins

# Performance audit
ai-first analyze --performance --dependencies
```

## 📊 Info Commands

### `info`
Display project and environment information.

```bash
ai-first info [options]
```

#### Options
- `--system` - System information
- `--project` - Project details
- `--plugins` - Installed plugins
- `--dependencies` - Dependency versions

#### Example Output
```
AI-First SaaS React Starter CLI v2.1.0

📦 Project Information:
  Name: my-saas-app
  Version: 1.0.0
  Template: enterprise
  TypeScript: ✅

🔌 Plugins (5 installed, 4 active):
  ✅ UserManagement v1.2.0
  ✅ ProjectManagement v1.1.0
  ✅ Analytics v1.0.0
  ✅ TaskManagement v1.0.0
  ⏸️ NotificationPlugin v0.9.0 (inactive)

💻 System Information:
  Node.js: v18.17.0
  npm: 9.6.7
  OS: macOS 13.4.0

🔧 Dependencies:
  react: ^18.2.0
  zustand: ^4.3.8
  antd: ^5.6.2
```

## 🚀 Advanced Usage

### Custom Templates
```bash
# Create custom template
ai-first create-template my-template --base=default

# Use custom template
ai-first create-app my-app --template=my-template
```

### Batch Operations
```bash
# Generate multiple components
ai-first g component Button Card Modal --batch

# Generate plugin with all features
ai-first g plugin ECommerce \
  --with-store \
  --with-routes \
  --with-api \
  --with-tests \
  --permissions="ecommerce:read,ecommerce:write"
```

### Environment-Specific Generation
```bash
# Generate for specific environment
ai-first g service PaymentService --env=production --cache=false

# Development-specific features
ai-first g component DebugPanel --env=development
```

This CLI provides a comprehensive toolkit for building AI-First SaaS applications with consistent patterns, proper testing, and maintainable architecture.

Next: **[API Mocking](./api-mocking.md)** - Complete guide to API mocking and development