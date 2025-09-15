# Plugin Examples

This document showcases real-world plugin implementations to help you understand common patterns, best practices, and architectural decisions when building plugins for the AI-First SaaS React Starter.

## 🎯 Overview

Each example demonstrates different aspects of plugin development:

- **User Management Plugin** - Authentication, user profiles, role management
- **Dashboard Plugin** - Widgets, metrics, data visualization
- **Notification System Plugin** - Real-time notifications, preferences
- **File Management Plugin** - File upload, storage, organization
- **Analytics Plugin** - Event tracking, reporting, insights
- **Payment Processing Plugin** - Billing, subscriptions, payments
- **Team Collaboration Plugin** - Comments, mentions, activity feeds
- **API Documentation Plugin** - Interactive API docs, testing

## 🔐 User Management Plugin

A comprehensive user management system with authentication, profiles, and role-based access control.

### Plugin Structure
```
src/plugins/UserManagement/
├── UserManagementPlugin.ts
├── stores/
│   ├── userStore.ts
│   ├── roleStore.ts
│   └── permissionStore.ts
├── components/
│   ├── UserProfile/
│   ├── UserList/
│   ├── RoleManager/
│   └── PermissionMatrix/
├── pages/
│   ├── UserListPage.tsx
│   ├── UserDetailPage.tsx
│   └── RoleManagementPage.tsx
└── services/
    ├── userService.ts
    └── authService.ts
```

### Main Plugin Implementation

```typescript
// src/plugins/UserManagement/UserManagementPlugin.ts
export class UserManagementPlugin implements Plugin {
  name = 'UserManagement';
  version = '1.2.0';
  description = 'Complete user management with roles and permissions';

  async activate(context: PluginContext): Promise<void> {
    // Register routes
    context.registerRoute('/users', UserListPage);
    context.registerRoute('/users/:id', UserDetailPage);
    context.registerRoute('/users/:id/edit', UserEditPage);
    context.registerRoute('/roles', RoleManagementPage);

    // Register navigation
    context.registerNavItem({
      key: 'users',
      path: '/users',
      label: 'Users',
      icon: 'UserOutlined',
      order: 1,
      permissions: ['users.view']
    });

    context.registerNavItem({
      key: 'roles',
      path: '/roles',
      label: 'Roles & Permissions',
      icon: 'TeamOutlined',
      order: 2,
      permissions: ['roles.manage']
    });

    // Subscribe to authentication events
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.subscribe('USER_LOGOUT', this.handleUserLogout);

    // Subscribe to permission events
    context.eventBus.subscribe('PERMISSION_CHANGED', this.handlePermissionChange);

    // Initialize user data
    await this.initializeUserData(context);

    console.log('✅ User Management plugin activated');
  }

  private handleUserLogin = async (event: UserLoginEvent) => {
    const userStore = useUserStore.getState();

    // Load user profile
    await userStore.loadCurrentUser(event.user.id);

    // Track login activity
    eventBus.emit('USER_ACTIVITY', {
      userId: event.user.id,
      action: 'login',
      timestamp: new Date(),
      plugin: this.name
    });
  };

  private handleUserLogout = () => {
    const userStore = useUserStore.getState();
    userStore.clearCurrentUser();
  };

  private handlePermissionChange = (event: PermissionChangedEvent) => {
    // Refresh user permissions
    const userStore = useUserStore.getState();
    userStore.refreshUserPermissions(event.userId);
  };

  private async initializeUserData(context: PluginContext): Promise<void> {
    try {
      const currentUser = await context.auth.getCurrentUser();
      if (currentUser) {
        const userStore = useUserStore.getState();
        await userStore.loadCurrentUser(currentUser.id);
      }
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  }
}
```

### User Store Implementation

