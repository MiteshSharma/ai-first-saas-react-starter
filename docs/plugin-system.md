# Plugin System

The Plugin System is the heart of the AI-First SaaS React Starter, enabling modular, extensible applications through a powerful plugin architecture.

## 🔌 What are Plugins?

Plugins are **self-contained modules** that implement specific features or functionality. Each plugin:

- **Encapsulates** a complete feature set (UI, logic, data)
- **Communicates** with other plugins via events
- **Manages** its own lifecycle (install, activate, deactivate)
- **Provides** clear interfaces and contracts
- **Can be** added, removed, or updated independently

## 🏗️ Plugin Architecture

### Plugin Interface
```typescript
interface Plugin {
  // Plugin metadata
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];

  // Lifecycle hooks
  install?(context: PluginContext): Promise<void>;
  activate?(context: PluginContext): Promise<void>;
  deactivate?(context: PluginContext): Promise<void>;
  uninstall?(context: PluginContext): Promise<void>;

  // Optional configuration
  config?: PluginConfig;
  permissions?: PluginPermissions;
}
```

### Plugin Context
The `PluginContext` provides access to core framework services:

```typescript
interface PluginContext {
  // Core services
  auth: AuthService;
  api: ApiHelper;
  eventBus: EventBus;
  router: Router;

  // Core stores
  stores: {
    auth: AuthStore;
    tenant: TenantStore;
    navigation: NavigationStore;
  };

  // Plugin management
  pluginManager: PluginManager;

  // Utilities
  registerRoute: (route: RouteConfig) => void;
  registerNavItem: (item: NavItem) => void;
  registerComponent: (name: string, component: React.ComponentType) => void;
  getConfig: (key: string) => any;
  setConfig: (key: string, value: any) => void;

  // Permissions
  hasPermission: (permission: string) => boolean;
  checkPermission: (permission: string) => void;
}
```

## 🔄 Plugin Lifecycle

### Lifecycle States
```
┌─────────────┐    install()    ┌─────────────┐
│ Not Loaded  │──────────────→  │ Installed   │
└─────────────┘                 └─────────────┘
                                       │
                                activate()
                                       ↓
                                ┌─────────────┐
                                │   Active    │
                                └─────────────┘
                                       │
                               deactivate()
                                       ↓
                                ┌─────────────┐
                                │ Inactive    │
                                └─────────────┘
                                       │
                                uninstall()
                                       ↓
                                ┌─────────────┐
                                │ Uninstalled │
                                └─────────────┘
```

### Lifecycle Hooks

#### 1. **install(context)**
Called when plugin is first loaded:
```typescript
async install(context: PluginContext): Promise<void> {
  console.log(`🔌 Installing ${this.name} v${this.version}`);

  // One-time setup
  await this.initializeDatabase();
  await this.setupDefaultConfig();

  console.log(`✅ ${this.name} installed successfully`);
}
```

#### 2. **activate(context)**
Called when plugin becomes active:
```typescript
async activate(context: PluginContext): Promise<void> {
  console.log(`🚀 Activating ${this.name}`);

  // Subscribe to events
  this.subscriptions = [
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin),
    context.eventBus.subscribe('TENANT_SWITCHED', this.handleTenantSwitch)
  ];

  // Register routes
  context.registerRoute({
    path: '/my-feature',
    component: MyFeaturePage,
    exact: true
  });

  // Register navigation
  context.registerNavItem({
    id: 'my-feature',
    label: 'My Feature',
    path: '/my-feature',
    icon: 'FeatureOutlined',
    order: 10
  });

  console.log(`✅ ${this.name} activated`);
}
```

#### 3. **deactivate(context)**
Called when plugin is deactivated:
```typescript
async deactivate(context: PluginContext): Promise<void> {
  console.log(`⏹️ Deactivating ${this.name}`);

  // Cleanup subscriptions
  this.subscriptions.forEach(unsubscribe => unsubscribe());
  this.subscriptions = [];

  // Clear any intervals/timeouts
  this.cleanupTimers();

  console.log(`✅ ${this.name} deactivated`);
}
```

