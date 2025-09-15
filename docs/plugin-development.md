# Plugin Development Guide

This comprehensive guide walks you through creating plugins for the AI-First SaaS React Starter. You'll learn everything from basic plugin concepts to advanced patterns and best practices.

## 🎯 Overview

Plugin development in the AI-First SaaS React Starter follows a **structured, convention-based approach** that ensures consistency, maintainability, and scalability. Every plugin is a self-contained module that integrates seamlessly with the core framework.

### What You'll Learn

- **Plugin Architecture** - Understanding the plugin system
- **Plugin Lifecycle** - Install, activate, deactivate, uninstall
- **Code Generation** - Using CLI tools to scaffold plugins
- **Component Development** - Building plugin UI components
- **State Management** - Plugin-specific stores and data flow
- **API Integration** - Connecting plugins to backend services
- **Event Communication** - Inter-plugin communication patterns
- **Testing Strategies** - Unit, integration, and E2E testing
- **Advanced Patterns** - Complex plugin scenarios

## 🔌 Plugin Architecture Recap

### Plugin Structure
```
src/plugins/YourPlugin/
├── YourPlugin.ts               # Main plugin class (entry point)
├── stores/                     # Plugin state management
│   ├── yourStore.ts            # Primary plugin store
│   └── additionalStore.ts      # Additional stores if needed
├── components/                 # Plugin UI components
│   ├── YourComponent.tsx       # Main components
│   ├── subcomponents/          # Sub-components
│   └── common/                 # Shared components
├── pages/                      # Plugin pages/routes
│   ├── YourMainPage.tsx        # Main plugin page
│   └── YourDetailPage.tsx      # Detail/sub pages
├── services/                   # Plugin business logic
│   ├── yourService.ts          # API integration
│   └── businessLogic.ts        # Business rules
├── types/                      # Plugin TypeScript types
│   ├── your.types.ts           # Main type definitions
│   └── events.types.ts         # Event type definitions
├── hooks/                      # Plugin-specific hooks
│   └── useYourHook.ts          # Custom React hooks
├── utils/                      # Plugin utilities
│   └── helpers.ts              # Helper functions
├── styles/                     # Plugin-specific styles
│   └── yourStyles.module.css   # CSS modules
├── __tests__/                  # Plugin tests
│   ├── YourPlugin.test.ts      # Plugin lifecycle tests
│   ├── stores/                 # Store tests
│   ├── components/             # Component tests
│   └── services/               # Service tests
└── README.md                   # Plugin documentation
```

## 🚀 Getting Started

### Step 1: Generate Plugin Scaffold

Use the CLI to generate a complete plugin structure:

```bash
# Basic plugin
npx ai-first g plugin TaskManagement

# Plugin with store and routes
npx ai-first g plugin TaskManagement --with-store --with-routes

# Full-featured plugin
npx ai-first g plugin TaskManagement --with-store --with-routes --with-tests --with-api
```

### Step 2: Understanding the Generated Files