```typescript
// src/plugins/UserManagement/stores/userStore.ts
interface UserState {
  // Current user
  currentUser: User | null;
  currentUserLoading: boolean;

  // User list
  users: User[];
  userListLoading: boolean;
  userListError: string | null;

  // Pagination
  page: number;
  pageSize: number;
  totalUsers: number;

  // Filters
  filters: UserFilters;

  // Selected user for editing
  selectedUser: User | null;

  // Actions
  loadCurrentUser: (userId: string) => Promise<void>;
  loadUsers: (filters?: UserFilters) => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<User>;
  updateUser: (userId: string, updates: UpdateUserRequest) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  setUserRole: (userId: string, roleId: string) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  clearCurrentUser: () => void;
  setFilters: (filters: Partial<UserFilters>) => void;
  selectUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  currentUser: null,
  currentUserLoading: false,
  users: [],
  userListLoading: false,
  userListError: null,
  page: 1,
  pageSize: 20,
  totalUsers: 0,
  filters: {
    search: '',
    role: undefined,
    status: undefined,
    department: undefined
  },
  selectedUser: null,

  // Load current user
  loadCurrentUser: async (userId: string) => {
    set({ currentUserLoading: true });

    try {
      const user = await userService.getUser(userId);
      set({ currentUser: user, currentUserLoading: false });

      // Emit event for other plugins
      eventBus.emit('CURRENT_USER_LOADED', { user });
    } catch (error) {
      set({ currentUserLoading: false });
      console.error('Failed to load current user:', error);
    }
  },

  // Load users list
  loadUsers: async (filters?: UserFilters) => {
    const state = get();
    set({ userListLoading: true, userListError: null });

    try {
      const finalFilters = { ...state.filters, ...filters };
      const response = await userService.getUsers({
        ...finalFilters,
        page: state.page,
        pageSize: state.pageSize
      });

      set({
        users: response.users,
        totalUsers: response.total,
        userListLoading: false,
        filters: finalFilters
      });

      eventBus.emit('USERS_LOADED', {
        count: response.users.length,
        total: response.total
      });
    } catch (error) {
      set({
        userListLoading: false,
        userListError: error.message
      });
    }
  },

  // Create new user
  createUser: async (userData: CreateUserRequest) => {
    set({ userListLoading: true });

    try {
      const newUser = await userService.createUser(userData);

      set(state => ({
        users: [newUser, ...state.users],
        totalUsers: state.totalUsers + 1,
        userListLoading: false
      }));

      eventBus.emit('USER_CREATED', { user: newUser });
      return newUser;
    } catch (error) {
      set({ userListLoading: false });
      throw error;
    }
  },

  // Update user
  updateUser: async (userId: string, updates: UpdateUserRequest) => {
    try {
      const updatedUser = await userService.updateUser(userId, updates);

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? updatedUser : user
        ),
        currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser
      }));

      eventBus.emit('USER_UPDATED', {
        user: updatedUser,
        changes: updates
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId: string) => {
    try {
      await userService.deleteUser(userId);

      set(state => ({
        users: state.users.filter(user => user.id !== userId),
        totalUsers: Math.max(0, state.totalUsers - 1),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser
      }));

      eventBus.emit('USER_DELETED', { userId });
    } catch (error) {
      throw error;
    }
  },

  // Set user role
  setUserRole: async (userId: string, roleId: string) => {
    try {
      const updatedUser = await userService.setUserRole(userId, roleId);

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? updatedUser : user
        )
      }));

      eventBus.emit('USER_ROLE_CHANGED', {
        userId,
        newRoleId: roleId,
        user: updatedUser
      });
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (userId: string) => {
    try {
      await userService.resetPassword(userId);

      eventBus.emit('PASSWORD_RESET', { userId });
    } catch (error) {
      throw error;
    }
  },

  // Clear current user
  clearCurrentUser: () => {
    set({ currentUser: null });
  },

  // Set filters
  setFilters: (newFilters: Partial<UserFilters>) => {
    const state = get();
    const updatedFilters = { ...state.filters, ...newFilters };
    set({ filters: updatedFilters, page: 1 });
    state.loadUsers(updatedFilters);
  },

  // Select user
  selectUser: (user: User | null) => {
    set({ selectedUser: user });
  }
}));
```

### User List Component