#### 4. **uninstall(context)**
Called when plugin is permanently removed:
```typescript
async uninstall(context: PluginContext): Promise<void> {
  console.log(`🗑️ Uninstalling ${this.name}`);

  // Remove data
  await this.clearPluginData();

  // Remove configuration
  await this.removeConfig();

  console.log(`✅ ${this.name} uninstalled`);
}
```

## 🎯 Plugin Development Guide

### 1. Creating a Basic Plugin

#### Generate Plugin Structure
```bash
# Generate a new plugin
npx ai-first g plugin TaskManagement --with-store --with-routes --with-api

# This creates:
# src/plugins/TaskManagement/
# ├── TaskManagementPlugin.ts
# ├── stores/
# ├── components/
# ├── pages/
# ├── services/
# └── __tests__/
```

#### Basic Plugin Implementation
```typescript
// src/plugins/TaskManagement/TaskManagementPlugin.ts
import { Plugin, PluginContext } from '../../core/plugins/types';
import { TaskListPage } from './pages/TaskListPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { useTaskStore } from './stores/taskStore';

export class TaskManagementPlugin implements Plugin {
  name = 'TaskManagement';
  version = '1.0.0';
  description = 'Complete task management system';
  author = 'Your Team';

  private subscriptions: (() => void)[] = [];

  async install(context: PluginContext): Promise<void> {
    console.log('🔌 Installing Task Management plugin');

    // Initialize default configuration
    await this.setupDefaultConfig(context);

    console.log('✅ Task Management plugin installed');
  }

  async activate(context: PluginContext): Promise<void> {
    console.log('🚀 Activating Task Management plugin');

    // Subscribe to relevant events
    this.subscriptions = [
      context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin),
      context.eventBus.subscribe('PROJECT_SELECTED', this.handleProjectSelected),
      context.eventBus.subscribe('TENANT_SWITCHED', this.handleTenantSwitch)
    ];

    // Register routes
    context.registerRoute({
      path: '/tasks',
      component: TaskListPage,
      exact: true
    });

    context.registerRoute({
      path: '/tasks/create',
      component: CreateTaskPage,
      exact: true
    });

    context.registerRoute({
      path: '/tasks/:taskId',
      component: TaskDetailPage,
      exact: true
    });

    // Register navigation items
    context.registerNavItem({
      id: 'tasks',
      label: 'Tasks',
      path: '/tasks',
      icon: 'CheckSquareOutlined',
      order: 3,
      badge: () => {
        const store = useTaskStore.getState();
        return store.pendingTasksCount > 0 ? store.pendingTasksCount : undefined;
      }
    });

    // Register in main menu
    context.eventBus.emit('REGISTER_QUICK_ACTION', {
      id: 'create-task',
      label: 'Create Task',
      icon: 'PlusOutlined',
      action: () => context.router.navigate('/tasks/create')
    });

    console.log('✅ Task Management plugin activated');
  }

  async deactivate(context: PluginContext): Promise<void> {
    console.log('⏹️ Deactivating Task Management plugin');

    // Unsubscribe from events
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];

    // Clear any running timers
    this.clearTimers();

    console.log('✅ Task Management plugin deactivated');
  }

  async uninstall(context: PluginContext): Promise<void> {
    console.log('🗑️ Uninstalling Task Management plugin');

    // Clear plugin data (optional - usually keep for reinstall)
    const shouldClearData = await this.confirmDataClear();
    if (shouldClearData) {
      await this.clearAllTaskData();
    }

    console.log('✅ Task Management plugin uninstalled');
  }

  // Event handlers
  private handleUserLogin = (event: any) => {
    const store = useTaskStore.getState();
    store.loadUserTasks(event.user.id);
  };

  private handleProjectSelected = (event: any) => {
    const store = useTaskStore.getState();
    store.filterTasksByProject(event.projectId);
  };

  private handleTenantSwitch = (event: any) => {
    const store = useTaskStore.getState();
    store.clearTasks();
    store.loadTasksForTenant(event.tenantId);
  };

  // Helper methods
  private async setupDefaultConfig(context: PluginContext): Promise<void> {
    const defaultConfig = {
      tasksPerPage: 25,
      autoRefreshInterval: 30000,
      defaultTaskStatus: 'todo',
      enableNotifications: true
    };

    for (const [key, value] of Object.entries(defaultConfig)) {
      if (!context.getConfig(`taskManagement.${key}`)) {
        context.setConfig(`taskManagement.${key}`, value);
      }
    }
  }

  private clearTimers(): void {
    // Clear any intervals or timeouts
  }

  private async confirmDataClear(): Promise<boolean> {
    // Show confirmation dialog
    return window.confirm('Delete all task data? This cannot be undone.');
  }

  private async clearAllTaskData(): Promise<void> {
    const store = useTaskStore.getState();
    await store.clearAllData();
  }
}
```

