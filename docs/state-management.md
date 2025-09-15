# State Management Documentation

This comprehensive guide covers state management in the AI-First SaaS React Starter, focusing on Zustand patterns, plugin-specific stores, and best practices for scalable state architecture.

## 🏗️ Overview

The framework uses **Zustand** as the primary state management solution, providing a lightweight, performant, and TypeScript-friendly approach to managing application state.

### Key Concepts

- **Core Stores** - Framework-level state (auth, UI, navigation)
- **Plugin Stores** - Plugin-specific state management
- **Store Patterns** - Reusable patterns for common scenarios
- **Event Integration** - State changes trigger events
- **Performance Optimization** - Selectors and subscription management

### State Architecture

```
State Management Architecture
├── 🏗️ Core Stores                 # Framework-level state
│   ├── AuthStore                   # Authentication state
│   ├── UIStore                     # UI preferences & state
│   ├── NavigationStore             # Navigation state
│   └── AppStore                    # Global app state
├── 🔌 Plugin Stores               # Plugin-specific state
│   ├── UserStore                   # User management state
│   ├── TaskStore                   # Task management state
│   ├── ProjectStore                # Project management state
│   └── Custom Plugin Stores        # Your plugin stores
├── 🎯 Store Patterns              # Reusable patterns
│   ├── Request Lifecycle           # Async request handling
│   ├── Pagination                  # Paginated data
│   ├── Caching                     # Data caching strategies
│   └── Real-time Updates           # WebSocket integration
└── 🔗 Event Integration            # State-event communication
    ├── Store Events                # State change events
    ├── Cross-Store Communication   # Store-to-store communication
    └── Plugin Integration          # Plugin event handling
```

## 🎯 Core Store Patterns

### Request Lifecycle Pattern

The most common pattern for handling async operations:

```typescript
// src/core/stores/base/requestLifecycle.ts
export interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  retryCount: number;
}

export interface RequestActions<T> {
  fetchData: () => Promise<void>;
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  retry: () => Promise<void>;
  reset: () => void;
}

export const createRequestLifecycleMethods = <T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  const { maxRetries = 3, retryDelay = 1000, onSuccess, onError } = options;

  return {
    async fetchData(set: any, get: any): Promise<void> {
      const state = get();
      set({ loading: true, error: null });

      try {
        const data = await apiCall();

        set({
          data,
          loading: false,
          lastFetch: new Date(),
          retryCount: 0
        });

        onSuccess?.(data);
      } catch (error) {
        const newRetryCount = state.retryCount + 1;

        set({
          error: error.message,
          loading: false,
          retryCount: newRetryCount
        });

        onError?.(error);
      }
    },

    async retry(set: any, get: any): Promise<void> {
      const state = get();

      if (state.retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await this.fetchData(set, get);
      } else {
        set({ error: 'Maximum retry attempts reached' });
      }
    },

    setData(data: T, set: any): void {
      set({ data, error: null });
    },

    setLoading(loading: boolean, set: any): void {
      set({ loading });
    },

    setError(error: string | null, set: any): void {
      set({ error });
    },

    reset(set: any): void {
      set({
        data: null,
        loading: false,
        error: null,
        lastFetch: null,
        retryCount: 0
      });
    }
  };
};
```

### Pagination Pattern

For handling paginated data:

```typescript
// src/core/stores/base/pagination.ts
export interface PaginationState<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  filters: Record<string, any>;
}

export interface PaginationActions<T> {
  loadPage: (page: number) => Promise<void>;
  loadMore: () => Promise<void>;
  setPageSize: (size: number) => void;
  setFilters: (filters: Record<string, any>) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

export const createPaginationMethods = <T extends { id: string }>(
  apiCall: (params: {
    page: number;
    pageSize: number;
    filters: Record<string, any>;
  }) => Promise<{ items: T[]; total: number }>
) => ({
  async loadPage(page: number, set: any, get: any): Promise<void> {
    const state = get();
    set({ loading: true, error: null });

    try {
      const response = await apiCall({
        page,
        pageSize: state.pageSize,
        filters: state.filters
      });

      const newItems = page === 1
        ? response.items
        : [...state.items, ...response.items];

      set({
        items: newItems,
        totalCount: response.total,
        page,
        hasMore: response.items.length === state.pageSize,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  async loadMore(set: any, get: any): Promise<void> {
    const state = get();
    if (state.hasMore && !state.loading) {
      await this.loadPage(state.page + 1, set, get);
    }
  },

  setPageSize(size: number, set: any, get: any): void {
    set({ pageSize: size, page: 1 });
    this.loadPage(1, set, get);
  },

  setFilters(filters: Record<string, any>, set: any, get: any): void {
    set({ filters, page: 1 });
    this.loadPage(1, set, get);
  },

  addItem(item: T, set: any, get: any): void {
    const state = get();
    set({
      items: [item, ...state.items],
      totalCount: state.totalCount + 1
    });
  },

  updateItem(id: string, updates: Partial<T>, set: any, get: any): void {
    const state = get();
    set({
      items: state.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    });
  },

  removeItem(id: string, set: any, get: any): void {
    const state = get();
    set({
      items: state.items.filter(item => item.id !== id),
      totalCount: Math.max(0, state.totalCount - 1)
    });
  },

  reset(set: any): void {
    set({
      items: [],
      totalCount: 0,
      page: 1,
      hasMore: false,
      loading: false,
      error: null
    });
  }
});
```

## 🔐 Core Store Examples

### AuthStore - Authentication State

```typescript
// src/core/auth/AuthStore.ts
interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;

  // Loading states
  loginLoading: boolean;
  logoutLoading: boolean;
  refreshLoading: boolean;

  // Error states
  loginError: string | null;
  refreshError: string | null;

  // Session management
  lastActivity: Date | null;
  sessionTimeout: number;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  updateLastActivity: () => void;
  clearErrors: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      token: null,
      loginLoading: false,
      logoutLoading: false,
      refreshLoading: false,
      loginError: null,
      refreshError: null,
      lastActivity: null,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ loginLoading: true, loginError: null });

        try {
          const result = await authService.login(credentials);

          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            loginLoading: false,
            lastActivity: new Date()
          });

          // Emit login event
          eventBus.emit('USER_LOGIN', {
            user: result.user,
            timestamp: new Date()
          });

          // Start session monitoring
          sessionMonitor.startMonitoring();
        } catch (error) {
          set({
            loginError: error.message,
            loginLoading: false
          });

          // Emit login failed event
          eventBus.emit('USER_LOGIN_FAILED', {
            error: error.message,
            credentials: credentials.email
          });
        }
      },

      // Logout action
      logout: async () => {
        set({ logoutLoading: true });

        try {
          await authService.logout();
        } catch (error) {
          console.warn('Logout API call failed:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            logoutLoading: false,
            lastActivity: null,
            loginError: null,
            refreshError: null
          });

          // Emit logout event
          eventBus.emit('USER_LOGOUT', {
            timestamp: new Date()
          });

          // Stop session monitoring
          sessionMonitor.stopMonitoring();
        }
      },

      // Refresh token action
      refreshToken: async () => {
        set({ refreshLoading: true, refreshError: null });

        try {
          const newToken = await authService.refreshToken();

          set({
            token: newToken,
            refreshLoading: false,
            lastActivity: new Date()
          });

          // Emit token refresh event
          eventBus.emit('TOKEN_REFRESHED', {
            timestamp: new Date()
          });
        } catch (error) {
          set({
            refreshError: error.message,
            refreshLoading: false
          });

          // Auto-logout on refresh failure
          get().logout();
        }
      },

      // Update user data
      updateUser: (updates: Partial<User>) => {
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));

        // Emit user update event
        eventBus.emit('USER_UPDATED', {
          user: get().user,
          changes: updates
        });
      },

      // Update last activity
      updateLastActivity: () => {
        set({ lastActivity: new Date() });
      },

      // Clear errors
      clearErrors: () => {
        set({
          loginError: null,
          refreshError: null
        });
      }
    })),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist non-sensitive data
        sessionTimeout: state.sessionTimeout
      })
    }
  )
);

// Subscribe to auth events to handle automatic token refresh
useAuthStore.subscribe(
  (state) => state.token,
  (token) => {
    if (token) {
      // Set up automatic token refresh
      tokenRefreshScheduler.schedule(token);
    }
  }
);
```