```typescript
// src/plugins/UserManagement/components/UserList/UserList.tsx
export const UserList: React.FC = () => {
  const {
    users,
    userListLoading,
    totalUsers,
    filters,
    loadUsers,
    deleteUser,
    setUserRole,
    setFilters,
    selectUser
  } = useUserStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await setUserRole(userId, roleId);
      message.success('User role updated successfully');
    } catch (error) {
      message.error('Failed to update user role');
    }
  };

  const handleDelete = (user: User) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${user.name}?`,
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteUser(user.id);
          message.success('User deleted successfully');
        } catch (error) {
          message.error('Failed to delete user');
        }
      }
    });
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record: User) => (
        <div className={styles.userCell}>
          <Avatar src={record.avatar} size="large">
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{record.name}</div>
            <div className={styles.userEmail}>{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role, record: User) => (
        <Select
          value={role?.id}
          style={{ width: 150 }}
          onChange={(roleId) => handleRoleChange(record.id, roleId)}
        >
          {roles.map(role => (
            <Option key={role.id} value={role.id}>
              {role.name}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => (
        date ? moment(date).fromNow() : 'Never'
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: User) => (
        <Space>
          <Button
            size="small"
            onClick={() => selectUser(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.userList}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h2>Users</h2>
          <span className={styles.count}>({totalUsers})</span>
        </div>

        <Space>
          <Input.Search
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            style={{ width: 250 }}
          />

          <Select
            placeholder="Filter by role"
            allowClear
            value={filters.role}
            onChange={(role) => setFilters({ role })}
            style={{ width: 150 }}
          >
            {roles.map(role => (
              <Option key={role.id} value={role.id}>
                {role.name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Add User
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={userListLoading}
        pagination={{
          total: totalUsers,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />

      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
```

## 📊 Dashboard Plugin

A flexible dashboard system with configurable widgets and real-time data.

### Plugin Structure
```
src/plugins/Dashboard/
├── DashboardPlugin.ts
├── stores/
│   ├── dashboardStore.ts
│   └── widgetStore.ts
├── components/
│   ├── DashboardGrid/
│   ├── Widget/
│   ├── WidgetLibrary/
│   └── DashboardSettings/
├── widgets/
│   ├── MetricsWidget/
│   ├── ChartWidget/
│   ├── TableWidget/
│   └── CustomWidget/
└── services/
    └── dashboardService.ts
```

### Dashboard Plugin Implementation

```typescript
// src/plugins/Dashboard/DashboardPlugin.ts
export class DashboardPlugin implements Plugin {
  name = 'Dashboard';
  version = '2.0.0';
  description = 'Customizable dashboard with widgets';

  async activate(context: PluginContext): Promise<void> {
    // Register routes
    context.registerRoute('/', DashboardPage);
    context.registerRoute('/dashboard', DashboardPage);
    context.registerRoute('/dashboard/settings', DashboardSettingsPage);

    // Register navigation
    context.registerNavItem({
      key: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'DashboardOutlined',
      order: 0
    });

    // Subscribe to data events from other plugins
    context.eventBus.subscribe('USER_LOGIN', this.loadUserDashboard);
    context.eventBus.subscribe('TASK_CREATED', this.updateTaskMetrics);
    context.eventBus.subscribe('PROJECT_UPDATED', this.updateProjectMetrics);

    // Register default widgets
    this.registerDefaultWidgets(context);

    // Initialize dashboard
    await this.initializeDashboard(context);
  }

  private loadUserDashboard = async (event: UserLoginEvent) => {
    const dashboardStore = useDashboardStore.getState();
    await dashboardStore.loadUserDashboard(event.user.id);
  };

  private updateTaskMetrics = (event: TaskCreatedEvent) => {
    // Update task-related widgets
    eventBus.emit('WIDGET_DATA_UPDATE', {
      widgetType: 'task-metrics',
      data: { newTask: event.task }
    });
  };

  private updateProjectMetrics = (event: ProjectUpdatedEvent) => {
    // Update project-related widgets
    eventBus.emit('WIDGET_DATA_UPDATE', {
      widgetType: 'project-metrics',
      data: { updatedProject: event.project }
    });
  };

  private registerDefaultWidgets(context: PluginContext): void {
    const widgetStore = useWidgetStore.getState();

    // Register widget types
    widgetStore.registerWidget('metrics-card', MetricsCardWidget);
    widgetStore.registerWidget('line-chart', LineChartWidget);
    widgetStore.registerWidget('bar-chart', BarChartWidget);
    widgetStore.registerWidget('data-table', DataTableWidget);
    widgetStore.registerWidget('activity-feed', ActivityFeedWidget);
  }

  private async initializeDashboard(context: PluginContext): Promise<void> {
    const dashboardStore = useDashboardStore.getState();

    // Load default dashboard layout if none exists
    const hasCustomLayout = await dashboardStore.hasUserDashboard();
    if (!hasCustomLayout) {
      await dashboardStore.createDefaultDashboard();
    }
  }
}
```

### Dashboard Store

```typescript
// src/plugins/Dashboard/stores/dashboardStore.ts
interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout: GridLayout[];
}

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  config: any;
  dataSource?: string;
}

interface DashboardState {
  currentDashboard: DashboardLayout | null;
  dashboards: DashboardLayout[];
  loading: boolean;
  error: string | null;

  // Actions
  loadUserDashboard: (userId: string) => Promise<void>;
  saveDashboard: (dashboard: DashboardLayout) => Promise<void>;
  addWidget: (widget: WidgetConfig) => Promise<void>;
  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  updateLayout: (layout: GridLayout[]) => Promise<void>;
  createDefaultDashboard: () => Promise<void>;
  hasUserDashboard: () => Promise<boolean>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentDashboard: null,
  dashboards: [],
  loading: false,
  error: null,

  loadUserDashboard: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const dashboard = await dashboardService.getUserDashboard(userId);
      set({ currentDashboard: dashboard, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  saveDashboard: async (dashboard: DashboardLayout) => {
    try {
      const savedDashboard = await dashboardService.saveDashboard(dashboard);
      set({ currentDashboard: savedDashboard });

      eventBus.emit('DASHBOARD_SAVED', { dashboard: savedDashboard });
    } catch (error) {
      throw error;
    }
  },

  addWidget: async (widget: WidgetConfig) => {
    const state = get();
    if (!state.currentDashboard) return;

    const updatedDashboard = {
      ...state.currentDashboard,
      widgets: [...state.currentDashboard.widgets, widget]
    };

    await state.saveDashboard(updatedDashboard);
  },

  updateWidget: async (widgetId: string, updates: Partial<WidgetConfig>) => {
    const state = get();
    if (!state.currentDashboard) return;

    const updatedDashboard = {
      ...state.currentDashboard,
      widgets: state.currentDashboard.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
    };

    await state.saveDashboard(updatedDashboard);
  },

  removeWidget: async (widgetId: string) => {
    const state = get();
    if (!state.currentDashboard) return;

    const updatedDashboard = {
      ...state.currentDashboard,
      widgets: state.currentDashboard.widgets.filter(widget => widget.id !== widgetId)
    };

    await state.saveDashboard(updatedDashboard);
  },

  updateLayout: async (layout: GridLayout[]) => {
    const state = get();
    if (!state.currentDashboard) return;

    const updatedDashboard = {
      ...state.currentDashboard,
      layout
    };

    await state.saveDashboard(updatedDashboard);
  },

  createDefaultDashboard: async () => {
    const defaultDashboard: DashboardLayout = {
      id: 'default',
      name: 'My Dashboard',
      widgets: [
        {
          id: 'tasks-overview',
          type: 'metrics-card',
          title: 'Tasks Overview',
          config: {
            metrics: ['total', 'completed', 'pending']
          }
        },
        {
          id: 'recent-activity',
          type: 'activity-feed',
          title: 'Recent Activity',
          config: {
            limit: 10
          }
        }
      ],
      layout: [
        { i: 'tasks-overview', x: 0, y: 0, w: 6, h: 4 },
        { i: 'recent-activity', x: 6, y: 0, w: 6, h: 8 }
      ]
    };

    await get().saveDashboard(defaultDashboard);
  },

  hasUserDashboard: async (): Promise<boolean> => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return false;

      const dashboard = await dashboardService.getUserDashboard(userId);
      return !!dashboard;
    } catch {
      return false;
    }
  }
}));
```

## 🔔 Notification System Plugin

Real-time notification system with preferences and multiple delivery channels.

### Plugin Implementation

```typescript
// src/plugins/NotificationSystem/NotificationSystemPlugin.ts
export class NotificationSystemPlugin implements Plugin {
  name = 'NotificationSystem';
  version = '1.5.0';
  description = 'Real-time notification system';

  private webSocketConnection: WebSocket | null = null;

  async activate(context: PluginContext): Promise<void> {
    // Register routes
    context.registerRoute('/notifications', NotificationsPage);
    context.registerRoute('/notification-settings', NotificationSettingsPage);

    // Register navigation
    context.registerNavItem({
      key: 'notifications',
      path: '/notifications',
      label: 'Notifications',
      icon: 'BellOutlined',
      order: 10,
      badge: () => useNotificationStore.getState().unreadCount
    });

    // Subscribe to events that should trigger notifications
    context.eventBus.subscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.subscribe('TASK_ASSIGNED', this.handleTaskAssigned);
    context.eventBus.subscribe('PROJECT_MENTIONED', this.handleProjectMention);
    context.eventBus.subscribe('DEADLINE_APPROACHING', this.handleDeadlineApproaching);

    // Initialize WebSocket connection for real-time notifications
    await this.initializeWebSocket(context);

    // Load user notification preferences
    await this.loadNotificationPreferences(context);
  }

  async deactivate(context: PluginContext): Promise<void> {
    // Close WebSocket connection
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
      this.webSocketConnection = null;
    }

    // Unsubscribe from events
    context.eventBus.unsubscribe('USER_LOGIN', this.handleUserLogin);
    context.eventBus.unsubscribe('TASK_ASSIGNED', this.handleTaskAssigned);
    context.eventBus.unsubscribe('PROJECT_MENTIONED', this.handleProjectMention);
    context.eventBus.unsubscribe('DEADLINE_APPROACHING', this.handleDeadlineApproaching);
  }

  private handleUserLogin = (event: UserLoginEvent) => {
    const notificationStore = useNotificationStore.getState();

    // Welcome notification
    notificationStore.addNotification({
      type: 'success',
      title: 'Welcome back!',
      message: `Welcome back, ${event.user.name}`,
      actions: [
        {
          label: 'View Recent Activity',
          action: () => navigate('/activity')
        }
      ]
    });

    // Load user's unread notifications
    notificationStore.loadUnreadNotifications(event.user.id);
  };

  private handleTaskAssigned = (event: TaskAssignedEvent) => {
    const notificationStore = useNotificationStore.getState();

    // Only notify if it's assigned to the current user
    const currentUser = useAuthStore.getState().user;
    if (event.assigneeId === currentUser?.id) {
      notificationStore.addNotification({
        type: 'info',
        title: 'New Task Assigned',
        message: `You've been assigned to "${event.task.title}"`,
        actions: [
          {
            label: 'View Task',
            action: () => navigate(`/tasks/${event.task.id}`)
          }
        ],
        metadata: {
          taskId: event.task.id,
          priority: event.task.priority
        }
      });
    }
  };

  private handleProjectMention = (event: ProjectMentionEvent) => {
    const notificationStore = useNotificationStore.getState();

    notificationStore.addNotification({
      type: 'mention',
      title: 'You were mentioned',
      message: `${event.mentioner.name} mentioned you in ${event.project.name}`,
      actions: [
        {
          label: 'View Comment',
          action: () => navigate(`/projects/${event.project.id}#comment-${event.commentId}`)
        }
      ]
    });
  };

  private handleDeadlineApproaching = (event: DeadlineApproachingEvent) => {
    const notificationStore = useNotificationStore.getState();

    const urgencyLevel = this.calculateUrgency(event.deadline);

    notificationStore.addNotification({
      type: urgencyLevel === 'critical' ? 'error' : 'warning',
      title: 'Deadline Approaching',
      message: `"${event.task.title}" is due ${event.timeUntilDeadline}`,
      persistent: urgencyLevel === 'critical',
      actions: [
        {
          label: 'View Task',
          action: () => navigate(`/tasks/${event.task.id}`)
        },
        {
          label: 'Extend Deadline',
          action: () => this.openExtendDeadlineModal(event.task.id)
        }
      ]
    });
  };

  private async initializeWebSocket(context: PluginContext): Promise<void> {
    const user = context.auth.getCurrentUser();
    if (!user) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL}/notifications?userId=${user.id}`;

    this.webSocketConnection = new WebSocket(wsUrl);

    this.webSocketConnection.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      const notificationStore = useNotificationStore.getState();
      notificationStore.addRealTimeNotification(notification);
    };

    this.webSocketConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.webSocketConnection.onclose = () => {
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        this.initializeWebSocket(context);
      }, 5000);
    };
  }

  private async loadNotificationPreferences(context: PluginContext): Promise<void> {
    try {
      const user = context.auth.getCurrentUser();
      if (!user) return;

      const preferences = await notificationService.getUserPreferences(user.id);
      const notificationStore = useNotificationStore.getState();
      notificationStore.setPreferences(preferences);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  private calculateUrgency(deadline: Date): 'normal' | 'warning' | 'critical' {
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 2) return 'critical';
    if (hoursUntilDeadline <= 24) return 'warning';
    return 'normal';
  }

  private openExtendDeadlineModal(taskId: string): void {
    const uiStore = useUIStore.getState();
    uiStore.openModal('extend-deadline', { taskId });
  }
}
```

### Notification Store

```typescript
// src/plugins/NotificationSystem/stores/notificationStore.ts
interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'mention';
  title: string;
  message: string;
  read: boolean;
  persistent: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

interface NotificationAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'default';
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  addRealTimeNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearExpiredNotifications: () => void;
  loadUnreadNotifications: (userId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  setPreferences: (preferences: NotificationPreferences) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: null,
  loading: false,

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      read: false
    };

    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));

    // Show browser notification if permissions granted
    get().showBrowserNotification(notification);

    // Auto-remove non-persistent notifications after 10 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, 10000);
    }

    // Emit event for other plugins
    eventBus.emit('NOTIFICATION_ADDED', { notification });
  },

  addRealTimeNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1
    }));

    if (!notification.read) {
      get().showBrowserNotification(notification);
    }
  },

  markAsRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id)?.read ? 0 : 1))
    }));

    // Update on server
    notificationService.markAsRead(id);
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));

    // Update on server
    notificationService.markAllAsRead();
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)
    }));
  },

  clearExpiredNotifications: () => {
    const now = new Date();
    set(state => ({
      notifications: state.notifications.filter(n =>
        !n.expiresAt || n.expiresAt > now
      )
    }));
  },

  loadUnreadNotifications: async (userId: string) => {
    set({ loading: true });

    try {
      const notifications = await notificationService.getUnreadNotifications(userId);
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load notifications:', error);
    }
  },

  updatePreferences: async (newPreferences: Partial<NotificationPreferences>) => {
    const state = get();
    const updatedPreferences = { ...state.preferences, ...newPreferences };

    try {
      await notificationService.updatePreferences(updatedPreferences);
      set({ preferences: updatedPreferences });
    } catch (error) {
      throw error;
    }
  },

  setPreferences: (preferences: NotificationPreferences) => {
    set({ preferences });
  },

  // Private helper method
  showBrowserNotification: (notification: Notification) => {
    const state = get();

    if (!state.preferences?.pushNotifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id
    });
  }
}));

// Auto-cleanup expired notifications every minute
setInterval(() => {
  useNotificationStore.getState().clearExpiredNotifications();
}, 60000);
```

## 📁 File Management Plugin

Complete file management system with upload, organization, and sharing capabilities.

### Plugin Implementation

```typescript
// src/plugins/FileManagement/FileManagementPlugin.ts
export class FileManagementPlugin implements Plugin {
  name = 'FileManagement';
  version = '1.3.0';
  description = 'File upload, storage, and organization';

  async activate(context: PluginContext): Promise<void> {
    // Register routes
    context.registerRoute('/files', FileManagerPage);
    context.registerRoute('/files/shared', SharedFilesPage);
    context.registerRoute('/files/trash', TrashPage);

    // Register navigation
    context.registerNavItem({
      key: 'files',
      path: '/files',
      label: 'Files',
      icon: 'FolderOutlined',
      order: 5
    });

    // Subscribe to events
    context.eventBus.subscribe('FILE_UPLOADED', this.handleFileUploaded);
    context.eventBus.subscribe('PROJECT_CREATED', this.createProjectFolder);
    context.eventBus.subscribe('USER_ADDED_TO_PROJECT', this.grantProjectFileAccess);

    // Register file preview handlers
    this.registerFilePreviewHandlers(context);

    // Initialize file system
    await this.initializeFileSystem(context);
  }

  private handleFileUploaded = (event: FileUploadedEvent) => {
    const fileStore = useFileStore.getState();
    fileStore.addFile(event.file);

    // Index file for search
    fileSearchService.indexFile(event.file);

    // Generate thumbnail if it's an image
    if (event.file.type.startsWith('image/')) {
      thumbnailService.generateThumbnail(event.file);
    }
  };

  private createProjectFolder = async (event: ProjectCreatedEvent) => {
    const fileStore = useFileStore.getState();

    await fileStore.createFolder({
      name: event.project.name,
      parentId: 'projects',
      projectId: event.project.id,
      permissions: {
        read: event.project.members.map(m => m.id),
        write: [event.project.ownerId],
        admin: [event.project.ownerId]
      }
    });
  };

  private grantProjectFileAccess = (event: UserAddedToProjectEvent) => {
    // Grant access to project files
    filePermissionService.grantProjectAccess(event.userId, event.projectId);
  };

  private registerFilePreviewHandlers(context: PluginContext): void {
    const previewManager = new FilePreviewManager();

    // Register preview handlers for different file types
    previewManager.registerHandler('image', ImagePreviewHandler);
    previewManager.registerHandler('video', VideoPreviewHandler);
    previewManager.registerHandler('audio', AudioPreviewHandler);
    previewManager.registerHandler('pdf', PDFPreviewHandler);
    previewManager.registerHandler('text', TextPreviewHandler);
    previewManager.registerHandler('code', CodePreviewHandler);

    context.registerService('filePreviewManager', previewManager);
  }

  private async initializeFileSystem(context: PluginContext): Promise<void> {
    const fileStore = useFileStore.getState();

    // Create default folder structure
    await fileStore.createDefaultFolders();

    // Load user's files
    const user = context.auth.getCurrentUser();
    if (user) {
      await fileStore.loadUserFiles(user.id);
    }
  }
}
```

### File Store

```typescript
// src/plugins/FileManagement/stores/fileStore.ts
interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  parentId: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: FilePermissions;
  metadata: FileMetadata;
  isFolder: boolean;
  isShared: boolean;
  isTrashed: boolean;
}

interface FilePermissions {
  read: string[];
  write: string[];
  admin: string[];
}

interface FileMetadata {
  dimensions?: { width: number; height: number };
  duration?: number;
  encoding?: string;
  tags?: string[];
  description?: string;
}

interface FileState {
  files: FileItem[];
  currentFolder: string | null;
  selectedFiles: string[];
  uploadProgress: Record<string, number>;
  loading: boolean;
  error: string | null;

  // View options
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';

  // Actions
  loadFiles: (folderId?: string) => Promise<void>;
  uploadFiles: (files: File[], folderId?: string) => Promise<void>;
  createFolder: (folder: CreateFolderRequest) => Promise<FileItem>;
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<void>;
  copyFiles: (fileIds: string[], targetFolderId: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  shareFiles: (fileIds: string[], shareConfig: ShareConfig) => Promise<void>;
  searchFiles: (query: string) => Promise<FileItem[]>;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSorting: (sortBy: string, order: 'asc' | 'desc') => void;
  selectFiles: (fileIds: string[]) => void;
  clearSelection: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  currentFolder: null,
  selectedFiles: [],
  uploadProgress: {},
  loading: false,
  error: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',

  loadFiles: async (folderId?: string) => {
    set({ loading: true, error: null });

    try {
      const files = await fileService.getFiles(folderId);
      set({
        files,
        currentFolder: folderId || null,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  uploadFiles: async (files: File[], folderId?: string) => {
    const uploadPromises = files.map(async (file) => {
      const fileId = `upload-${Date.now()}-${Math.random()}`;

      // Initialize progress tracking
      set(state => ({
        uploadProgress: { ...state.uploadProgress, [fileId]: 0 }
      }));

      try {
        const uploadedFile = await fileService.uploadFile(file, {
          parentId: folderId,
          onProgress: (progress) => {
            set(state => ({
              uploadProgress: { ...state.uploadProgress, [fileId]: progress }
            }));
          }
        });

        // Add to files list
        set(state => ({
          files: [...state.files, uploadedFile],
          uploadProgress: { ...state.uploadProgress, [fileId]: 100 }
        }));

        // Emit event
        eventBus.emit('FILE_UPLOADED', { file: uploadedFile });

        return uploadedFile;
      } catch (error) {
        // Remove from progress tracking
        set(state => {
          const { [fileId]: removed, ...remaining } = state.uploadProgress;
          return { uploadProgress: remaining };
        });
        throw error;
      }
    });

    await Promise.all(uploadPromises);

    // Clear progress tracking after a delay
    setTimeout(() => {
      set({ uploadProgress: {} });
    }, 2000);
  },

  createFolder: async (folderData: CreateFolderRequest) => {
    try {
      const newFolder = await fileService.createFolder(folderData);

      set(state => ({
        files: [...state.files, newFolder]
      }));

      eventBus.emit('FOLDER_CREATED', { folder: newFolder });
      return newFolder;
    } catch (error) {
      throw error;
    }
  },

  moveFiles: async (fileIds: string[], targetFolderId: string) => {
    try {
      await fileService.moveFiles(fileIds, targetFolderId);

      // Remove moved files from current view
      set(state => ({
        files: state.files.filter(file => !fileIds.includes(file.id)),
        selectedFiles: []
      }));

      eventBus.emit('FILES_MOVED', { fileIds, targetFolderId });
    } catch (error) {
      throw error;
    }
  },

  copyFiles: async (fileIds: string[], targetFolderId: string) => {
    try {
      const copiedFiles = await fileService.copyFiles(fileIds, targetFolderId);

      eventBus.emit('FILES_COPIED', { originalIds: fileIds, copiedFiles });
    } catch (error) {
      throw error;
    }
  },

  deleteFiles: async (fileIds: string[]) => {
    try {
      await fileService.deleteFiles(fileIds);

      set(state => ({
        files: state.files.filter(file => !fileIds.includes(file.id)),
        selectedFiles: []
      }));

      eventBus.emit('FILES_DELETED', { fileIds });
    } catch (error) {
      throw error;
    }
  },

  shareFiles: async (fileIds: string[], shareConfig: ShareConfig) => {
    try {
      const shareLinks = await fileService.shareFiles(fileIds, shareConfig);

      eventBus.emit('FILES_SHARED', { fileIds, shareLinks });
      return shareLinks;
    } catch (error) {
      throw error;
    }
  },

  searchFiles: async (query: string) => {
    try {
      const results = await fileService.searchFiles(query);
      return results;
    } catch (error) {
      throw error;
    }
  },

  setViewMode: (mode: 'grid' | 'list') => {
    set({ viewMode: mode });
    localStorage.setItem('fileViewMode', mode);
  },

  setSorting: (sortBy: string, order: 'asc' | 'desc') => {
    set({ sortBy, sortOrder: order });

    // Re-sort current files
    const state = get();
    const sortedFiles = sortFiles(state.files, sortBy, order);
    set({ files: sortedFiles });
  },

  selectFiles: (fileIds: string[]) => {
    set({ selectedFiles: fileIds });
  },

  clearSelection: () => {
    set({ selectedFiles: [] });
  }
}));

// Helper function to sort files
const sortFiles = (files: FileItem[], sortBy: string, order: 'asc' | 'desc'): FileItem[] => {
  return [...files].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};
```

## 💰 Payment Processing Plugin

Comprehensive payment and subscription management system.

### Plugin Implementation

```typescript
// src/plugins/PaymentProcessing/PaymentProcessingPlugin.ts
export class PaymentProcessingPlugin implements Plugin {
  name = 'PaymentProcessing';
  version = '2.1.0';
  description = 'Payment processing and subscription management';
  dependencies = ['UserManagement'];

  async activate(context: PluginContext): Promise<void> {
    // Register routes
    context.registerRoute('/billing', BillingPage);
    context.registerRoute('/billing/history', PaymentHistoryPage);
    context.registerRoute('/billing/plans', SubscriptionPlansPage);

    // Register navigation
    context.registerNavItem({
      key: 'billing',
      path: '/billing',
      label: 'Billing',
      icon: 'CreditCardOutlined',
      order: 8,
      permissions: ['billing.view']
    });

    // Subscribe to events
    context.eventBus.subscribe('USER_CREATED', this.handleUserCreated);
    context.eventBus.subscribe('SUBSCRIPTION_CANCELED', this.handleSubscriptionCanceled);
    context.eventBus.subscribe('PAYMENT_FAILED', this.handlePaymentFailed);

    // Initialize payment providers
    await this.initializePaymentProviders(context);

    // Load billing data for current user
    await this.loadBillingData(context);
  }

  private handleUserCreated = async (event: UserCreatedEvent) => {
    // Create billing profile for new user
    const billingStore = useBillingStore.getState();
    await billingStore.createBillingProfile(event.user.id);
  };

  private handleSubscriptionCanceled = (event: SubscriptionCanceledEvent) => {
    // Update user permissions
    eventBus.emit('USER_PERMISSIONS_CHANGED', {
      userId: event.userId,
      changes: { subscription: 'free' }
    });

    // Send cancellation confirmation email
    emailService.sendSubscriptionCancellationEmail(event.userId);
  };

  private handlePaymentFailed = (event: PaymentFailedEvent) => {
    // Notify user about failed payment
    const notificationStore = useNotificationStore.getState();
    notificationStore.addNotification({
      type: 'error',
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please update your payment method.',
      persistent: true,
      actions: [
        {
          label: 'Update Payment Method',
          action: () => navigate('/billing')
        }
      ]
    });

    // Update subscription status
    const billingStore = useBillingStore.getState();
    billingStore.updateSubscriptionStatus(event.subscriptionId, 'payment_failed');
  };

  private async initializePaymentProviders(context: PluginContext): Promise<void> {
    // Initialize Stripe
    const stripeProvider = new StripePaymentProvider({
      publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
    });

    // Initialize PayPal (if enabled)
    if (process.env.REACT_APP_PAYPAL_CLIENT_ID) {
      const paypalProvider = new PayPalPaymentProvider({
        clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID
      });
    }

    // Register providers
    const paymentManager = new PaymentManager();
    paymentManager.registerProvider('stripe', stripeProvider);
    paymentManager.registerProvider('paypal', paypalProvider);

    context.registerService('paymentManager', paymentManager);
  }

  private async loadBillingData(context: PluginContext): Promise<void> {
    const user = context.auth.getCurrentUser();
    if (!user) return;

    const billingStore = useBillingStore.getState();
    await billingStore.loadBillingData(user.id);
  }
}
```

## 🎨 Best Practices Summary

### 1. Plugin Design Principles
- **Single Responsibility** - Each plugin should focus on one domain
- **Event-Driven Communication** - Use events instead of direct dependencies
- **Consistent Structure** - Follow the established folder and naming conventions
- **Error Handling** - Implement comprehensive error handling and user feedback

### 2. State Management
- **Zustand Stores** - Use for plugin-specific state
- **Event Integration** - Emit events when state changes
- **Performance** - Use selectors to prevent unnecessary re-renders
- **Persistence** - Consider which state should survive page reloads

### 3. Component Development
- **Ant Design** - Use Ant Design components for consistency
- **Responsive Design** - Ensure components work on all screen sizes
- **Accessibility** - Follow accessibility best practices
- **Testing** - Write tests for all components

### 4. API Integration
- **Service Layer** - Abstract API calls into service classes
- **Error Handling** - Handle network errors gracefully
- **Caching** - Implement intelligent caching strategies
- **Type Safety** - Use TypeScript for all API interfaces

---

These examples demonstrate the power and flexibility of the plugin architecture. Each plugin is self-contained yet integrates seamlessly with the core framework and other plugins through the event system.

## 📚 Next Steps

Continue your plugin development journey:

1. **[State Management](./state-management.md)** - Advanced store patterns and best practices
2. **[Event Bus](./event-bus.md)** - Master event-driven communication
3. **[Testing](./testing.md)** - Comprehensive testing strategies for plugins
4. **[CLI Reference](./cli-reference.md)** - Code generation tools and commands

**Start building amazing plugins!** 🚀