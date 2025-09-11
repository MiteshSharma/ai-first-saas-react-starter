# State Management with Zustand

The AI-First React Framework uses Zustand for state management, providing a small, fast, and scalable state-management solution. This guide covers Zustand patterns, best practices, and integration with React.

## 🧠 Zustand Philosophy

Zustand follows the principle of **simple state management without the boilerplate**. This leads to:

- **Minimal API**: Small bundle size (2.6kb) and simple API
- **TypeScript first**: Excellent TypeScript support out of the box
- **No providers**: Direct hook access without context providers
- **Flexible**: Works with class components, functional components, and even outside React
- **Devtools**: Built-in Redux DevTools integration
- **Middleware**: Extensible with powerful middleware ecosystem

## 🏗️ Store Architecture

### Basic Store Creation

```typescript
// src/stores/useCounterStore.ts
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Store Export Pattern

```typescript
// src/stores/index.ts
// Export all stores for easy importing
export { useUserStore } from './useUserStore';
export { useAuthStore } from './useAuthStore';
export { useUIStore } from './useUIStore';
export { useCartStore } from './useCartStore';
```

## 🗄️ Store Patterns

### CRUD Store Pattern

```typescript
// src/stores/useUserStore.ts
import { create } from 'zustand';
import { userService } from '@services/UserService';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStore {
  // State
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalCount: number;
  
  // Filters
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  
  // Computed getters
  filteredUsers: () => User[];
  paginatedUsers: () => User[];
  totalPages: () => number;
  hasUsers: () => boolean;
  
  // Actions
  fetchUsers: (refresh?: boolean) => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  searchQuery: '',
  statusFilter: 'all',

  // Computed getters
  filteredUsers: () => {
    const { users, searchQuery, statusFilter } = get();
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    return filtered;
  },

  paginatedUsers: () => {
    const { filteredUsers, currentPage, pageSize } = get();
    const start = (currentPage - 1) * pageSize;
    return filteredUsers().slice(start, start + pageSize);
  },

  totalPages: () => {
    const { filteredUsers, pageSize } = get();
    return Math.ceil(filteredUsers().length / pageSize);
  },

  hasUsers: () => get().users.length > 0,

  // Actions
  fetchUsers: async (refresh = false) => {
    const { loading, currentPage, pageSize, searchQuery, statusFilter } = get();
    
    if (loading && !refresh) return;
    
    set({ loading: true, error: null });

    try {
      const response = await userService.getUsers({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        status: statusFilter,
      });

      set({
        users: response.data,
        totalCount: response.total,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        loading: false,
      });
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });

    try {
      const newUser = await userService.createUser(userData);
      
      set((state) => ({
        users: [newUser, ...state.users],
        totalCount: state.totalCount + 1,
        loading: false,
      }));

      return newUser;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create user',
        loading: false,
      });
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    const { users, selectedUser } = get();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('User not found');

    // Optimistic update
    const originalUser = { ...users[userIndex] };
    const optimisticUser = { ...originalUser, ...updates };
    
    set((state) => ({
      users: state.users.map(user => 
        user.id === id ? optimisticUser : user
      ),
      selectedUser: selectedUser?.id === id ? optimisticUser : selectedUser,
    }));

    try {
      const updatedUser = await userService.updateUser(id, updates);
      
      set((state) => ({
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        selectedUser: selectedUser?.id === id ? updatedUser : selectedUser,
      }));

      return updatedUser;
    } catch (error) {
      // Rollback optimistic update
      set((state) => ({
        users: state.users.map(user => 
          user.id === id ? originalUser : user
        ),
        selectedUser: selectedUser?.id === id ? originalUser : selectedUser,
        error: error instanceof Error ? error.message : 'Failed to update user',
      }));
      throw error;
    }
  },

  deleteUser: async (id) => {
    const { users, selectedUser } = get();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('User not found');

    // Optimistic removal
    const removedUser = users[userIndex];
    set((state) => ({
      users: state.users.filter(user => user.id !== id),
      totalCount: state.totalCount - 1,
      selectedUser: selectedUser?.id === id ? null : selectedUser,
    }));

    try {
      await userService.deleteUser(id);
    } catch (error) {
      // Rollback optimistic removal
      set((state) => ({
        users: [...state.users.slice(0, userIndex), removedUser, ...state.users.slice(userIndex)],
        totalCount: state.totalCount + 1,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      }));
      throw error;
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),
  
  setSearchQuery: (searchQuery) => set({ 
    searchQuery, 
    currentPage: 1 // Reset pagination
  }),
  
  setStatusFilter: (statusFilter) => set({ 
    statusFilter, 
    currentPage: 1 // Reset pagination
  }),
  
  setPage: (currentPage) => set({ currentPage }),
  
  clearError: () => set({ error: null }),

  reset: () => set({
    users: [],
    selectedUser: null,
    loading: false,
    error: null,
    currentPage: 1,
    searchQuery: '',
    statusFilter: 'all',
  }),
}));
```

### Authentication Store

```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@services/AuthService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
}