#### Main Plugin Class
```typescript
// src/plugins/TaskManagement/TaskManagementPlugin.ts
import { Plugin, PluginContext } from '../../core/plugins/types';
import { eventBus } from '../../core/events/EventBus';
import { TaskListPage } from './pages/TaskListPage';
import { TaskDetailPage } from './pages/TaskDetailPage';

export class TaskManagementPlugin implements Plugin {
  name = 'TaskManagement';
  version = '1.0.0';
  description = 'Complete task management functionality';
  dependencies = ['UserManagement']; // Optional dependencies

  /**
   * Install hook - One-time setup
   */
  async install(context: PluginContext): Promise<void> {
    console.log('🔧 Installing TaskManagement plugin');

    // One-time setup tasks:
    // - Database schema creation
    // - Initial configuration
    // - Permission setup
    // - Asset preparation
  }

  /**
   * Activate hook - Enable plugin functionality
   */
  async activate(context: PluginContext): Promise<void> {
    console.log('✅ Activating TaskManagement plugin');

    // Register routes
    context.registerRoute('/tasks', TaskListPage);
    context.registerRoute('/tasks/:id', TaskDetailPage);
    context.registerRoute('/tasks/create', TaskCreatePage);

    // Register navigation items
    context.registerNavItem({
      key: 'tasks',
      path: '/tasks',
      label: 'Tasks',
      icon: 'CheckSquareOutlined',
      order: 3,
      permissions: ['tasks.view']
    });

    // Subscribe to events
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.subscribe('USER_LOGOUT', this.handleUserLogout);
    context.eventBus.subscribe('PROJECT_SELECTED', this.handleProjectSelected);

    // Initialize plugin state
    await this.initializePluginState(context);

    // Register with other plugins
    context.eventBus.emit('PLUGIN_READY', {
      pluginName: this.name,
      capabilities: ['task-creation', 'task-assignment', 'task-tracking']
    });
  }

  /**
   * Deactivate hook - Disable plugin functionality
   */
  async deactivate(context: PluginContext): Promise<void> {
    console.log('❌ Deactivating TaskManagement plugin');

    // Unsubscribe from events
    context.eventBus.unsubscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.unsubscribe('USER_LOGOUT', this.handleUserLogout);
    context.eventBus.unsubscribe('PROJECT_SELECTED', this.handleProjectSelected);

    // Clean up timers, intervals, subscriptions
    this.cleanup();

    // Notify other plugins
    context.eventBus.emit('PLUGIN_DEACTIVATED', {
      pluginName: this.name
    });
  }

  /**
   * Uninstall hook - Complete removal
   */
  async uninstall(context: PluginContext): Promise<void> {
    console.log('🗑️ Uninstalling TaskManagement plugin');

    // Remove persistent data (with user confirmation)
    // Remove configuration
    // Clean up external resources
  }

  /**
   * Event handlers
   */
  private handleUserLogin = (event: UserLoginEvent) => {
    // Load user's tasks when they log in
    const taskStore = useTaskStore.getState();
    taskStore.loadUserTasks(event.user.id);

    // Update user activity
    this.trackUserActivity('login', event.user.id);
  };

  private handleUserLogout = () => {
    // Clear task data on logout
    const taskStore = useTaskStore.getState();
    taskStore.clearTasks();
  };

  private handleProjectSelected = (event: ProjectSelectedEvent) => {
    // Load project-specific tasks
    const taskStore = useTaskStore.getState();
    taskStore.loadProjectTasks(event.projectId);
  };

  /**
   * Private helper methods
   */
  private async initializePluginState(context: PluginContext): Promise<void> {
    // Initialize default configuration
    const config = await context.getConfig('taskManagement') || {
      defaultView: 'list',
      autoSave: true,
      notifications: true
    };

    await context.setConfig('taskManagement', config);
  }

  private cleanup(): void {
    // Clean up any running timers, subscriptions, etc.
  }

  private trackUserActivity(action: string, userId: string): void {
    eventBus.emit('USER_ACTIVITY', {
      action,
      userId,
      plugin: this.name,
      timestamp: new Date()
    });
  }
}
```

### Step 3: Plugin Store Development