### UIStore - Global UI State

```typescript
// src/core/stores/app/uiStore.ts
interface UIState {
  // Layout state
  sidebarCollapsed: boolean;
  sidebarMobile: boolean;
  headerVisible: boolean;
  fullscreen: boolean;

  // Theme state
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  compactMode: boolean;

  // Modal state
  modals: Record<string, {
    open: boolean;
    data?: any;
    config?: ModalConfig;
  }>;

  // Drawer state
  drawers: Record<string, {
    open: boolean;
    data?: any;
    config?: DrawerConfig;
  }>;

  // Loading state
  globalLoading: boolean;
  loadingMessage: string | null;
  loadingProgress?: number;

  // Notification state
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  openModal: (id: string, data?: any, config?: ModalConfig) => void;
  closeModal: (id: string) => void;
  openDrawer: (id: string, data?: any, config?: DrawerConfig) => void;
  closeDrawer: (id: string) => void;
  setGlobalLoading: (loading: boolean, message?: string, progress?: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist((set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarMobile: false,
      headerVisible: true,
      fullscreen: false,
      theme: 'light',
      primaryColor: '#1890ff',
      compactMode: false,
      modals: {},
      drawers: {},
      globalLoading: false,
      loadingMessage: null,
      notifications: [],

      // Layout actions
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Theme actions
      setTheme: (theme: 'light' | 'dark' | 'auto') => {
        set({ theme });

        // Apply theme to document
        applyTheme(theme);

        // Emit theme change event
        eventBus.emit('THEME_CHANGED', { theme });
      },

      // Modal actions
      openModal: (id: string, data?: any, config?: ModalConfig) => {
        set(state => ({
          modals: {
            ...state.modals,
            [id]: { open: true, data, config }
          }
        }));

        // Emit modal open event
        eventBus.emit('MODAL_OPENED', { modalId: id, data });
      },

      closeModal: (id: string) => {
        set(state => ({
          modals: {
            ...state.modals,
            [id]: { ...state.modals[id], open: false }
          }
        }));

        // Emit modal close event
        eventBus.emit('MODAL_CLOSED', { modalId: id });
      },

      // Drawer actions
      openDrawer: (id: string, data?: any, config?: DrawerConfig) => {
        set(state => ({
          drawers: {
            ...state.drawers,
            [id]: { open: true, data, config }
          }
        }));
      },

      closeDrawer: (id: string) => {
        set(state => ({
          drawers: {
            ...state.drawers,
            [id]: { ...state.drawers[id], open: false }
          }
        }));
      },

      // Loading actions
      setGlobalLoading: (loading: boolean, message?: string, progress?: number) => {
        set({
          globalLoading: loading,
          loadingMessage: message || null,
          loadingProgress: progress
        });
      },

      // Notification actions
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: Date.now().toString() + Math.random().toString(36).substr(2),
          timestamp: new Date()
        };

        set(state => ({
          notifications: [notification, ...state.notifications.slice(0, 9)]
        }));

        // Auto-remove after delay
        if (notification.autoRemove !== false) {
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, notification.duration || 5000);
        }

        // Emit notification event
        eventBus.emit('NOTIFICATION_ADDED', { notification });
      },

      removeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      }
    }), {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        primaryColor: state.primaryColor,
        compactMode: state.compactMode
      })
    })
  )
);

// Helper function to apply theme
const applyTheme = (theme: string) => {
  document.documentElement.setAttribute('data-theme', theme);

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
};
```

## 🔌 Plugin Store Examples

### Task Management Store

