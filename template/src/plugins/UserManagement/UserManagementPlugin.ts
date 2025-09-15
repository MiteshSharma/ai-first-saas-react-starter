/**
 * @fileoverview User Management Plugin
 *
 * Converts user management functionality into a plugin that responds to auth events
 * and provides user-related features through the Event Bus architecture.
 */

import { Plugin, PluginContext, EventListenerConfig, RouteConfig } from '../../core/plugins/pluginTypes';
import { AUTH_EVENTS, TENANT_EVENTS, DATA_EVENTS } from '../../core/plugins/coreEvents';
import { logger } from '../../core/utils/logger';

export class UserManagementPlugin implements Plugin {
  name = 'UserManagement';
  version = '1.0.0';
  description = 'User management, profiles, and authentication features';
  author = 'AI-First SaaS';

  private unsubscribers: (() => void)[] = [];
  private userCache: Map<string, unknown> = new Map();

  async install(context: PluginContext): Promise<void> {
    logger.info(`🔌 Installing ${this.name} plugin v${this.version}`);

    // Initialize user management systems
    this.initializeUserCache();

    logger.info(`✅ ${this.name} plugin installed successfully`);
  }

  async activate(context: PluginContext): Promise<void> {
    logger.info(`🚀 Activating ${this.name} plugin`);

    // Subscribe to authentication events
    const unsubLogin = context.on(AUTH_EVENTS.USER_LOGIN, this.handleUserLogin);
    const unsubLogout = context.on(AUTH_EVENTS.USER_LOGOUT, this.handleUserLogout);
    const unsubProfileUpdate = context.on(AUTH_EVENTS.USER_PROFILE_UPDATE, this.handleProfileUpdate);

    // Subscribe to tenant events for user role management
    const unsubTenantSwitch = context.on(TENANT_EVENTS.TENANT_SWITCHED, this.handleTenantSwitch);

    // Subscribe to data refresh events
    const unsubDataRefresh = context.on(DATA_EVENTS.DATA_REFRESH, this.handleDataRefresh);

    this.unsubscribers.push(
      unsubLogin,
      unsubLogout,
      unsubProfileUpdate,
      unsubTenantSwitch,
      unsubDataRefresh
    );

    // Emit plugin activation event
    context.emit('plugin.userManagement.activated', {
      features: ['profiles', 'authentication', 'user_roles'],
      version: this.version
    });

    logger.info(`✅ ${this.name} plugin activated`);
  }

  async deactivate(): Promise<void> {
    logger.info(`⏸️ Deactivating ${this.name} plugin`);

    // Clean up event listeners
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];