### 2. Plugin Store Implementation

```typescript
// src/plugins/TaskManagement/stores/taskStore.ts
import { create } from 'zustand';
import { createRequestLifecycleMethods } from '../../../core/stores/base/requestLifecycle';
import { TaskAPIService } from '../services/taskService';
import { eventBus } from '../../../core/EventBus';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  projectId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  search?: string;
}

interface TaskState {
  // Data
  tasks: Task[];
  currentTask: Task | null;
  filters: TaskFilters;

  // UI State
  selectedTaskIds: string[];
  isCreating: boolean;
  isUpdating: boolean;

  // Computed
  filteredTasks: Task[];
  pendingTasksCount: number;

  // Actions
  loadTasks: () => Promise<void>;
  loadTask: (id: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Bulk actions
  bulkUpdateStatus: (taskIds: string[], status: Task['status']) => Promise<void>;
  bulkDelete: (taskIds: string[]) => Promise<void>;

  // Filters
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;

  // Selection
  selectTask: (id: string) => void;
  selectMultipleTasks: (ids: string[]) => void;
  clearSelection: () => void;

  // Utility
  clearTasks: () => void;
  loadUserTasks: (userId: string) => Promise<void>;
  filterTasksByProject: (projectId: string) => void;
  loadTasksForTenant: (tenantId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => {
  const taskAPI = new TaskAPIService();

  // Add request lifecycle methods
  const requestMethods = createRequestLifecycleMethods(set);

  return {
    // Initial state
    tasks: [],
    currentTask: null,
    filters: {},
    selectedTaskIds: [],
    isCreating: false,
    isUpdating: false,

    // Computed properties
    get filteredTasks() {
      const { tasks, filters } = get();
      return tasks.filter(task => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
        if (filters.projectId && task.projectId !== filters.projectId) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return task.title.toLowerCase().includes(search) ||
                 task.description.toLowerCase().includes(search);
        }
        return true;
      });
    },

    get pendingTasksCount() {
      const { tasks } = get();
      return tasks.filter(task => task.status !== 'done').length;
    },

    // Actions
    loadTasks: async () => {
      try {
        requestMethods.setLoading(true);
        const tasks = await taskAPI.getTasks();
        set({ tasks });

        eventBus.emit('TASKS_LOADED', { count: tasks.length });
      } catch (error) {
        requestMethods.setError(error.message);
        eventBus.emit('TASKS_LOAD_FAILED', { error });
      } finally {
        requestMethods.setLoading(false);
      }
    },

    loadTask: async (id: string) => {
      try {
        requestMethods.setLoading(true);
        const task = await taskAPI.getTask(id);
        set({ currentTask: task });

        eventBus.emit('TASK_LOADED', { task });
      } catch (error) {
        requestMethods.setError(error.message);
      } finally {
        requestMethods.setLoading(false);
      }
    },

    createTask: async (taskData) => {
      try {
        set({ isCreating: true });
        const newTask = await taskAPI.createTask(taskData);

        set(state => ({
          tasks: [...state.tasks, newTask],
          isCreating: false
        }));

        eventBus.emit('TASK_CREATED', { task: newTask });
      } catch (error) {
        set({ isCreating: false });
        requestMethods.setError(error.message);
        eventBus.emit('TASK_CREATE_FAILED', { error });
        throw error;
      }
    },

    updateTask: async (id, updates) => {
      try {
        set({ isUpdating: true });
        const updatedTask = await taskAPI.updateTask(id, updates);

        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? updatedTask : task
          ),
          currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
          isUpdating: false
        }));

        eventBus.emit('TASK_UPDATED', { task: updatedTask, changes: updates });
      } catch (error) {
        set({ isUpdating: false });
        requestMethods.setError(error.message);
        eventBus.emit('TASK_UPDATE_FAILED', { taskId: id, error });
        throw error;
      }
    },

    deleteTask: async (id) => {
      try {
        await taskAPI.deleteTask(id);

        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id),
          currentTask: state.currentTask?.id === id ? null : state.currentTask,
          selectedTaskIds: state.selectedTaskIds.filter(taskId => taskId !== id)
        }));

        eventBus.emit('TASK_DELETED', { taskId: id });
      } catch (error) {
        requestMethods.setError(error.message);
        eventBus.emit('TASK_DELETE_FAILED', { taskId: id, error });
        throw error;
      }
    },

    bulkUpdateStatus: async (taskIds, status) => {
      try {
        await taskAPI.bulkUpdateTasks(taskIds, { status });

        set(state => ({
          tasks: state.tasks.map(task =>
            taskIds.includes(task.id) ? { ...task, status } : task
          )
        }));

        eventBus.emit('TASKS_BULK_UPDATED', { taskIds, updates: { status } });
      } catch (error) {
        requestMethods.setError(error.message);
        throw error;
      }
    },

    bulkDelete: async (taskIds) => {
      try {
        await taskAPI.bulkDeleteTasks(taskIds);

        set(state => ({
          tasks: state.tasks.filter(task => !taskIds.includes(task.id)),
          selectedTaskIds: []
        }));

        eventBus.emit('TASKS_BULK_DELETED', { taskIds });
      } catch (error) {
        requestMethods.setError(error.message);
        throw error;
      }
    },

    // Filter methods
    setFilters: (newFilters) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters }
      }));
    },

    clearFilters: () => {
      set({ filters: {} });
    },

    // Selection methods
    selectTask: (id) => {
      set(state => ({
        selectedTaskIds: state.selectedTaskIds.includes(id)
          ? state.selectedTaskIds.filter(taskId => taskId !== id)
          : [...state.selectedTaskIds, id]
      }));
    },

    selectMultipleTasks: (ids) => {
      set({ selectedTaskIds: ids });
    },

    clearSelection: () => {
      set({ selectedTaskIds: [] });
    },

    // Utility methods
    clearTasks: () => {
      set({ tasks: [], currentTask: null, selectedTaskIds: [] });
    },

    loadUserTasks: async (userId) => {
      const { setFilters, loadTasks } = get();
      setFilters({ assigneeId: userId });
      await loadTasks();
    },

    filterTasksByProject: (projectId) => {
      const { setFilters } = get();
      setFilters({ projectId });
    },

    loadTasksForTenant: async (tenantId) => {
      // Switch tenant context and reload tasks
      await taskAPI.setTenantContext(tenantId);
      const { loadTasks } = get();
      await loadTasks();
    },

    clearAllData: async () => {
      try {
        await taskAPI.clearAllTasks();
        set({
          tasks: [],
          currentTask: null,
          selectedTaskIds: [],
          filters: {}
        });

        eventBus.emit('ALL_TASKS_CLEARED');
      } catch (error) {
        requestMethods.setError(error.message);
        throw error;
      }
    }
  };
});
```