```typescript
// src/plugins/TaskManagement/stores/taskStore.ts
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  projectId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments: Attachment[];
}

interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  project?: string;
  search: string;
  tags?: string[];
  dueDateRange?: [Date, Date];
}

interface TaskState extends PaginationState<Task> {
  // Additional task-specific state
  selectedTasks: string[];
  bulkUpdateLoading: boolean;
  taskStats: TaskStats | null;

  // Enhanced actions
  loadTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (task: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  assignTask: (taskId: string, assigneeId: string) => Promise<void>;
  changeTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  loadTaskStats: () => Promise<void>;
  selectTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    subscribeWithSelector((set, get) => {
      // Create pagination methods
      const paginationMethods = createPaginationMethods<Task>(
        async (params) => {
          const response = await taskService.getTasks(params);
          return { items: response.tasks, total: response.total };
        }
      );

      return {
        // Pagination state
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        hasMore: false,
        loading: false,
        error: null,
        filters: {
          search: '',
          status: undefined,
          priority: undefined,
          assignee: undefined,
          project: undefined,
          tags: undefined,
          dueDateRange: undefined
        },

        // Task-specific state
        selectedTasks: [],
        bulkUpdateLoading: false,
        taskStats: null,

        // Pagination actions
        ...paginationMethods,

        // Enhanced load tasks with filtering
        loadTasks: async (filters?: TaskFilters) => {
          if (filters) {
            set({ filters: { ...get().filters, ...filters } });
          }
          await paginationMethods.loadPage(1, set, get);
        },

        // Create task
        createTask: async (taskData: CreateTaskRequest) => {
          try {
            const newTask = await taskService.createTask(taskData);

            // Add to store
            paginationMethods.addItem(newTask, set, get);

            // Emit event
            eventBus.emit('TASK_CREATED', {
              task: newTask,
              creator: taskData.createdBy
            });

            // Refresh stats
            get().loadTaskStats();

            return newTask;
          } catch (error) {
            set({ error: error.message });
            throw error;
          }
        },

        // Update task
        updateTask: async (id: string, updates: UpdateTaskRequest) => {
          try {
            const updatedTask = await taskService.updateTask(id, updates);

            // Update in store
            paginationMethods.updateItem(id, updatedTask, set, get);

            // Emit event
            eventBus.emit('TASK_UPDATED', {
              task: updatedTask,
              changes: updates
            });

            return updatedTask;
          } catch (error) {
            set({ error: error.message });
            throw error;
          }
        },

        // Delete task
        deleteTask: async (id: string) => {
          try {
            await taskService.deleteTask(id);

            // Remove from store
            paginationMethods.removeItem(id, set, get);

            // Clear from selection if selected
            const state = get();
            if (state.selectedTasks.includes(id)) {
              set({
                selectedTasks: state.selectedTasks.filter(taskId => taskId !== id)
              });
            }

            // Emit event
            eventBus.emit('TASK_DELETED', { taskId: id });

            // Refresh stats
            get().loadTaskStats();
          } catch (error) {
            set({ error: error.message });
            throw error;
          }
        },

        // Bulk update tasks
        bulkUpdateTasks: async (taskIds: string[], updates: Partial<Task>) => {
          set({ bulkUpdateLoading: true });

          try {
            const updatedTasks = await taskService.bulkUpdateTasks(taskIds, updates);

            // Update all tasks in store
            updatedTasks.forEach(task => {
              paginationMethods.updateItem(task.id, task, set, get);
            });

            // Clear selection
            set({ selectedTasks: [], bulkUpdateLoading: false });

            // Emit event
            eventBus.emit('TASKS_BULK_UPDATED', {
              taskIds,
              updates,
              updatedTasks
            });
          } catch (error) {
            set({ bulkUpdateLoading: false, error: error.message });
            throw error;
          }
        },

        // Assign task
        assignTask: async (taskId: string, assigneeId: string) => {
          await get().updateTask(taskId, { assigneeId });

          // Emit specific assignment event
          eventBus.emit('TASK_ASSIGNED', {
            taskId,
            assigneeId,
            assignedBy: useAuthStore.getState().user?.id
          });
        },

        // Change task status
        changeTaskStatus: async (taskId: string, status: Task['status']) => {
          const previousTask = get().items.find(task => task.id === taskId);
          await get().updateTask(taskId, { status });

          // Emit status change event
          eventBus.emit('TASK_STATUS_CHANGED', {
            taskId,
            newStatus: status,
            previousStatus: previousTask?.status
          });
        },

        // Load task statistics
        loadTaskStats: async () => {
          try {
            const stats = await taskService.getTaskStats(get().filters);
            set({ taskStats: stats });
          } catch (error) {
            console.error('Failed to load task stats:', error);
          }
        },

        // Task selection
        selectTasks: (taskIds: string[]) => {
          set({ selectedTasks: taskIds });
        },

        clearSelection: () => {
          set({ selectedTasks: [] });
        }
      };
    }),
    {
      name: 'task-store',
      partialize: (state) => ({
        // Persist filters and pagination settings
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
      useTaskStore.getState().reset();
    });
  }
);
```