#### Task Store Example
```typescript
// src/plugins/TaskManagement/stores/taskStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createRequestLifecycleMethods } from '../../../core/stores/base/requestLifecycle';
import { taskService } from '../services/taskService';
import { eventBus } from '../../../core/events/EventBus';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../types/task.types';

interface TaskState {
  // Data state
  tasks: Task[];
  selectedTask: Task | null;
  filters: TaskFilters;

  // UI state
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;

  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;

  // Actions
  loadTasks: (filters?: TaskFilters) => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  createTask: (task: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  selectTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearTasks: () => void;
  reloadTasks: () => Promise<void>;

  // Request lifecycle methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      tasks: [],
      selectedTask: null,
      filters: {
        status: undefined,
        assignee: undefined,
        project: undefined,
        priority: undefined,
        search: ''
      },
      loading: false,
      error: null,
      lastFetch: null,
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: false,

      // Actions
      loadTasks: async (filters?: TaskFilters) => {
        const state = get();
        set({ loading: true, error: null, page: 1 });

        try {
          const finalFilters = { ...state.filters, ...filters };
          const response = await taskService.getTasks({
            ...finalFilters,
            page: 1,
            pageSize: state.pageSize
          });

          set({
            tasks: response.items,
            totalCount: response.total,
            hasMore: response.items.length === state.pageSize,
            loading: false,
            lastFetch: new Date(),
            filters: finalFilters
          });

          // Emit event for other plugins
          eventBus.emit('TASKS_LOADED', {
            count: response.items.length,
            filters: finalFilters
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          eventBus.emit('TASK_LOAD_FAILED', { error: error.message });
        }
      },

      loadMoreTasks: async () => {
        const state = get();
        if (state.loading || !state.hasMore) return;

        set({ loading: true });

        try {
          const response = await taskService.getTasks({
            ...state.filters,
            page: state.page + 1,
            pageSize: state.pageSize
          });

          set({
            tasks: [...state.tasks, ...response.items],
            page: state.page + 1,
            hasMore: response.items.length === state.pageSize,
            loading: false
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      createTask: async (taskData: CreateTaskRequest) => {
        set({ loading: true, error: null });

        try {
          const newTask = await taskService.createTask(taskData);

          set(state => ({
            tasks: [newTask, ...state.tasks],
            totalCount: state.totalCount + 1,
            loading: false
          }));

          // Emit event for other plugins
          eventBus.emit('TASK_CREATED', {
            task: newTask,
            creator: taskData.createdBy
          });

          return newTask;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateTask: async (id: string, updates: UpdateTaskRequest) => {
        set({ loading: true, error: null });

        try {
          const updatedTask = await taskService.updateTask(id, updates);

          set(state => ({
            tasks: state.tasks.map(task =>
              task.id === id ? updatedTask : task
            ),
            selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
            loading: false
          }));

          // Emit event for other plugins
          eventBus.emit('TASK_UPDATED', {
            task: updatedTask,
            changes: updates
          });

          return updatedTask;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteTask: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await taskService.deleteTask(id);

          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id),
            selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
            totalCount: Math.max(0, state.totalCount - 1),
            loading: false
          }));

          // Emit event for other plugins
          eventBus.emit('TASK_DELETED', { taskId: id });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      selectTask: (task: Task | null) => {
        set({ selectedTask: task });

        if (task) {
          eventBus.emit('TASK_SELECTED', { task });
        }
      },

      setFilters: (newFilters: Partial<TaskFilters>) => {
        const state = get();
        const updatedFilters = { ...state.filters, ...newFilters };
        set({ filters: updatedFilters });

        // Automatically reload with new filters
        state.loadTasks(updatedFilters);
      },

      clearTasks: () => {
        set({
          tasks: [],
          selectedTask: null,
          totalCount: 0,
          page: 1,
          hasMore: false,
          error: null,
          lastFetch: null
        });
      },

      reloadTasks: async () => {
        const state = get();
        await state.loadTasks(state.filters);
      },

      // Request lifecycle methods
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null })
    })),
    {
      name: 'task-store', // For Redux DevTools
      partialize: (state) => ({
        // Only persist certain parts of the state
        filters: state.filters,
        pageSize: state.pageSize
      })
    }
  )
);

// Subscribe to auth events to clear store on logout
useTaskStore.subscribe(
  (state) => state,
  () => {
    eventBus.subscribe('USER_LOGOUT', () => {
      useTaskStore.getState().clearTasks();
    });
  }
);
```

### Step 4: Component Development