### 3. Plugin API Service

```typescript
// src/plugins/TaskManagement/services/taskService.ts
import { ApiHelper } from '../../../core/api/apiHelper';

export class TaskAPIService {
  constructor(private apiHelper = new ApiHelper()) {}

  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const response = await this.apiHelper.get('/tasks', { params: filters });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.apiHelper.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await this.apiHelper.post('/tasks', task);
    return response.data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.apiHelper.put(`/tasks/${id}`, updates);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.apiHelper.delete(`/tasks/${id}`);
  }

  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<Task[]> {
    const response = await this.apiHelper.post('/tasks/bulk-update', {
      taskIds,
      updates
    });
    return response.data;
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    await this.apiHelper.post('/tasks/bulk-delete', { taskIds });
  }

  async setTenantContext(tenantId: string): Promise<void> {
    // Set tenant context for API calls
    this.apiHelper.setHeader('X-Tenant-ID', tenantId);
  }

  async clearAllTasks(): Promise<void> {
    await this.apiHelper.delete('/tasks/all');
  }
}
```

## 🎛️ Event Communication

### Event-Driven Plugin Communication

#### Emitting Events
```typescript
// Plugin emits events to communicate state changes
export class TaskManagementPlugin implements Plugin {
  private handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    // Update task status
    await this.taskAPI.updateTask(taskId, { status: newStatus });

    // Emit event for other plugins
    this.context.eventBus.emit('TASK_STATUS_CHANGED', {
      taskId,
      newStatus,
      previousStatus: oldStatus,
      timestamp: new Date()
    });
  };
}
```