interface AuthStore {
  // State
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  
  // Computed getters
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  userPermissions: () => string[];
  hasPermission: (permission: string) => boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      // Computed getters
      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      userPermissions: () => {
        const { user } = get();
        return user?.permissions || [];
      },

      hasPermission: (permission: string) => {
        const { userPermissions } = get();
        return userPermissions().includes(permission);
      },

      // Actions
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });

        try {
          const response = await authService.login({ email, password });
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            loading: false,
          });

          // Setup auto-refresh
          get().setupTokenRefresh();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            loading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        
        try {
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch (error) {
          console.warn('Logout request failed:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            error: null,
          });
          get().clearTokenRefresh();
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await authService.refreshToken(refreshToken);
          
          set({
            token: response.token,
            refreshToken: response.refreshToken,
          });

          get().setupTokenRefresh();
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      setUser: (user) => set({ user }),
      
      clearError: () => set({ error: null }),

      initialize: async () => {
        const { token, refreshToken } = get();
        
        if (token && refreshToken) {
          try {
            const user = await authService.getCurrentUser();
            set({ user });
            get().setupTokenRefresh();
          } catch (error) {
            get().logout();
          }
        }
      },

      // Private methods (not exposed in interface)
      setupTokenRefresh: () => {
        const { token } = get();
        if (!token) return;

        const tokenExpiry = get().getTokenExpiry();
        if (tokenExpiry) {
          const refreshTime = tokenExpiry - Date.now() - (5 * 60 * 1000); // 5 minutes before expiry
          if (refreshTime > 0) {
            setTimeout(() => {
              get().refreshAuth();
            }, refreshTime);
          }
        }
      },

      clearTokenRefresh: () => {
        // Implementation would clear any existing timeouts
      },

      getTokenExpiry: (): number | null => {
        const { token } = get();
        if (!token) return null;
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.exp * 1000; // Convert to milliseconds
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
```

### UI Store for Global UI State

```typescript
// src/stores/useUIStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIStore {
  // Layout state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Loading states
  loadingStates: Map<string, boolean>;
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  openModals: Set<string>;
  
  // Navigation
  breadcrumbs: Array<{ label: string; path?: string }>;
  
  // Computed getters
  isLoading: () => boolean;
  isLoadingKey: (key: string) => boolean;
  activeNotifications: () => Notification[];
  isModalOpen: (modalId: string) => boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (key: string, loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) => void;
  
  // Helper methods
  showSuccessNotification: (title: string, message?: string) => string;
  showErrorNotification: (title: string, message?: string) => string;
  showWarningNotification: (title: string, message?: string) => string;
  showInfoNotification: (title: string, message?: string) => string;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      theme: 'light',
      loadingStates: new Map(),
      notifications: [],
      openModals: new Set(),
      breadcrumbs: [],

      // Computed getters
      isLoading: () => {
        const { loadingStates } = get();
        return Array.from(loadingStates.values()).some(Boolean);
      },

      isLoadingKey: (key: string) => {
        const { loadingStates } = get();
        return loadingStates.get(key) || false;
      },

      activeNotifications: () => {
        const { notifications } = get();
        return notifications.slice(0, 5); // Show max 5 notifications
      },

      isModalOpen: (modalId: string) => {
        const { openModals } = get();
        return openModals.has(modalId);
      },

      // Layout actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      // Loading state management
      setLoading: (key: string, loading: boolean) => {
        set((state) => {
          const newLoadingStates = new Map(state.loadingStates);
          if (loading) {
            newLoadingStates.set(key, true);
          } else {
            newLoadingStates.delete(key);
          }
          return { loadingStates: newLoadingStates };
        });
      },

      // Notification management
      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification: Notification = {
          id,
          duration: 5000,
          ...notification,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),

      clearNotifications: () => set({ notifications: [] }),

      // Modal management
      openModal: (modalId) => set((state) => ({
        openModals: new Set([...state.openModals, modalId]),
      })),

      closeModal: (modalId) => set((state) => {
        const newOpenModals = new Set(state.openModals);
        newOpenModals.delete(modalId);
        return { openModals: newOpenModals };
      }),

      // Navigation
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      // Helper methods
      showSuccessNotification: (title, message) => 
        get().addNotification({ type: 'success', title, message }),

      showErrorNotification: (title, message) => 
        get().addNotification({ type: 'error', title, message }),

      showWarningNotification: (title, message) => 
        get().addNotification({ type: 'warning', title, message }),

      showInfoNotification: (title, message) => 
        get().addNotification({ type: 'info', title, message }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
```

## 🔌 Middleware Integration

### DevTools Middleware

```typescript
// src/stores/useCounterStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStore>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), 'decrement'),
    }),
    { name: 'counter-store' }
  )
);
```

### Persist Middleware with Options

```typescript
// src/stores/useSettingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsStore {
  preferences: {
    language: string;
    notifications: boolean;
    autoSave: boolean;
  };
  updatePreference: <K extends keyof SettingsStore['preferences']>(
    key: K,
    value: SettingsStore['preferences'][K]
  ) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      preferences: {
        language: 'en',
        notifications: true,
        autoSave: true,
      },
      updatePreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage instead of localStorage
      partialize: (state) => ({ preferences: state.preferences }),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration logic for version 0 to 1
          return {
            preferences: {
              language: 'en',
              notifications: true,
              autoSave: true,
              ...persistedState,
            },
          };
        }
        return persistedState as SettingsStore;
      },
    }
  )
);
```

### Immer Middleware for Complex State

```typescript
// src/stores/useTaskStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  tags: string[];
  assignee?: {
    id: string;
    name: string;
  };
}