#### Main Task List Component
```typescript
// src/plugins/TaskManagement/components/TaskList.tsx
import React, { useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Tooltip,
  Space,
  Dropdown,
  Menu,
  Modal
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../../../core/auth/AuthStore';
import { TaskForm } from './TaskForm';
import { TaskFilters } from './TaskFilters';
import { Task, TaskStatus, TaskPriority } from '../types/task.types';
import styles from './TaskList.module.css';

const { Search } = Input;
const { Option } = Select;

export const TaskList: React.FC = () => {
  const {
    tasks,
    loading,
    error,
    filters,
    totalCount,
    loadTasks,
    loadMoreTasks,
    updateTask,
    deleteTask,
    setFilters,
    selectTask
  } = useTaskStore();

  const { user } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle task status change
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
    } catch (error) {
      Modal.error({
        title: 'Failed to update task',
        content: error.message
      });
    }
  };

  // Handle task priority change
  const handlePriorityChange = async (taskId: string, priority: TaskPriority) => {
    try {
      await updateTask(taskId, { priority });
    } catch (error) {
      Modal.error({
        title: 'Failed to update task',
        content: error.message
      });
    }
  };

  // Handle task deletion
  const handleDelete = (task: Task) => {
    Modal.confirm({
      title: 'Delete Task',
      content: `Are you sure you want to delete "${task.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteTask(task.id);
        } catch (error) {
          Modal.error({
            title: 'Failed to delete task',
            content: error.message
          });
        }
      }
    });
  };

  // Table columns
  const columns = useMemo(() => [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Task) => (
        <div className={styles.taskCell}>
          <div className={styles.taskTitle}>{title}</div>
          {record.description && (
            <div className={styles.taskDescription}>{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TaskStatus, record: Task) => (
        <Select
          value={status}
          size="small"
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="todo">
            <Tag color="default">To Do</Tag>
          </Option>
          <Option value="in_progress">
            <Tag color="blue">In Progress</Tag>
          </Option>
          <Option value="review">
            <Tag color="orange">Review</Tag>
          </Option>
          <Option value="done">
            <Tag color="green">Done</Tag>
          </Option>
        </Select>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: TaskPriority, record: Task) => (
        <Select
          value={priority}
          size="small"
          style={{ width: '100%' }}
          onChange={(value) => handlePriorityChange(record.id, value)}
        >
          <Option value="low">
            <Tag color="green">Low</Tag>
          </Option>
          <Option value="medium">
            <Tag color="yellow">Medium</Tag>
          </Option>
          <Option value="high">
            <Tag color="orange">High</Tag>
          </Option>
          <Option value="critical">
            <Tag color="red">Critical</Tag>
          </Option>
        </Select>
      )
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assignee: any) => (
        assignee ? (
          <div className={styles.assigneeCell}>
            <Avatar size="small" src={assignee.avatar} />
            <span className={styles.assigneeName}>{assignee.name}</span>
          </div>
        ) : (
          <span className={styles.unassigned}>Unassigned</span>
        )
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (dueDate: string) => (
        dueDate ? (
          <span className={styles.dueDate}>
            {new Date(dueDate).toLocaleDateString()}
          </span>
        ) : (
          '-'
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record: Task) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="edit" onClick={() => selectTask(record)}>
                Edit
              </Menu.Item>
              <Menu.Item key="duplicate">
                Duplicate
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                key="delete"
                danger
                onClick={() => handleDelete(record)}
              >
                Delete
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
          />
        </Dropdown>
      )
    }
  ], [updateTask, deleteTask, selectTask]);

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error loading tasks</h3>
        <p>{error}</p>
        <Button onClick={() => loadTasks()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.taskList}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h2>Tasks</h2>
          <span className={styles.count}>({totalCount})</span>
        </div>

        <Space>
          <Search
            placeholder="Search tasks..."
            allowClear
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            style={{ width: 200 }}
          />

          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          <Button icon={<ExportOutlined />}>
            Export
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Task
          </Button>
        </Space>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          total: totalCount,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} tasks`
        }}
        scroll={{ x: 1000 }}
        className={styles.table}
      />

      {/* Create Task Modal */}
      <Modal
        title="Create New Task"
        open={showCreateForm}
        footer={null}
        onCancel={() => setShowCreateForm(false)}
        width={600}
      >
        <TaskForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </div>
  );
};
```