### Real-time Updates Store

```typescript
// src/plugins/RealTimeUpdates/stores/realtimeStore.ts
interface RealtimeState {
  // Connection state
  connected: boolean;
  connecting: boolean;
  connectionError: string | null;
  lastConnected: Date | null;

  // Subscriptions
  subscriptions: Map<string, RealtimeSubscription>;
  activeChannels: Set<string>;

  // Message queue
  messageQueue: RealtimeMessage[];
  processingQueue: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: any) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  sendMessage: (channel: string, data: any) => void;
  processMessageQueue: () => Promise<void>;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  // Initial state
  connected: false,
  connecting: false,
  connectionError: null,
  lastConnected: null,
  subscriptions: new Map(),
  activeChannels: new Set(),
  messageQueue: [],
  processingQueue: false,

  // Connect to WebSocket
  connect: async () => {
    const state = get();
    if (state.connected || state.connecting) return;

    set({ connecting: true, connectionError: null });

    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user');

      const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}?userId=${user.id}`);

      ws.onopen = () => {
        set({
          connected: true,
          connecting: false,
          lastConnected: new Date()
        });

        // Process any queued messages
        get().processMessageQueue();

        // Emit connection event
        eventBus.emit('REALTIME_CONNECTED');
      };

      ws.onmessage = (event) => {
        const message: RealtimeMessage = JSON.parse(event.data);

        // Add to queue for processing
        set(state => ({
          messageQueue: [...state.messageQueue, message]
        }));

        // Process queue
        get().processMessageQueue();
      };

      ws.onclose = () => {
        set({ connected: false });

        // Attempt to reconnect after delay
        setTimeout(() => {
          get().connect();
        }, 5000);

        // Emit disconnection event
        eventBus.emit('REALTIME_DISCONNECTED');
      };

      ws.onerror = (error) => {
        set({
          connectionError: 'WebSocket connection failed',
          connecting: false
        });
      };

      // Store WebSocket instance
      (window as any).realtimeWS = ws;
    } catch (error) {
      set({
        connectionError: error.message,
        connecting: false
      });
    }
  },

  // Disconnect from WebSocket
  disconnect: () => {
    const ws = (window as any).realtimeWS;
    if (ws) {
      ws.close();
      delete (window as any).realtimeWS;
    }

    set({
      connected: false,
      connecting: false,
      subscriptions: new Map(),
      activeChannels: new Set()
    });
  },

  // Subscribe to a channel
  subscribe: (channel: string, callback: (data: any) => void) => {
    const subscriptionId = `${channel}-${Date.now()}-${Math.random()}`;

    set(state => {
      const newSubscriptions = new Map(state.subscriptions);
      newSubscriptions.set(subscriptionId, { channel, callback });

      const newActiveChannels = new Set(state.activeChannels);
      newActiveChannels.add(channel);

      return {
        subscriptions: newSubscriptions,
        activeChannels: newActiveChannels
      };
    });

    // Send subscription message to server
    const ws = (window as any).realtimeWS;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }

    return subscriptionId;
  },

  // Unsubscribe from a channel
  unsubscribe: (subscriptionId: string) => {
    const state = get();
    const subscription = state.subscriptions.get(subscriptionId);

    if (subscription) {
      const newSubscriptions = new Map(state.subscriptions);
      newSubscriptions.delete(subscriptionId);

      // Check if any other subscriptions use this channel
      const channelStillInUse = Array.from(newSubscriptions.values())
        .some(sub => sub.channel === subscription.channel);

      const newActiveChannels = new Set(state.activeChannels);
      if (!channelStillInUse) {
        newActiveChannels.delete(subscription.channel);

        // Send unsubscribe message to server
        const ws = (window as any).realtimeWS;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            channel: subscription.channel
          }));
        }
      }

      set({
        subscriptions: newSubscriptions,
        activeChannels: newActiveChannels
      });
    }
  },

  // Send message to channel
  sendMessage: (channel: string, data: any) => {
    const ws = (window as any).realtimeWS;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        channel,
        data
      }));
    }
  },

  // Process message queue
  processMessageQueue: async () => {
    const state = get();
    if (state.processingQueue || state.messageQueue.length === 0) return;

    set({ processingQueue: true });

    try {
      const messages = [...state.messageQueue];
      set({ messageQueue: [] });

      for (const message of messages) {
        // Find all subscribers for this channel
        const subscribers = Array.from(state.subscriptions.values())
          .filter(sub => sub.channel === message.channel);

        // Call all subscriber callbacks
        for (const subscriber of subscribers) {
          try {
            await subscriber.callback(message.data);
          } catch (error) {
            console.error('Error in realtime subscriber:', error);
          }
        }
      }
    } finally {
      set({ processingQueue: false });
    }
  }
}));