interface TaskStore {
  tasks: Task[];
  filters: {
    completed: boolean | null;
    assigneeId: string | null;
    tags: string[];
  };
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  updateTaskAssignee: (taskId: string, assignee: Task['assignee']) => void;
  addTagToTask: (taskId: string, tag: string) => void;
  removeTagFromTask: (taskId: string, tag: string) => void;
  setFilter: <K extends keyof TaskStore['filters']>(
    key: K,
    value: TaskStore['filters'][K]
  ) => void;
}

export const useTaskStore = create<TaskStore>()(
  immer((set) => ({
    tasks: [],
    filters: {
      completed: null,
      assigneeId: null,
      tags: [],
    },

    addTask: (task) =>
      set((state) => {
        state.tasks.push({ ...task, id: Date.now().toString() });
      }),

    toggleTask: (id) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === id);
        if (task) {
          task.completed = !task.completed;
        }
      }),

    updateTaskAssignee: (taskId, assignee) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.assignee = assignee;
        }
      }),

    addTagToTask: (taskId, tag) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (task && !task.tags.includes(tag)) {
          task.tags.push(tag);
        }
      }),

    removeTagFromTask: (taskId, tag) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.tags = task.tags.filter((t) => t !== tag);
        }
      }),

    setFilter: (key, value) =>
      set((state) => {
        state.filters[key] = value;
      }),
  }))
);
```

## ⚛️ React Integration

### Basic Usage in Components

```typescript
// src/components/UserList/UserList.tsx
import React, { useEffect } from 'react';
import { useUserStore } from '@stores';