### Step 5: Service Layer Development

#### Task Service
```typescript
// src/plugins/TaskManagement/services/taskService.ts
import { apiHelper } from '../../../core/api/ApiHelper';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  PaginatedTaskResponse
} from '../types/task.types';

export class TaskService {
  private readonly baseUrl = '/api/tasks';

  /**
   * Get tasks with filtering and pagination
   */
  async getTasks(params: TaskFilters & {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedTaskResponse> {
    const queryParams = this.buildQueryParams(params);
    return apiHelper.get<PaginatedTaskResponse>(
      `${this.baseUrl}?${queryParams}`
    );
  }

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<Task> {
    return apiHelper.get<Task>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new task
   */
  async createTask(task: CreateTaskRequest): Promise<Task> {
    const newTask = await apiHelper.post<Task>(this.baseUrl, task);

    // Cache the new task for quick access
    this.cacheTask(newTask);

    return newTask;
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    const updatedTask = await apiHelper.put<Task>(
      `${this.baseUrl}/${id}`,
      updates
    );

    // Update cache
    this.cacheTask(updatedTask);

    return updatedTask;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    await apiHelper.delete(`${this.baseUrl}/${id}`);

    // Remove from cache
    this.removeCachedTask(id);
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    return apiHelper.put<Task>(`${this.baseUrl}/${taskId}/assign`, {
      assigneeId
    });
  }

  /**
   * Add comment to task
   */
  async addComment(taskId: string, comment: string): Promise<void> {
    return apiHelper.post(`${this.baseUrl}/${taskId}/comments`, {
      comment
    });
  }

  /**
   * Upload attachment to task
   */
  async uploadAttachment(
    taskId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; name: string }> {
    return apiHelper.uploadFile(
      `${this.baseUrl}/${taskId}/attachments`,
      file,
      onProgress
    );
  }

  /**
   * Get task statistics
   */
  async getTaskStats(filters?: Partial<TaskFilters>): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  }> {
    const queryParams = this.buildQueryParams(filters || {});
    return apiHelper.get(`${this.baseUrl}/stats?${queryParams}`);
  }

  /**
   * Private helper methods
   */
  private buildQueryParams(params: any): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  private cacheTask(task: Task): void {
    // Simple in-memory cache for recently accessed tasks
    const cache = this.getTaskCache();
    cache.set(task.id, {
      task,
      cachedAt: Date.now()
    });
  }

  private removeCachedTask(id: string): void {
    const cache = this.getTaskCache();
    cache.delete(id);
  }

  private getTaskCache(): Map<string, { task: Task; cachedAt: number }> {
    if (!window.taskCache) {
      window.taskCache = new Map();
    }
    return window.taskCache;
  }
}

// Export singleton instance
export const taskService = new TaskService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    taskCache?: Map<string, { task: Task; cachedAt: number }>;
  }
}
```

## 🧪 Testing Your Plugin