// Auto-connect when auth state changes
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    const realtimeStore = useRealtimeStore.getState();

    if (isAuthenticated) {
      realtimeStore.connect();
    } else {
      realtimeStore.disconnect();
    }
  }
);
```

## 🔄 Store Integration Patterns

### Cross-Store Communication

```typescript
// src/core/stores/integration/storeIntegration.ts
export class StoreIntegration {
  private subscriptions: (() => void)[] = [];

  /**
   * Initialize cross-store subscriptions
   */
  initialize(): void {
    // Auth state changes affect other stores
    this.subscriptions.push(
      useAuthStore.subscribe(
        (state) => state.user,
        (user) => {
          if (user) {
            // Load user-specific data in other stores
            useTaskStore.getState().loadTasks();
            useProjectStore.getState().loadUserProjects(user.id);
            useNotificationStore.getState().loadUnreadNotifications(user.id);
          } else {
            // Clear data when user logs out
            useTaskStore.getState().reset();
            useProjectStore.getState().reset();
            useNotificationStore.getState().clearNotifications();
          }
        }
      )
    );

    // Task changes affect project statistics
    this.subscriptions.push(
      useTaskStore.subscribe(
        (state) => state.items,
        (tasks) => {
          const projectStore = useProjectStore.getState();
          projectStore.updateProjectStats();
        }
      )
    );

    // Theme changes affect all UI components
    this.subscriptions.push(
      useUIStore.subscribe(
        (state) => state.theme,
        (theme) => {
          applyThemeToComponents(theme);
          updateChartThemes(theme);
        }
      )
    );
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}

// Initialize store integration
export const storeIntegration = new StoreIntegration();
```

### Event-Store Integration

```typescript
// src/core/stores/integration/eventIntegration.ts
export class EventStoreIntegration {
  /**
   * Initialize event-store integrations
   */
  initialize(): void {
    // Listen to events and update stores accordingly
    eventBus.subscribe('TASK_ASSIGNED', (event) => {
      const taskStore = useTaskStore.getState();
      taskStore.updateTask(event.taskId, { assigneeId: event.assigneeId });

      // Update assignee's notification count
      if (event.assigneeId === useAuthStore.getState().user?.id) {
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          type: 'info',
          title: 'Task Assigned',
          message: 'You have been assigned a new task'
        });
      }
    });

    eventBus.subscribe('PROJECT_MEMBER_ADDED', (event) => {
      const projectStore = useProjectStore.getState();
      projectStore.addProjectMember(event.projectId, event.member);

      // Grant file access
      const fileStore = useFileStore.getState();
      fileStore.grantProjectFileAccess(event.member.id, event.projectId);
    });