export const UserList: React.FC = () => {
  const {
    users,
    loading,
    error,
    filteredUsers,
    paginatedUsers,
    totalPages,
    currentPage,
    fetchUsers,
    setPage,
    setSearchQuery,
    setStatusFilter,
  } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {/* Search and filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User list */}
      <div className="user-list">
        {paginatedUsers().map(user => (
          <div key={user.id} className="user-item">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <span className={user.isActive ? 'active' : 'inactive'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: totalPages() }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Selective Subscriptions

```typescript
// src/components/UserCount/UserCount.tsx
import React from 'react';
import { useUserStore } from '@stores';
import { shallow } from 'zustand/shallow';

// Only re-render when user count changes
export const UserCount: React.FC = () => {
  const userCount = useUserStore((state) => state.users.length);
  
  return <div>Total Users: {userCount}</div>;
};

// Multiple selective subscriptions
export const UserStats: React.FC = () => {
  const { userCount, activeCount } = useUserStore(
    (state) => ({
      userCount: state.users.length,
      activeCount: state.users.filter(u => u.isActive).length,
    }),
    shallow // Prevent unnecessary re-renders
  );

  return (
    <div>
      <div>Total Users: {userCount}</div>
      <div>Active Users: {activeCount}</div>
    </div>
  );
};
```

### Custom Hooks for Store Logic

```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from '@stores';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    hasPermission,
    login,
    logout,
    loading,
    error,
  } = useAuthStore();

  return {
    user,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    hasPermission,
    login,
    logout,
    loading,
    error,
  };
};

// src/hooks/useNotifications.ts
import { useUIStore } from '@stores';

export const useNotifications = () => {
  const {
    activeNotifications,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    removeNotification,
  } = useUIStore();

  return {
    notifications: activeNotifications(),
    showSuccess: showSuccessNotification,
    showError: showErrorNotification,
    showWarning: showWarningNotification,
    showInfo: showInfoNotification,
    remove: removeNotification,
  };
};
```

### Using Zustand Outside React

```typescript
// src/services/apiClient.ts
import { useAuthStore } from '@stores/useAuthStore';

class ApiClient {
  private baseURL = 'https://api.example.com';

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { token } = useAuthStore.getState();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, trigger logout
      useAuthStore.getState().logout();
      throw new Error('Authentication required');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

## 🔄 Advanced Patterns

### Store Composition with Slices

```typescript
// src/stores/slices/userSlice.ts
import { StateCreator } from 'zustand';

export interface UserSlice {
  users: User[];
  selectedUser: User | null;
  fetchUsers: () => Promise<void>;
  setSelectedUser: (user: User | null) => void;
}

export const createUserSlice: StateCreator<
  UserSlice & TaskSlice & UISlice,
  [],
  [],
  UserSlice
> = (set, get) => ({
  users: [],
  selectedUser: null,
  fetchUsers: async () => {
    // Implementation
  },
  setSelectedUser: (user) => set({ selectedUser: user }),
});

// src/stores/slices/taskSlice.ts
export interface TaskSlice {
  tasks: Task[];
  createTask: (task: Omit<Task, 'id'>) => void;
}

export const createTaskSlice: StateCreator<
  UserSlice & TaskSlice & UISlice,
  [],
  [],
  TaskSlice
> = (set, get) => ({
  tasks: [],
  createTask: (task) => {
    const newTask = { ...task, id: Date.now().toString() };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },
});

// src/stores/useAppStore.ts
import { create } from 'zustand';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createTaskSlice, TaskSlice } from './slices/taskSlice';

export const useAppStore = create<UserSlice & TaskSlice>()((...a) => ({
  ...createUserSlice(...a),
  ...createTaskSlice(...a),
}));
```

### Async State Management

```typescript
// src/stores/useAsyncStore.ts
import { create } from 'zustand';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface AsyncStore {
  users: AsyncState<User[]>;
  posts: AsyncState<Post[]>;
  
  fetchUsers: () => Promise<void>;
  fetchPosts: () => Promise<void>;
  
  // Generic async action
  executeAsync: <T>(
    key: keyof AsyncStore,
    asyncFn: () => Promise<T>
  ) => Promise<T>;
}

export const useAsyncStore = create<AsyncStore>((set, get) => ({
  users: { data: null, loading: false, error: null },
  posts: { data: null, loading: false, error: null },

  fetchUsers: () => get().executeAsync('users', userService.getUsers),
  fetchPosts: () => get().executeAsync('posts', postService.getPosts),

  executeAsync: async (key, asyncFn) => {
    set((state) => ({
      ...state,
      [key]: { ...state[key], loading: true, error: null },
    }));

    try {
      const data = await asyncFn();
      set((state) => ({
        ...state,
        [key]: { data, loading: false, error: null },
      }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set((state) => ({
        ...state,
        [key]: { ...state[key], loading: false, error: errorMessage },
      }));
      throw error;
    }
  },
}));
```

### Store Reset Pattern

```typescript
// src/stores/useResetStore.ts
import { create } from 'zustand';

interface ResetStore {
  count: number;
  name: string;
  items: string[];
  
  increment: () => void;
  setName: (name: string) => void;
  addItem: (item: string) => void;
  
  reset: () => void;
  resetToInitial: (initialState: Partial<ResetStore>) => void;
}

const initialState = {
  count: 0,
  name: '',
  items: [],
};

export const useResetStore = create<ResetStore>((set, get) => ({
  ...initialState,

  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name) => set({ name }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),

  reset: () => set(initialState),
  resetToInitial: (newInitialState) => set({ ...initialState, ...newInitialState }),
}));
```

## 🧪 Testing Zustand Stores

### Basic Store Testing

```typescript
// src/stores/__tests__/useCounterStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounterStore } from '../useCounterStore';

describe('useCounterStore', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounterStore());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    useCounterStore.setState({ count: 5 });
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets count', () => {
    useCounterStore.setState({ count: 10 });
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(0);
  });
});
```

### Testing Async Actions

```typescript
// src/stores/__tests__/useUserStore.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserStore } from '../useUserStore';
import { userService } from '@services/UserService';