### Plugin Lifecycle Tests
```typescript
// src/plugins/TaskManagement/__tests__/TaskManagementPlugin.test.ts
import { setupPluginTest, simulateEvent } from '../../../core/plugins/pluginTestHelper';
import { TaskManagementPlugin } from '../TaskManagementPlugin';
import { useTaskStore } from '../stores/taskStore';

describe('TaskManagementPlugin', () => {
  let testEnv: any;

  beforeEach(async () => {
    testEnv = await setupPluginTest(TaskManagementPlugin);
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Plugin Lifecycle', () => {
    it('should activate successfully', async () => {
      const { plugin, context } = testEnv;

      await plugin.activate(context);

      // Check routes are registered
      expect(context.routes).toContain('/tasks');
      expect(context.routes).toContain('/tasks/:id');

      // Check navigation item is registered
      expect(context.navItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: '/tasks',
            label: 'Tasks'
          })
        ])
      );
    });

    it('should handle user login events', async () => {
      const { plugin, eventBus } = testEnv;
      const taskStore = useTaskStore.getState();
      const loadTasksSpy = jest.spyOn(taskStore, 'loadUserTasks');

      await simulateEvent(eventBus, 'USER_LOGIN', {
        user: { id: '123', name: 'John Doe' }
      });

      expect(loadTasksSpy).toHaveBeenCalledWith('123');
    });

    it('should clean up on deactivation', async () => {
      const { plugin, context, eventBus } = testEnv;

      await plugin.activate(context);
      await plugin.deactivate(context);

      // Verify event unsubscription
      const taskStore = useTaskStore.getState();
      const loadTasksSpy = jest.spyOn(taskStore, 'loadUserTasks');

      await simulateEvent(eventBus, 'USER_LOGIN', {
        user: { id: '123', name: 'John Doe' }
      });

      expect(loadTasksSpy).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should load project tasks when project is selected', async () => {
      const { eventBus } = testEnv;
      const taskStore = useTaskStore.getState();
      const loadProjectTasksSpy = jest.spyOn(taskStore, 'loadProjectTasks');

      await simulateEvent(eventBus, 'PROJECT_SELECTED', {
        projectId: 'project-123'
      });

      expect(loadProjectTasksSpy).toHaveBeenCalledWith('project-123');
    });
  });
});
```

### Store Tests
```typescript
// src/plugins/TaskManagement/__tests__/stores/taskStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useTaskStore } from '../../stores/taskStore';
import { taskService } from '../../services/taskService';
import { mockTasks } from '../fixtures/mockData';

// Mock the service
jest.mock('../../services/taskService');
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('useTaskStore', () => {
  beforeEach(() => {
    // Reset store state
    useTaskStore.getState().clearTasks();
    jest.clearAllMocks();
  });

  describe('loadTasks', () => {
    it('should load tasks successfully', async () => {
      const mockResponse = {
        items: mockTasks,
        total: mockTasks.length
      };

      mockTaskService.getTasks.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.loadTasks();
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.totalCount).toBe(mockTasks.length);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load tasks';
      mockTaskService.getTasks.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.loadTasks();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('createTask', () => {
    it('should create task and update store', async () => {
      const newTask = mockTasks[0];
      const createTaskRequest = {
        title: newTask.title,
        description: newTask.description
      };

      mockTaskService.createTask.mockResolvedValue(newTask);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.createTask(createTaskRequest);
      });

      expect(result.current.tasks).toContain(newTask);
      expect(result.current.totalCount).toBe(1);
    });
  });

  describe('filters', () => {
    it('should apply filters and reload tasks', async () => {
      const mockResponse = {
        items: [mockTasks[0]], // Filtered result
        total: 1
      };

      mockTaskService.getTasks.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        result.current.setFilters({ status: 'in_progress' });
      });

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress'
        })
      );
      expect(result.current.filters.status).toBe('in_progress');
    });
  });
});
```

## 🎨 Advanced Plugin Patterns

### 1. Plugin Dependencies
```typescript
// Plugin with dependencies
export class AdvancedReportingPlugin implements Plugin {
  name = 'AdvancedReporting';
  version = '1.0.0';
  dependencies = ['TaskManagement', 'ProjectManagement', 'Analytics'];

  async activate(context: PluginContext): Promise<void> {
    // Verify dependencies are active
    const dependencyCheck = await this.checkDependencies(context);
    if (!dependencyCheck.allSatisfied) {
      throw new Error(`Missing dependencies: ${dependencyCheck.missing.join(', ')}`);
    }

    // Plugin activation logic
  }

  private async checkDependencies(context: PluginContext) {
    // Implementation to check if required plugins are active
  }
}
```