#### Subscribing to Events
```typescript
// Plugin listens to events from other plugins
export class NotificationPlugin implements Plugin {
  async activate(context: PluginContext): Promise<void> {
    // Subscribe to task events
    context.eventBus.subscribe('TASK_STATUS_CHANGED', this.handleTaskStatusChanged);
    context.eventBus.subscribe('TASK_CREATED', this.handleTaskCreated);
    context.eventBus.subscribe('TASK_ASSIGNED', this.handleTaskAssigned);
  }

  private handleTaskStatusChanged = (event: any) => {
    if (event.newStatus === 'done') {
      this.showNotification({
        type: 'success',
        message: `Task completed! 🎉`,
        action: {
          label: 'View Task',
          onClick: () => this.navigateToTask(event.taskId)
        }
      });
    }
  };
}
```

### Event Types and Contracts

#### Task Management Events
```typescript
// src/plugins/TaskManagement/events.ts
export const TASK_EVENTS = {
  // CRUD Operations
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',

  // Status Changes
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_UNASSIGNED: 'TASK_UNASSIGNED',

  // Bulk Operations
  TASKS_BULK_UPDATED: 'TASKS_BULK_UPDATED',
  TASKS_BULK_DELETED: 'TASKS_BULK_DELETED',

  // Loading States
  TASKS_LOADING: 'TASKS_LOADING',
  TASKS_LOADED: 'TASKS_LOADED',
  TASKS_LOAD_FAILED: 'TASKS_LOAD_FAILED'
} as const;

// Event payload types
export interface TaskCreatedEvent {
  task: Task;
  createdBy: string;
  timestamp: Date;
}

export interface TaskStatusChangedEvent {
  taskId: string;
  newStatus: Task['status'];
  previousStatus: Task['status'];
  changedBy: string;
  timestamp: Date;
}

export interface TaskAssignedEvent {
  taskId: string;
  assigneeId: string;
  assignedBy: string;
  timestamp: Date;
}
```

## 🔒 Plugin Permissions

### Permission System
```typescript
// src/plugins/TaskManagement/permissions.ts
export const TASK_PERMISSIONS = {
  READ_TASKS: 'tasks:read',
  CREATE_TASKS: 'tasks:create',
  UPDATE_TASKS: 'tasks:update',
  DELETE_TASKS: 'tasks:delete',
  ASSIGN_TASKS: 'tasks:assign',
  BULK_OPERATIONS: 'tasks:bulk'
} as const;

export class TaskManagementPlugin implements Plugin {
  permissions = {
    required: [
      TASK_PERMISSIONS.READ_TASKS
    ],
    optional: [
      TASK_PERMISSIONS.CREATE_TASKS,
      TASK_PERMISSIONS.UPDATE_TASKS,
      TASK_PERMISSIONS.DELETE_TASKS
    ]
  };

  async activate(context: PluginContext): Promise<void> {
    // Check required permissions
    context.checkPermission(TASK_PERMISSIONS.READ_TASKS);

    // Register routes based on permissions
    if (context.hasPermission(TASK_PERMISSIONS.CREATE_TASKS)) {
      context.registerRoute({
        path: '/tasks/create',
        component: CreateTaskPage
      });
    }

    if (context.hasPermission(TASK_PERMISSIONS.UPDATE_TASKS)) {
      context.registerRoute({
        path: '/tasks/:id/edit',
        component: EditTaskPage
      });
    }
  }
}
```

## 🧪 Plugin Testing