// Mock the service
jest.mock('@services/UserService');
const mockedUserService = jest.mocked(userService);

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      users: [],
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetches users successfully', async () => {
    const mockUsers = [
      { id: '1', name: 'John', email: 'john@example.com', isActive: true },
      { id: '2', name: 'Jane', email: 'jane@example.com', isActive: false },
    ];

    mockedUserService.getUsers.mockResolvedValue({
      data: mockUsers,
      total: 2,
    });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch users';
    mockedUserService.getUsers.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('filters users correctly', () => {
    const users = [
      { id: '1', name: 'John Active', email: 'john@example.com', isActive: true },
      { id: '2', name: 'Jane Inactive', email: 'jane@example.com', isActive: false },
    ];

    useUserStore.setState({ users });
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setStatusFilter('active');
    });

    const filtered = result.current.filteredUsers();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('John Active');
  });
});
```

### Testing Store Integration

```typescript
// src/components/__tests__/UserList.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from '../UserList';
import { useUserStore } from '@stores';

// Create a test wrapper that initializes the store
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    useUserStore.setState({
      users: [
        { id: '1', name: 'John', email: 'john@example.com', isActive: true },
        { id: '2', name: 'Jane', email: 'jane@example.com', isActive: false },
      ],
      loading: false,
      error: null,
    });
  }, []);

  return <>{children}</>;
};

describe('UserList', () => {
  it('renders users', async () => {
    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });
  });

  it('filters users by search query', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.queryByText('Jane')).not.toBeInTheDocument();
    });
  });
});
```

## 📈 Performance Optimization

### Preventing Unnecessary Re-renders

```typescript
// src/components/OptimizedUserList.tsx
import React from 'react';
import { useUserStore } from '@stores';
import { shallow } from 'zustand/shallow';

// Bad: Will re-render on any store change
const BadUserList = () => {
  const store = useUserStore();
  return <div>{store.users.length} users</div>;
};

// Good: Only re-renders when users array changes
const GoodUserList = () => {
  const users = useUserStore((state) => state.users);
  return <div>{users.length} users</div>;
};

// Better: Only re-renders when user count changes
const BetterUserList = () => {
  const userCount = useUserStore((state) => state.users.length);
  return <div>{userCount} users</div>;
};