### 2. Plugin Extensions
```typescript
// Plugin that extends another plugin
export class TaskTimeTrackingPlugin implements Plugin {
  name = 'TaskTimeTracking';
  version = '1.0.0';
  dependencies = ['TaskManagement'];

  async activate(context: PluginContext): Promise<void> {
    // Extend TaskManagement with time tracking
    context.eventBus.subscribe('TASK_CREATED', this.addTimeTrackingToTask);
    context.eventBus.subscribe('TASK_UPDATED', this.updateTimeTracking);

    // Register additional components
    context.registerComponent('TaskTimeTracker', TaskTimeTracker);
  }

  private addTimeTrackingToTask = (event: TaskCreatedEvent) => {
    // Add time tracking capabilities to new tasks
  };
}
```

### 3. Multi-Store Plugins
```typescript
// Plugin with multiple stores
export class ProjectManagementPlugin implements Plugin {
  name = 'ProjectManagement';

  async activate(context: PluginContext): Promise<void> {
    // Register multiple stores
    context.registerStore('projects', useProjectStore);
    context.registerStore('milestones', useMilestoneStore);
    context.registerStore('projectSettings', useProjectSettingsStore);
  }
}
```

## 📦 Plugin Distribution

### Building Plugin Packages
```typescript
// plugin.config.ts - Plugin configuration for distribution
export const pluginConfig = {
  name: 'TaskManagement',
  version: '1.0.0',
  main: './TaskManagementPlugin.ts',
  dependencies: {
    framework: '^2.0.0',
    plugins: ['UserManagement@^1.0.0']
  },
  permissions: [
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.delete'
  ],
  assets: ['./assets/'],
  styles: ['./styles/'],
  build: {
    entry: './index.ts',
    external: ['react', 'antd', '@ai-first/core']
  }
};
```

## 🔧 Plugin CLI Commands

### Available Commands
```bash
# Create new plugin
npx ai-first g plugin MyPlugin [options]

# Generate plugin component
npx ai-first g plugin-component MyComponent --plugin=MyPlugin

# Generate plugin store
npx ai-first g plugin-store MyStore --plugin=MyPlugin

# Generate plugin service
npx ai-first g plugin-service MyService --plugin=MyPlugin

# Test plugin
npx ai-first test plugin MyPlugin

# Build plugin for distribution
npx ai-first build plugin MyPlugin

# Publish plugin
npx ai-first publish plugin MyPlugin
```

## 📚 Best Practices

### 1. Plugin Design Principles
- **Single Responsibility** - Each plugin should have one clear purpose
- **Loose Coupling** - Plugins should not directly depend on each other
- **Event-Driven** - Use events for communication, not direct calls
- **Stateless** - Keep plugin logic stateless where possible

### 2. Performance Considerations
- **Lazy Loading** - Load plugin components only when needed
- **Efficient State Updates** - Use selectors to prevent unnecessary re-renders
- **Memory Management** - Clean up subscriptions and timers on deactivation

### 3. Security Guidelines
- **Permission Checks** - Always verify user permissions
- **Input Validation** - Validate all user inputs
- **XSS Prevention** - Sanitize user-generated content
- **CSRF Protection** - Use tokens for state-changing operations

---

## 🚀 Next Steps

You're now ready to build powerful plugins! Continue with:

1. **[Plugin Examples](./plugin-examples.md)** - See real-world plugin implementations
2. **[State Management](./state-management.md)** - Advanced store patterns
3. **[Event Bus](./event-bus.md)** - Master event-driven communication
4. **[Testing](./testing.md)** - Comprehensive testing strategies

**Happy plugin development!** 🔌✨