    // Clear user cache
    this.userCache.clear();
  }

  getEventListeners(): EventListenerConfig[] {
    return [
      {
        eventType: AUTH_EVENTS.USER_LOGIN,
        handler: this.handleUserLogin,
        priority: 8 // High priority for user management
      },
      {
        eventType: AUTH_EVENTS.USER_LOGOUT,
        handler: this.handleUserLogout,
        priority: 8
      },
      {
        eventType: AUTH_EVENTS.USER_PROFILE_UPDATE,
        handler: this.handleProfileUpdate,
        priority: 5
      },
      {
        eventType: TENANT_EVENTS.TENANT_SWITCHED,
        handler: this.handleTenantSwitch,
        priority: 6
      },
      {
        eventType: DATA_EVENTS.DATA_REFRESH,
        handler: this.handleDataRefresh,
        priority: 3
      }
    ];
  }

  registerRoutes(context: PluginContext): RouteConfig[] {
    return [
      // Routes would be registered here when the corresponding pages are created
      // Example routes that could be implemented:
      // {
      //   path: '/profile',
      //   component: () => import('../../pages/ProfilePage').then(m => m.default),
      //   requiresAuth: true,
      //   onEnter: () => context.emit('navigation.profile.entered', {})
      // },
      // {
      //   path: '/users',
      //   component: () => import('../../pages/UsersPage').then(m => m.default),
      //   requiresAuth: true,
      //   requiresTenant: true,
      //   onEnter: () => context.emit('navigation.users.entered', {})
      // }
    ];
  }

  // Event handlers
  private handleUserLogin = (event: unknown) => {
    const { user, token } = (event as { payload: { user: { id: string; name: string }; token: string } }).payload;
    logger.info(`👤 UserManagement: User ${user.name} logged in`);

    // Cache user information
    this.userCache.set(user.id, {
      ...user,
      lastLogin: new Date(),
      token
    });

    // Initialize user-specific features
    this.initializeUserFeatures(user);

    // Emit user management events
    // context.emit('user.session.started', {
    //   userId: user.id,
    //   timestamp: new Date()
    // });
  };

  private handleUserLogout = (event: unknown) => {
    const { user } = (event as { payload: { user: { id: string; name: string } } }).payload;
    logger.info(`👤 UserManagement: User ${user.name} logged out`);

    // Clear user from cache
    this.userCache.delete(user.id);

    // Clean up user-specific resources
    this.cleanupUserResources(user);

    // Emit user management events
    // context.emit('user.session.ended', {
    //   userId: user.id,
    //   timestamp: new Date()
    // });
  };

  private handleProfileUpdate = (event: unknown) => {
    const { user, previousUser } = (event as { payload: { user: { id: string; name: string }; previousUser: unknown } }).payload;
    logger.info(`👤 UserManagement: Profile updated for ${user.name}`);

    // Update user cache
    if (this.userCache.has(user.id)) {
      const cached = this.userCache.get(user.id);
      const cachedData = (cached && typeof cached === 'object') ? cached as Record<string, unknown> : {};
      this.userCache.set(user.id, { ...cachedData, ...user });
    }

    // Handle profile change notifications
    this.handleProfileChangeNotifications(user, previousUser);
  };

  private handleTenantSwitch = (event: unknown) => {
    const { oldTenant, newTenant, oldTenantId, newTenantId } = (event as { payload: { oldTenant?: { name: string }; newTenant?: { name: string }; oldTenantId: string; newTenantId: string } }).payload;
    logger.info(`👤 UserManagement: Tenant switched from ${oldTenant?.name} to ${newTenant?.name}`);

    // Update user context for new tenant
    this.updateUserTenantContext(newTenantId, oldTenantId);

    // Load tenant-specific user roles and permissions
    // context.emit('user.tenant.context.updated', {
    //   oldTenantId,
    //   newTenantId,
    //   timestamp: new Date()
    // });
  };

  private handleDataRefresh = (event: unknown) => {
    const { type, reason, clear } = (event as { payload: { type: string; reason: string; clear: boolean } }).payload;
    logger.info(`👤 UserManagement: Data refresh - ${type}, reason: ${reason}`);

    if (clear || reason === 'logout') {
      // Clear user cache on logout
      this.userCache.clear();
    } else if (type === 'all' || type === 'users') {
      // Refresh user data
      this.refreshUserData();
    }
  };

  // Private methods
  private initializeUserCache(): void {
    // Initialize user cache from local storage if available
    try {
      const cached = localStorage.getItem('userManagement.cache');
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([key, value]) => {
          this.userCache.set(key, value);
        });
      }
    } catch (error) {
      logger.warn('Failed to load user cache', 'UserManagement', error);
    }
  }

  private initializeUserFeatures(user: unknown): void {
    logger.info(`Initializing features for user: ${(user as { name: string }).name}`);

    // Initialize user-specific features like:
    // - User preferences
    // - Custom dashboards
    // - Notification settings
  }

  private cleanupUserResources(user: unknown): void {
    logger.info(`Cleaning up resources for user: ${(user as { name: string }).name}`);

    // Clean up user-specific resources like:
    // - Active sessions
    // - Cached data
    // - Temporary files
  }

  private handleProfileChangeNotifications(user: unknown, previousUser: unknown): void {
    // Handle notifications for profile changes
    const changes = this.detectProfileChanges(user, previousUser);

    if (changes.length > 0) {
      logger.info(`Profile changes detected`, 'UserManagement', changes);
      // Emit notification events or update UI
    }
  }

  private updateUserTenantContext(newTenantId: string, oldTenantId: string): void {
    // Update user context for new tenant
    // This could include loading new permissions, roles, etc.
    logger.info(`Updating user tenant context: ${oldTenantId} -> ${newTenantId}`);
  }

  private refreshUserData(): void {
    // Refresh cached user data
    logger.info('Refreshing user data cache');
    // This would typically make API calls to refresh user information
  }

  private detectProfileChanges(user: unknown, previousUser: unknown): string[] {
    const changes: string[] = [];

    const userTyped = user as { name: string; email: string; avatar: string };
    const previousUserTyped = previousUser as { name: string; email: string; avatar: string };

    if (userTyped.name !== previousUserTyped.name) changes.push('name');
    if (userTyped.email !== previousUserTyped.email) changes.push('email');
    if (userTyped.avatar !== previousUserTyped.avatar) changes.push('avatar');

    return changes;
  }

  // Public methods for other plugins to use
  getUserFromCache(userId: string): unknown | undefined {
    return this.userCache.get(userId);
  }

  getAllCachedUsers(): unknown[] {
    return Array.from(this.userCache.values());
  }
}