### Unit Testing
```typescript
// src/plugins/TaskManagement/__tests__/TaskManagementPlugin.test.ts
import { setupPluginTest, simulateEvent } from '../../../core/plugins/pluginTestHelper';
import { TaskManagementPlugin } from '../TaskManagementPlugin';
import { useTaskStore } from '../stores/taskStore';

describe('TaskManagementPlugin', () => {
  let testEnv: PluginTestEnvironment;

  beforeEach(async () => {
    testEnv = await setupPluginTest(TaskManagementPlugin, {
      autoActivate: true,
      mockAPI: true
    });
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Plugin Lifecycle', () => {
    it('installs and activates successfully', async () => {
      expect(testEnv.plugin.name).toBe('TaskManagement');
      expect(testEnv.plugin.version).toBe('1.0.0');
    });

    it('registers routes correctly', () => {
      const routes = testEnv.context.getRegisteredRoutes();
      expect(routes).toContainEqual(
        expect.objectContaining({ path: '/tasks' })
      );
    });

    it('registers navigation items', () => {
      const navItems = testEnv.context.getRegisteredNavItems();
      expect(navItems).toContainEqual(
        expect.objectContaining({ id: 'tasks' })
      );
    });
  });

  describe('Event Handling', () => {
    it('handles user login event', async () => {
      const mockUser = { id: 'user-1', name: 'John Doe' };

      await simulateEvent(testEnv.eventBus, 'USER_LOGIN', {
        user: mockUser,
        timestamp: new Date()
      });

      // Verify task store was updated
      const store = useTaskStore.getState();
      expect(store.loadUserTasks).toHaveBeenCalledWith(mockUser.id);
    });

    it('handles project selection event', async () => {
      await simulateEvent(testEnv.eventBus, 'PROJECT_SELECTED', {
        projectId: 'project-1'
      });

      const store = useTaskStore.getState();
      expect(store.filters.projectId).toBe('project-1');
    });
  });

  describe('API Integration', () => {
    it('loads tasks on activation', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo' },
        { id: '2', title: 'Task 2', status: 'done' }
      ];

      testEnv.mockAPI.get('/tasks').reply(200, mockTasks);

      const store = useTaskStore.getState();
      await store.loadTasks();

      expect(store.tasks).toEqual(mockTasks);
    });

    it('creates tasks successfully', async () => {
      const newTask = { title: 'New Task', status: 'todo' };
      const createdTask = { id: '3', ...newTask };

      testEnv.mockAPI.post('/tasks', newTask).reply(201, createdTask);

      const store = useTaskStore.getState();
      await store.createTask(newTask);

      expect(store.tasks).toContainEqual(createdTask);
    });
  });
});
```

### Integration Testing
```typescript
// src/plugins/TaskManagement/__tests__/integration.test.ts
describe('Task Management Integration', () => {
  it('integrates with notification plugin', async () => {
    const taskEnv = await setupPluginTest(TaskManagementPlugin);
    const notificationEnv = await setupPluginTest(NotificationPlugin);

    // Create a task
    const store = useTaskStore.getState();
    await store.createTask({
      title: 'Test Task',
      status: 'todo'
    });

    // Verify notification was created
    const notificationStore = useNotificationStore.getState();
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toContain('Task created');
  });

  it('integrates with analytics plugin', async () => {
    const taskEnv = await setupPluginTest(TaskManagementPlugin);
    const analyticsEnv = await setupPluginTest(AnalyticsPlugin);

    // Complete a task
    const store = useTaskStore.getState();
    await store.updateTask('task-1', { status: 'done' });

    // Verify analytics event was tracked
    const analyticsStore = useAnalyticsStore.getState();
    expect(analyticsStore.events).toContainEqual(
      expect.objectContaining({
        name: 'task_completed',
        properties: { taskId: 'task-1' }
      })
    );
  });
});
```

## 📦 Plugin Distribution

### Plugin Packaging
```typescript
// src/plugins/TaskManagement/package.json
{
  "name": "@company/task-management-plugin",
  "version": "1.0.0",
  "description": "Task Management Plugin for AI-First SaaS",
  "main": "TaskManagementPlugin.js",
  "types": "TaskManagementPlugin.d.ts",
  "keywords": ["plugin", "tasks", "project-management"],
  "peerDependencies": {
    "react": "^18.0.0",
    "zustand": "^4.0.0"
  },
  "ai-first": {
    "pluginType": "feature",
    "minimumCoreVersion": "1.0.0",
    "permissions": ["tasks:read", "tasks:write"],
    "dependencies": []
  }
}
```

