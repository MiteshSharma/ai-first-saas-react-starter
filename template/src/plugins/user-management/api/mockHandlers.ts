/**
 * @fileoverview User Management Mock API Handlers
 *
 * Mock implementations for user management API endpoints
 */

import {
  UserWithTenantInfo,
  UserListResponse,
  UserSearchFilters,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  UserPreferences,
  TENANT_ROLES,
  WORKSPACE_ROLES,
} from '../types';

class UserManagementMockHandlers {
  private static users: UserWithTenantInfo[] = [];
  private static userPreferences: Map<string, UserPreferences> = new Map();
  private static initialized = false;

  private static initializeData() {
    if (!this.initialized) {
      this.generateMockUsers();
      this.generateMockPreferences();
      this.initialized = true;
    }
  }

  private static generateMockUsers(): void {
    this.users = [
      {
        id: 'user-1',
        email: 'john.doe@example.com',
        emailVerified: true,
        status: 'active',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
          timezone: 'America/New_York',
          locale: 'en-US',
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-09-18T16:30:00Z',
        tenantRole: TENANT_ROLES.ADMIN,
        workspaceRoles: [
          { workspaceId: 'ws-1', role: WORKSPACE_ROLES.ADMIN },
          { workspaceId: 'ws-2', role: WORKSPACE_ROLES.MEMBER },
        ],
        lastLogin: '2024-09-18T15:30:00Z',
        permissions: ['user.read', 'user.write', 'tenant.read', 'workspace.admin'],
      },
      {
        id: 'user-2',
        email: 'jane.smith@example.com',
        emailVerified: true,
        status: 'active',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
          timezone: 'America/Los_Angeles',
          locale: 'en-US',
        },
        createdAt: '2024-02-20T14:30:00Z',
        updatedAt: '2024-09-18T14:00:00Z',
        tenantRole: TENANT_ROLES.MEMBER,
        workspaceRoles: [
          { workspaceId: 'ws-1', role: WORKSPACE_ROLES.MEMBER },
        ],
        lastLogin: '2024-09-18T14:00:00Z',
        permissions: ['user.read', 'workspace.read'],
      },
      {
        id: 'user-3',
        email: 'bob.wilson@example.com',
        emailVerified: false,
        status: 'inactive',
        profile: {
          firstName: 'Bob',
          lastName: 'Wilson',
          displayName: 'Bob Wilson',
          timezone: 'Europe/London',
          locale: 'en-GB',
        },
        createdAt: '2024-03-10T09:15:00Z',
        updatedAt: '2024-09-15T12:45:00Z',
        tenantRole: TENANT_ROLES.GUEST,
        workspaceRoles: [
          { workspaceId: 'ws-2', role: WORKSPACE_ROLES.VIEWER },
        ],
        lastLogin: '2024-09-15T12:45:00Z',
        permissions: ['workspace.read'],
      }
    ];
  }

  private static generateMockPreferences(): void {
    // Default preferences for user-1
    this.userPreferences.set('user-1', {
      theme: 'light',
      language: 'en-US',
      timezone: 'America/New_York',
      notifications: {
        email: {
          invitations: true,
          updates: true,
          security: true,
          marketing: false,
        },
        inApp: {
          mentions: true,
          updates: true,
          security: true,
        },
      },
      dashboard: {
        layout: 'grid',
        defaultWorkspace: 'ws-1',
        widgets: ['recent-activity', 'quick-stats', 'notifications'],
      },
    });

    // Default preferences for user-2
    this.userPreferences.set('user-2', {
      theme: 'dark',
      language: 'en-US',
      timezone: 'America/Los_Angeles',
      notifications: {
        email: {
          invitations: true,
          updates: false,
          security: true,
          marketing: false,
        },
        inApp: {
          mentions: true,
          updates: false,
          security: true,
        },
      },
      dashboard: {
        layout: 'list',
        widgets: ['recent-activity', 'notifications'],
      },
    });
  }

  // Simulate network delay
  private static async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
  }

  // ============================================================================
  // User Management Operations
  // ============================================================================

  static async getUsers(tenantId: string, filters?: UserSearchFilters): Promise<UserListResponse> {
    this.initializeData();
    await this.delay();

    let filteredUsers = [...this.users];

    // Apply filters
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        user.profile.firstName.toLowerCase().includes(searchTerm) ||
        user.profile.lastName.toLowerCase().includes(searchTerm) ||
        user.profile.displayName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    if (filters?.role) {
      filteredUsers = filteredUsers.filter(user => user.tenantRole === filters.role);
    }

    return {
      users: filteredUsers,
      total: filteredUsers.length,
      page: 1,
      limit: 50,
      filters: filters || {},
    };
  }

  static async getUserById(userId: string): Promise<UserWithTenantInfo | null> {
    this.initializeData();
    await this.delay();

    return this.users.find(user => user.id === userId) || null;
  }

  static async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<void> {
    this.initializeData();
    await this.delay();

    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (data.firstName !== undefined) user.profile.firstName = data.firstName;
      if (data.lastName !== undefined) user.profile.lastName = data.lastName;
      if (data.displayName !== undefined) user.profile.displayName = data.displayName;
      if (data.timezone !== undefined) user.profile.timezone = data.timezone;
      if (data.locale !== undefined) user.profile.locale = data.locale;
      user.updatedAt = new Date().toISOString();
    }
  }

  // ============================================================================
  // User Preferences Operations
  // ============================================================================

  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    this.initializeData();
    await this.delay();

    const preferences = this.userPreferences.get(userId);
    if (preferences) {
      return preferences;
    }

    // Return default preferences if none exist
    const defaultPreferences: UserPreferences = {
      theme: 'light',
      language: 'en-US',
      timezone: 'America/New_York',
      notifications: {
        email: {
          invitations: true,
          updates: true,
          security: true,
          marketing: false,
        },
        inApp: {
          mentions: true,
          updates: true,
          security: true,
        },
      },
      dashboard: {
        layout: 'grid',
        widgets: ['recent-activity', 'quick-stats'],
      },
    };

    this.userPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  static async updateUserPreferences(userId: string, data: UpdateUserPreferencesRequest): Promise<void> {
    this.initializeData();
    await this.delay();

    const currentPreferences = await this.getUserPreferences(userId);

    const updatedPreferences: UserPreferences = {
      theme: data.theme || currentPreferences.theme,
      language: data.language || currentPreferences.language,
      timezone: data.timezone || currentPreferences.timezone,
      notifications: data.notifications ? {
        email: { ...currentPreferences.notifications.email, ...data.notifications.email },
        inApp: { ...currentPreferences.notifications.inApp, ...data.notifications.inApp }
      } : currentPreferences.notifications,
      dashboard: data.dashboard ? {
        ...currentPreferences.dashboard,
        ...data.dashboard
      } : currentPreferences.dashboard,
    };

    this.userPreferences.set(userId, updatedPreferences);
  }
}

export default UserManagementMockHandlers;