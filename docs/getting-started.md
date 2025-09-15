# Getting Started

Welcome to the AI-First SaaS React Starter! This guide will help you set up your first project and understand the core concepts.

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 or **yarn** >= 1.22.0
- **Git** for version control

### Installation

#### Option 1: Create New Project (Recommended)
```bash
# Create a new project
npx ai-first-saas-react-starter my-saas-app

# Navigate to project
cd my-saas-app

# Start development server
npm start
```

#### Option 2: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-org/ai-first-saas-react-starter.git
cd ai-first-saas-react-starter

# Install dependencies
npm install

# Start development server
npm start
```

### Your First Look
After running `npm start`, you'll see:
- **Dashboard** at `http://localhost:3000`
- **Plugin Management** interface
- **Live development** with hot reload

## 🏗️ Project Structure

```
my-saas-app/
├── src/
│   ├── core/                    # Core Framework
│   │   ├── auth/               # Authentication system
│   │   ├── api/                # API layer and helpers
│   │   ├── stores/             # Base store patterns
│   │   ├── plugins/            # Plugin management
│   │   ├── EventBus/           # Event system
│   │   └── utils/              # Shared utilities
│   ├── plugins/                # Plugin Directory
│   │   ├── UserManagement/     # User management plugin
│   │   ├── ProjectManagement/  # Project management plugin
│   │   └── Analytics/          # Analytics plugin
│   ├── pages/                  # Main application pages
│   ├── components/             # Shared React components
│   └── App.tsx                 # Application root
├── public/                     # Static assets
├── docs/                       # Documentation
└── package.json               # Dependencies and scripts
```

## 🎯 Core Concepts

### 1. **Core Framework**
The foundation that provides:
- Authentication and user management
- API layer with request/response handling
- Base store patterns for state management
- Event bus for communication
- Shared utilities and types

### 2. **Plugin System**
Independent modules that:
- Implement specific features
- Communicate via events
- Have their own stores and components
- Can be activated/deactivated dynamically

### 3. **Event Bus**
Central communication system:
- Type-safe event definitions
- Subscription management
- Debugging and monitoring
- Performance optimized

## 🔄 Development Workflow

### Step 1: Understanding the Core
Let's explore the authentication system:

```typescript
// src/core/auth/AuthStore.ts
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const user = await authAPI.login(credentials);
    set({ user, isAuthenticated: true });

    // Emit event for plugins
    eventBus.emit('USER_LOGIN', { user });
  }
}));
```

### Step 2: Examining a Plugin
Look at the User Management plugin:

```typescript
// src/plugins/UserManagement/UserManagementPlugin.ts
export class UserManagementPlugin implements Plugin {
  name = 'UserManagement';
  version = '1.0.0';

  async activate(context: PluginContext): Promise<void> {
    // Subscribe to auth events
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin);

    // Register routes
    context.registerRoute('/profile', UserProfilePage);
  }

  private handleUserLogin = (event: any) => {
    // Handle user login in this plugin
    console.log('User logged in:', event.user);
  };
}
```

### Step 3: Event Communication
See how plugins communicate:

```typescript
// Plugin A emits an event
eventBus.emit('PROJECT_CREATED', {
  projectId: '123',
  name: 'My Project',
  userId: currentUser.id
});

// Plugin B listens to the event
eventBus.subscribe('PROJECT_CREATED', (data) => {
  // Update analytics, send notifications, etc.
  trackEvent('project_created', data);
});
```

## 🛠️ Your First Plugin

Let's create a simple notification plugin:

### 1. Generate the Plugin
```bash
# Use the CLI to generate a new plugin
npx ai-first g plugin Notifications --with-store --with-routes
```

This creates:
```
src/plugins/Notifications/
├── NotificationsPlugin.ts      # Main plugin class
├── stores/                     # Plugin stores
│   └── notificationStore.ts
├── components/                 # Plugin components
│   └── NotificationList.tsx
├── pages/                      # Plugin pages
│   └── NotificationsPage.tsx
└── __tests__/                  # Plugin tests
    └── NotificationsPlugin.test.ts
```

### 2. Implement the Plugin
```typescript
// src/plugins/Notifications/NotificationsPlugin.ts
export class NotificationsPlugin implements Plugin {
  name = 'Notifications';
  version = '1.0.0';

  async install(context: PluginContext): Promise<void> {
    console.log('🔔 Installing Notifications plugin');
  }

  async activate(context: PluginContext): Promise<void> {
    // Subscribe to various events
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.subscribe('PROJECT_CREATED', this.handleProjectCreated);

    // Register routes
    context.registerRoute('/notifications', NotificationsPage);

    // Register in navigation (if using nav plugin)
    context.eventBus.emit('REGISTER_NAV_ITEM', {
      path: '/notifications',
      label: 'Notifications',
      icon: 'BellOutlined'
    });
  }

  private handleUserLogin = (event: any) => {
    this.addNotification({
      type: 'success',
      message: `Welcome back, ${event.user.name}!`,
      timestamp: new Date()
    });
  };

  private handleProjectCreated = (event: any) => {
    this.addNotification({
      type: 'info',
      message: `New project "${event.name}" created`,
      timestamp: new Date()
    });
  };

  private addNotification(notification: any) {
    const store = useNotificationStore.getState();
    store.addNotification(notification);
  }
}
```

### 3. Create the Store
```typescript
// src/plugins/Notifications/stores/notificationStore.ts
import { create } from 'zustand';
import { createRequestLifecycleMethods } from '../../../core/stores/base/requestLifecycle';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      read: false
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  }
}));
```