### Plugin Registry
```typescript
// src/plugins/pluginRegistry.ts
import { Plugin } from '../core/plugins/types';

// Core plugins (always available)
import { UserManagementPlugin } from './UserManagement/UserManagementPlugin';
import { ProjectManagementPlugin } from './ProjectManagement/ProjectManagementPlugin';
import { AnalyticsPlugin } from './Analytics/AnalyticsPlugin';

// Optional plugins
import { TaskManagementPlugin } from './TaskManagement/TaskManagementPlugin';
import { NotificationPlugin } from './Notifications/NotificationPlugin';

export const CORE_PLUGINS: Array<new () => Plugin> = [
  UserManagementPlugin,
  ProjectManagementPlugin,
  AnalyticsPlugin
];

export const AVAILABLE_PLUGINS: Array<new () => Plugin> = [
  ...CORE_PLUGINS,
  TaskManagementPlugin,
  NotificationPlugin
];

// Plugin metadata
export const PLUGIN_METADATA = {
  TaskManagement: {
    category: 'Productivity',
    tags: ['tasks', 'project-management', 'collaboration'],
    screenshots: ['/screenshots/task-list.png', '/screenshots/task-detail.png'],
    documentation: '/docs/plugins/task-management'
  },
  Notifications: {
    category: 'Communication',
    tags: ['notifications', 'alerts', 'messaging'],
    screenshots: ['/screenshots/notifications.png'],
    documentation: '/docs/plugins/notifications'
  }
};
```

## 🔧 Plugin Configuration

### Configuration Schema
```typescript
// src/plugins/TaskManagement/config.ts
export interface TaskManagementConfig {
  // Display settings
  tasksPerPage: number;
  defaultView: 'list' | 'board' | 'calendar';
  showCompletedTasks: boolean;

  // Behavior settings
  autoRefreshInterval: number;
  enableNotifications: boolean;
  defaultTaskStatus: Task['status'];

  // Integration settings
  syncWithCalendar: boolean;
  slackIntegration: boolean;
  emailReminders: boolean;
}

export const defaultConfig: TaskManagementConfig = {
  tasksPerPage: 25,
  defaultView: 'list',
  showCompletedTasks: false,
  autoRefreshInterval: 30000,
  enableNotifications: true,
  defaultTaskStatus: 'todo',
  syncWithCalendar: false,
  slackIntegration: false,
  emailReminders: true
};

export const configSchema = {
  type: 'object',
  properties: {
    tasksPerPage: {
      type: 'number',
      minimum: 10,
      maximum: 100,
      description: 'Number of tasks per page'
    },
    defaultView: {
      type: 'string',
      enum: ['list', 'board', 'calendar'],
      description: 'Default view for task display'
    }
    // ... more schema definitions
  }
};
```

### Configuration UI
```typescript
// src/plugins/TaskManagement/components/ConfigForm.tsx
export const TaskConfigForm: React.FC = () => {
  const { getConfig, setConfig } = usePluginContext();
  const [config, setConfigState] = useState(getConfig('taskManagement'));

  const handleSave = async () => {
    await setConfig('taskManagement', config);
    message.success('Configuration saved');
  };

  return (
    <Form onFinish={handleSave}>
      <Form.Item label="Tasks Per Page">
        <InputNumber
          value={config.tasksPerPage}
          min={10}
          max={100}
          onChange={(value) => setConfigState({
            ...config,
            tasksPerPage: value
          })}
        />
      </Form.Item>

      <Form.Item label="Default View">
        <Radio.Group
          value={config.defaultView}
          onChange={(e) => setConfigState({
            ...config,
            defaultView: e.target.value
          })}
        >
          <Radio value="list">List</Radio>
          <Radio value="board">Board</Radio>
          <Radio value="calendar">Calendar</Radio>
        </Radio.Group>
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Save Configuration
      </Button>
    </Form>
  );
};
```

This plugin system provides a powerful, flexible foundation for building modular SaaS applications. Each plugin is a complete, self-contained feature that can be developed, tested, and deployed independently while maintaining seamless integration with the core framework and other plugins.

Next: **[Core Framework](./core-framework.md)** - Deep dive into core services and utilities