// Best: Use shallow comparison for multiple values
const BestUserList = () => {
  const { userCount, loading } = useUserStore(
    (state) => ({
      userCount: state.users.length,
      loading: state.loading,
    }),
    shallow
  );

  if (loading) return <div>Loading...</div>;
  return <div>{userCount} users</div>;
};
```

### Computed Values Pattern

```typescript
// src/stores/useOptimizedStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface OptimizedStore {
  items: Item[];
  filter: string;
  sortBy: 'name' | 'date';
  
  // Computed values as functions to avoid unnecessary recalculations
  filteredItems: () => Item[];
  sortedItems: () => Item[];
  itemStats: () => { total: number; active: number; completed: number };
}

export const useOptimizedStore = create<OptimizedStore>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    filter: '',
    sortBy: 'name',

    filteredItems: () => {
      const { items, filter } = get();
      if (!filter) return items;
      return items.filter(item => 
        item.name.toLowerCase().includes(filter.toLowerCase())
      );
    },

    sortedItems: () => {
      const { sortBy } = get();
      const filtered = get().filteredItems();
      return [...filtered].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    },

    itemStats: () => {
      const items = get().filteredItems();
      return {
        total: items.length,
        active: items.filter(item => item.status === 'active').length,
        completed: items.filter(item => item.status === 'completed').length,
      };
    },
  }))
);

// Usage with memoization
const ItemList = () => {
  const sortedItems = useOptimizedStore((state) => state.sortedItems());
  
  // Memoize expensive operations
  const memoizedItems = React.useMemo(() => 
    sortedItems.map(item => ({ ...item, processed: processItem(item) })),
    [sortedItems]
  );

  return (
    <div>
      {memoizedItems.map(item => (
        <ItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
};
```

## 🛠️ Development Tools

### Store DevTools Integration

```typescript
// src/stores/useDevStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DevStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useDevStore = create<DevStore>()(
  devtools(
    (set, get) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        'increment' // Action name in devtools
      ),
      decrement: () => set(
        (state) => ({ count: state.count - 1 }),
        'decrement'
      ),
      reset: () => set({ count: 0 }, 'reset'),
    }),
    {
      name: 'dev-store', // Store name in devtools
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

### Custom Middleware for Logging

```typescript
// src/stores/middleware/logger.ts
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (partial, replace) => {
    console.log(`[${name || 'Store'}] Updating:`, partial);
    const nextState = set(partial, replace);
    console.log(`[${name || 'Store'}] New state:`, get());
    return nextState;
  };
  
  store.setState = loggedSet;
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;

// Usage
export const useLoggedStore = create<CounterStore>()(
  logger(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    'counter-store'
  )
);
```

## 📚 Best Practices

### 1. Store Organization
- **One store per feature/domain**: Keep stores focused and cohesive
- **Use TypeScript interfaces**: Define clear types for your state and actions
- **Separate concerns**: Keep UI state separate from business logic

### 2. State Design
- **Store minimal state**: Derive everything possible with computed functions
- **Normalize complex data**: Use maps/objects for quick lookups
- **Avoid nested state**: Keep state structure flat when possible

### 3. Actions and Updates
- **Use immutable updates**: Zustand works best with immutable state changes
- **Batch related updates**: Use single `set` call for related state changes
- **Handle async operations properly**: Use try/catch and loading states

### 4. Performance
- **Use selective subscriptions**: Subscribe only to the state you need
- **Leverage shallow comparison**: Use `shallow` for multiple primitive values
- **Memoize expensive computations**: Use computed functions and React.useMemo
- **Split large stores**: Consider store composition for large applications

### 5. TypeScript Integration
- **Define proper interfaces**: Create clear types for your store state
- **Use strict type checking**: Enable strict mode in TypeScript
- **Type your selectors**: Use proper typing for store selectors

### 6. Testing
- **Test store logic separately**: Unit test your stores independently
- **Mock external dependencies**: Mock API calls and services
- **Test integration**: Test component-store interactions

### 7. Middleware Usage
- **Use devtools in development**: Enable Redux DevTools for debugging
- **Persist important state**: Use persist middleware for user preferences
- **Add logging in development**: Use logger middleware for debugging

---

This comprehensive guide provides the foundation for effective state management with Zustand in your AI-First React applications. Zustand's simplicity and flexibility make it an excellent choice for modern React development.