    eventBus.subscribe('USER_PERMISSIONS_CHANGED', (event) => {
      const authStore = useAuthStore.getState();
      if (event.userId === authStore.user?.id) {
        authStore.updateUser({ permissions: event.newPermissions });
      }
    });
  }
}

export const eventStoreIntegration = new EventStoreIntegration();
```

## 🚀 Performance Optimization

### Store Selectors

```typescript
// Efficient selectors to prevent unnecessary re-renders
export const useTaskSelectors = {
  // Select only specific fields
  useTaskCount: () => useTaskStore(state => state.totalCount),
  useTaskLoading: () => useTaskStore(state => state.loading),
  useSelectedTasks: () => useTaskStore(state => state.selectedTasks),

  // Select with computed values
  useCompletedTasksCount: () => useTaskStore(state =>
    state.items.filter(task => task.status === 'done').length
  ),

  // Select specific task by ID
  useTask: (taskId: string) => useTaskStore(state =>
    state.items.find(task => task.id === taskId)
  ),

  // Select filtered tasks
  useFilteredTasks: (filter: (task: Task) => boolean) => useTaskStore(state =>
    state.items.filter(filter)
  )
};

// Usage in components
const TaskCounter: React.FC = () => {
  const taskCount = useTaskSelectors.useTaskCount();
  const completedCount = useTaskSelectors.useCompletedTasksCount();

  return (
    <div>
      <span>Total: {taskCount}</span>
      <span>Completed: {completedCount}</span>
    </div>
  );
};
```

### Middleware Stack

```typescript
// src/core/stores/middleware/index.ts
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Performance monitoring middleware
const performanceMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      const start = performance.now();
      set(...args);
      const end = performance.now();

      if (end - start > 16) { // Warn if update takes more than 16ms
        console.warn(`Slow store update: ${end - start}ms`);
      }
    },
    get,
    api
  );

// Logging middleware
const loggingMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.group('Store Update');
      console.log('Previous State:', get());
      set(...args);
      console.log('New State:', get());
      console.groupEnd();
    },
    get,
    api
  );

// Create store with middleware stack
export const createStoreWithMiddleware = <T>(
  storeConfig: any,
  options: {
    name: string;
    persist?: boolean;
    devtools?: boolean;
    performance?: boolean;
    logging?: boolean;
  }
) => {
  let store = storeConfig;

  // Apply middleware in order
  if (options.performance) {
    store = performanceMiddleware(store);
  }

  if (options.logging && process.env.NODE_ENV === 'development') {
    store = loggingMiddleware(store);
  }

  store = subscribeWithSelector(store);

  if (options.persist) {
    store = persist(store, {
      name: options.name,
      getStorage: () => localStorage
    });
  }

  if (options.devtools) {
    store = devtools(store, { name: options.name });
  }

  return store;
};
```

## 📋 Best Practices

### 1. Store Organization
- **Single Responsibility** - Each store manages one domain
- **Clear Naming** - Use descriptive names for actions and state
- **Type Safety** - Use TypeScript interfaces for all state
- **Event Integration** - Emit events for important state changes

### 2. Performance
- **Selectors** - Use selectors to prevent unnecessary re-renders
- **Normalization** - Normalize complex nested data
- **Debouncing** - Debounce frequent updates
- **Lazy Loading** - Load data only when needed

### 3. Error Handling
- **Error State** - Include error state in all async operations
- **User Feedback** - Show meaningful error messages
- **Recovery** - Provide retry mechanisms
- **Logging** - Log errors for debugging

### 4. Testing
- **Store Tests** - Test all store actions and state changes
- **Integration Tests** - Test store interactions
- **Mock Data** - Use consistent mock data
- **Async Testing** - Properly test async operations

---

This state management system provides a robust, scalable foundation for managing complex application state while maintaining performance and developer experience.

## 📚 Next Steps

Continue exploring the framework:

1. **[Event Bus](./event-bus.md)** - Master event-driven communication
2. **[Testing](./testing.md)** - Comprehensive testing strategies
3. **[Plugin Development](./plugin-development.md)** - Build custom plugins
4. **[Performance](./performance.md)** - Optimization techniques

**Master state management for scalable applications!** 🚀