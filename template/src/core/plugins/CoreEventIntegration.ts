import { EventBus } from './EventBus';
import { AUTH_EVENTS, TENANT_EVENTS, DATA_EVENTS, SYSTEM_EVENTS, type AuthLoginPayload, type AuthLogoutPayload, type TenantSwitchPayload } from './coreEvents';
import { logger } from '../utils/logger';
import type { AuthState, AuthActions } from '../auth/types';
import type { TenantState, TenantActions, Tenant } from '../stores/tenant/types';

/**
 * CoreEventIntegration connects core framework stores to the Event Bus
 * This allows plugins to listen for core state changes via events
 */
export class CoreEventIntegration {
  private eventBus: EventBus;
  private unsubscribers: (() => void)[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Integrate AuthStore with Event Bus
   * Emits events when authentication state changes
   */
  integrateAuthStore(authStore: AuthState & AuthActions & { subscribe: (callback: (state: AuthState) => void) => () => void; getState: () => AuthState }): void {
    logger.info('🔌 Integrating AuthStore with Event Bus...', 'CoreEventIntegration');

    // Store the original subscribe method
    const originalSubscribe = authStore.subscribe.bind(authStore);
    let previousState = authStore.getState();

    // Subscribe to auth store changes
    const unsubscribe = originalSubscribe((currentState: AuthState) => {
      // Check for login event
      if (currentState.user && !previousState.user) {
        const loginPayload: AuthLoginPayload = {
          user: {
            id: currentState.user.id,
            email: currentState.user.email,
            name: currentState.user.name || currentState.user.email,
          },
          token: currentState.token || '',
        };

        logger.info('🔐 Emitting AUTH_LOGIN event', 'CoreEventIntegration', loginPayload);
        this.eventBus.emit(AUTH_EVENTS.USER_LOGIN, loginPayload, 'CoreAuth');
      }

      // Check for logout event
      if (!currentState.user && previousState.user) {
        const logoutPayload: AuthLogoutPayload = {
          user: {
            id: previousState.user.id,
            email: previousState.user.email,
            name: previousState.user.name || previousState.user.email,
          },
          reason: 'user_action', // Could be 'session_expired', 'user_action', etc.
        };

        logger.info('🔐 Emitting AUTH_LOGOUT event', 'CoreEventIntegration', logoutPayload);
        this.eventBus.emit(AUTH_EVENTS.USER_LOGOUT, logoutPayload, 'CoreAuth');
      }

      // Check for profile updates
      if (currentState.user && previousState.user &&
          (currentState.user.name !== previousState.user.name ||
           currentState.user.email !== previousState.user.email)) {
        logger.info('🔐 Emitting USER_PROFILE_UPDATE event', 'CoreEventIntegration');
        this.eventBus.emit(AUTH_EVENTS.USER_PROFILE_UPDATE, {
          user: currentState.user,
          previousUser: previousState.user,
        }, 'CoreAuth');
      }

      previousState = currentState;
    });

    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Integrate TenantStore with Event Bus
   * Emits events when tenant/workspace state changes
   */
  integrateTenantStore(tenantStore: TenantState & TenantActions & { subscribe: (callback: (state: TenantState) => void) => () => void; getState: () => TenantState }): void {
    logger.info('🏢 Integrating TenantStore with Event Bus...', 'CoreEventIntegration');

    const originalSubscribe = tenantStore.subscribe.bind(tenantStore);
    let previousState = tenantStore.getState();

    const unsubscribe = originalSubscribe((currentState: TenantState) => {
      // Check for tenant switch
      if (currentState.currentTenant?.id !== previousState.currentTenant?.id) {
        const switchPayload: TenantSwitchPayload = {
          oldTenant: previousState.currentTenant,
          newTenant: currentState.currentTenant,
          oldTenantId: previousState.currentTenant?.id,
          newTenantId: currentState.currentTenant?.id,
        };

        logger.info('🏢 Emitting TENANT_SWITCHED event', 'CoreEventIntegration', switchPayload);
        this.eventBus.emit(TENANT_EVENTS.TENANT_SWITCHED, switchPayload, 'CoreTenant');
      }

      // Check for workspace switch
      if (currentState.currentWorkspace?.id !== previousState.currentWorkspace?.id) {
        logger.info('🏢 Emitting WORKSPACE_SWITCHED event', 'CoreEventIntegration');
        this.eventBus.emit(TENANT_EVENTS.WORKSPACE_SWITCHED, {
          oldWorkspace: previousState.currentWorkspace,
          newWorkspace: currentState.currentWorkspace,
        }, 'CoreTenant');
      }

      // Check for tenant creation
      if (currentState.tenants.length > previousState.tenants.length) {
        const newTenant = currentState.tenants.find((tenant: Tenant) =>
          !previousState.tenants.some((prevTenant: Tenant) => prevTenant.id === tenant.id)
        );

        if (newTenant) {
          logger.info('🏢 Emitting TENANT_CREATED event', 'CoreEventIntegration', newTenant);
          this.eventBus.emit(TENANT_EVENTS.TENANT_CREATED, {
            tenant: newTenant,
          }, 'CoreTenant');
        }
      }

      previousState = currentState;
    });

    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Set up core event listeners that respond to events and update stores
   */
  setupCoreEventListeners(): void {
    logger.info('🎯 Setting up core event listeners...', 'CoreEventIntegration');

    // Listen for logout events and trigger data clearing
    const logoutUnsubscribe = this.eventBus.on(AUTH_EVENTS.USER_LOGOUT, (event) => {
      logger.info('🔄 Handling logout event - clearing plugin data', 'CoreEventIntegration');

      // Emit data refresh event to clear all plugin data
      this.eventBus.emit(DATA_EVENTS.DATA_REFRESH, {
        type: 'all',
        reason: 'logout',
        clear: true,
      }, 'CoreEventIntegration');
    });

    // Listen for tenant switch events and trigger data refresh
    const tenantSwitchUnsubscribe = this.eventBus.on(TENANT_EVENTS.TENANT_SWITCHED, (event) => {
      logger.info('🔄 Handling tenant switch - refreshing plugin data', 'CoreEventIntegration');

      // Emit data refresh event for new tenant
      this.eventBus.emit(DATA_EVENTS.DATA_REFRESH, {
        type: 'all',
        reason: 'tenant_switch',
        tenantId: (event.payload as TenantSwitchPayload).newTenantId,
      }, 'CoreEventIntegration');
    });

    this.unsubscribers.push(logoutUnsubscribe, tenantSwitchUnsubscribe);
  }

  /**
   * Initialize the integration with all core stores
   */
  initialize(stores: {
    auth?: AuthState & AuthActions & { subscribe: (callback: (state: AuthState) => void) => () => void; getState: () => AuthState };
    tenant?: TenantState & TenantActions & { subscribe: (callback: (state: TenantState) => void) => () => void; getState: () => TenantState }
  }): void {
    logger.info('🚀 Initializing Core Event Integration...', 'CoreEventIntegration');

    if (stores.auth) {
      this.integrateAuthStore(stores.auth);
    }

    if (stores.tenant) {
      this.integrateTenantStore(stores.tenant);
    }

    this.setupCoreEventListeners();

    // Emit system ready event
    this.eventBus.emit(SYSTEM_EVENTS.CORE_READY, {
      timestamp: new Date(),
      stores: Object.keys(stores),
    }, 'CoreEventIntegration');

    logger.info('✅ Core Event Integration initialized successfully', 'CoreEventIntegration');
  }

  /**
   * Clean up all event listeners
   */
  destroy(): void {
    logger.info('🧹 Cleaning up Core Event Integration...', 'CoreEventIntegration');
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  /**
   * Get integration analytics
   */
  getAnalytics() {
    return {
      activeSubscriptions: this.unsubscribers.length,
      eventBusHistory: this.eventBus.getEventHistory().length,
      coreEventsEmitted: this.eventBus.getEventHistory().filter(
        event => event.metadata.source.startsWith('Core')
      ).length,
    };
  }
}