### 4. Create the Component
```typescript
// src/plugins/Notifications/components/NotificationList.tsx
import React from 'react';
import { List, Badge, Button, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNotificationStore } from '../stores/notificationStore';

const { Text } = Typography;

export const NotificationList: React.FC = () => {
  const { notifications, markAsRead, clearAll } = useNotificationStore();

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h3>
          <BellOutlined /> Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <Badge count={notifications.filter(n => !n.read).length} />
          )}
        </h3>
        <Button size="small" onClick={clearAll}>
          Clear All
        </Button>
      </div>

      <List
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            actions={[
              !notification.read && (
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => markAsRead(notification.id)}
                />
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={
                <Text strong={!notification.read} type={notification.type === 'error' ? 'danger' : undefined}>
                  {notification.message}
                </Text>
              }
              description={notification.timestamp.toLocaleString()}
            />
          </List.Item>
        )}
      />
    </div>
  );
};
```

### 5. Register the Plugin
```typescript
// src/plugins/pluginRegistry.ts
import { NotificationsPlugin } from './Notifications/NotificationsPlugin';

export const AVAILABLE_PLUGINS = [
  // ... existing plugins
  NotificationsPlugin,
];
```

### 6. Test Your Plugin
```bash
# Run tests
npm test -- --testPathPattern="Notifications"

# Start the app and test manually
npm start
```

## 🧪 Testing Your Code

### Unit Tests
Test your plugin components:
```typescript
// src/plugins/Notifications/__tests__/NotificationList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationList } from '../components/NotificationList';
import { useNotificationStore } from '../stores/notificationStore';

describe('NotificationList', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearAll();
  });

  it('displays notifications', () => {
    const store = useNotificationStore.getState();
    store.addNotification({
      type: 'info',
      message: 'Test notification',
      timestamp: new Date()
    });

    render(<NotificationList />);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  it('marks notifications as read', () => {
    const store = useNotificationStore.getState();
    store.addNotification({
      type: 'info',
      message: 'Test notification',
      timestamp: new Date()
    });

    render(<NotificationList />);
    fireEvent.click(screen.getByRole('button', { name: /check/i }));

    expect(store.unreadCount).toBe(0);
  });
});
```

### Integration Tests
Test plugin interactions:
```typescript
// src/plugins/Notifications/__tests__/NotificationsPlugin.test.ts
import { setupPluginTest, simulateEvent } from '../../../core/plugins/pluginTestHelper';
import { NotificationsPlugin } from '../NotificationsPlugin';

describe('NotificationsPlugin', () => {
  it('handles user login events', async () => {
    const { plugin, eventBus } = await setupPluginTest(NotificationsPlugin);

    await simulateEvent(eventBus, 'USER_LOGIN', {
      user: { id: '1', name: 'John Doe' }
    });

    // Check that notification was added
    const store = useNotificationStore.getState();
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].message).toContain('Welcome back, John Doe');
  });
});
```

## 🎨 Customization

### Styling
Customize the appearance:
```css
/* src/plugins/Notifications/styles.css */
.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item.unread {
  background-color: #f0f8ff;
  border-left: 3px solid #1890ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}
```

### Configuration
Add plugin configuration:
```typescript
// src/plugins/Notifications/config.ts
export interface NotificationConfig {
  maxNotifications: number;
  autoMarkAsRead: boolean;
  showTimestamp: boolean;
}

export const defaultConfig: NotificationConfig = {
  maxNotifications: 100,
  autoMarkAsRead: false,
  showTimestamp: true
};
```

## 🎯 Next Steps

Now that you have a working plugin, explore:

1. **[Architecture](./architecture.md)** - Understand the system design
2. **[Plugin System](./plugin-system.md)** - Deep dive into plugin concepts
3. **[Event Bus](./event-bus.md)** - Master event-driven communication
4. **[State Management](./state-management.md)** - Advanced store patterns
5. **[Plugin Examples](./plugin-examples.md)** - Real-world implementations

## 🛠️ Development Commands

```bash
# Development
npm start                    # Start development server
npm test                     # Run tests
npm run build               # Build for production

# Code Generation
npx ai-first g plugin MyPlugin          # Generate plugin
npx ai-first g component MyComponent    # Generate component
npx ai-first g store MyStore           # Generate store
npx ai-first g service MyService       # Generate service

# Code Quality
npm run lint                # Lint code
npm run typecheck          # TypeScript checking
npm run format             # Format code

# Testing
npm run test:coverage      # Test with coverage
npm run test:watch         # Watch mode testing
```

## 🆘 Troubleshooting

### Common Issues

#### Plugin Not Loading
```bash
# Check plugin registration
grep -r "MyPlugin" src/plugins/pluginRegistry.ts

# Check for TypeScript errors
npm run typecheck
```

#### Events Not Working
```typescript
// Debug events
eventBus.on('*', (eventName, data) => {
  console.log('Event:', eventName, data);
});
```

#### Store Not Updating
```typescript
// Check store subscription
useEffect(() => {
  const unsubscribe = useMyStore.subscribe(
    (state) => console.log('Store updated:', state)
  );
  return unsubscribe;
}, []);
```

### Getting Help
- **Documentation** - Check relevant docs sections
- **GitHub Issues** - Search existing issues
- **Community** - Join our Discord/Slack
- **Examples** - Look at working plugin examples

Ready to dive deeper? Continue with **[Architecture](./architecture.md)** to understand the system design!