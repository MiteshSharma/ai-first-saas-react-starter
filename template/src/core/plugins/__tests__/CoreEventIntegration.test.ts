/**
 * @fileoverview Core Event Integration Test Suite
 * Tests for integrating core stores with the EventBus system
 */

import { CoreEventIntegration } from '../CoreEventIntegration';
import { EventBus } from '../EventBus';
import { AUTH_EVENTS, TENANT_EVENTS } from '../coreEvents';

// Mock Zustand store
const createMockStore = (initialState: any) => {
  let state = initialState;
  const listeners: Array<(state: any) => void> = [];

  const mockStore = {
    getState: jest.fn(() => state),
    setState: jest.fn((newState: any) => {
      const prevState = state;
      state = typeof newState === 'function' ? newState(state) : newState;
      listeners.forEach(listener => listener(state, prevState));
    }),
    subscribe: jest.fn((listener: (state: any) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    }),
    destroy: jest.fn(),
    // Simulate zustand's internal subscribe method that provides previous state
    originalSubscribe: (listener: (currentState: any, previousState: any) => void) => {
      return mockStore.subscribe((currentState: any) => {
        listener(currentState, initialState);
      });
    }
  };

  return mockStore;
};

describe('CoreEventIntegration', () => {
  let eventBus: EventBus;
  let coreEventIntegration: CoreEventIntegration;

  beforeEach(() => {
    eventBus = new EventBus();
    coreEventIntegration = new CoreEventIntegration(eventBus);
  });

  describe('Auth Store Integration', () => {
    it('should emit USER_LOGIN event when user logs in', () => {
      const authStore = createMockStore({ user: null, isAuthenticated: false });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateAuthStore(authStore);

      // Simulate login
      authStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        isAuthenticated: true
      });

      expect(eventSpy).toHaveBeenCalledWith(
        AUTH_EVENTS.USER_LOGIN,
        {
          userId: '1',
          email: 'test@example.com',
          name: 'Test User',
          timestamp: expect.any(Date)
        },
        'CoreAuth'
      );
    });

    it('should emit USER_LOGOUT event when user logs out', () => {
      const authStore = createMockStore({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        isAuthenticated: true
      });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateAuthStore(authStore);

      // Simulate logout
      authStore.setState({
        user: null,
        isAuthenticated: false
      });

      expect(eventSpy).toHaveBeenCalledWith(
        AUTH_EVENTS.USER_LOGOUT,
        {
          previousUserId: '1',
          timestamp: expect.any(Date)
        },
        'CoreAuth'
      );
    });

    it('should emit AUTHENTICATION_CHANGED event on auth state change', () => {
      const authStore = createMockStore({ user: null, isAuthenticated: false });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateAuthStore(authStore);

      // Simulate authentication change
      authStore.setState({ isAuthenticated: true });

      expect(eventSpy).toHaveBeenCalledWith(
        AUTH_EVENTS.AUTHENTICATION_CHANGED,
        {
          isAuthenticated: true,
          previousState: false,
          timestamp: expect.any(Date)
        },
        'CoreAuth'
      );
    });

    it('should not emit events for unchanged authentication state', () => {
      const authStore = createMockStore({ user: null, isAuthenticated: false });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateAuthStore(authStore);
      eventSpy.mockClear(); // Clear initial integration events

      // Update state without changing authentication
      authStore.setState({ someOtherField: 'changed' });

      expect(eventSpy).not.toHaveBeenCalledWith(
        AUTH_EVENTS.AUTHENTICATION_CHANGED,
        expect.anything(),
        'CoreAuth'
      );
    });
  });

  describe('Tenant Store Integration', () => {
    it('should emit TENANT_SWITCHED event when tenant changes', () => {
      const tenantStore = createMockStore({
        currentTenant: null,
        tenants: []
      });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateTenantStore(tenantStore);

      // Simulate tenant switch
      const newTenant = { id: 'tenant1', name: 'Test Tenant', domain: 'test.com' };
      tenantStore.setState({
        currentTenant: newTenant,
        tenants: [newTenant]
      });

      expect(eventSpy).toHaveBeenCalledWith(
        TENANT_EVENTS.TENANT_SWITCHED,
        {
          tenantId: 'tenant1',
          tenantName: 'Test Tenant',
          previousTenantId: null,
          timestamp: expect.any(Date)
        },
        'CoreTenant'
      );
    });

    it('should emit TENANT_LOADED event when tenant is first loaded', () => {
      const tenantStore = createMockStore({
        currentTenant: null,
        tenants: [],
        isLoading: true
      });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateTenantStore(tenantStore);

      // Simulate tenant loading completion
      const tenant = { id: 'tenant1', name: 'Test Tenant', domain: 'test.com' };
      tenantStore.setState({
        currentTenant: tenant,
        tenants: [tenant],
        isLoading: false
      });

      expect(eventSpy).toHaveBeenCalledWith(
        TENANT_EVENTS.TENANT_LOADED,
        {
          tenantId: 'tenant1',
          tenantData: tenant,
          timestamp: expect.any(Date)
        },
        'CoreTenant'
      );
    });

    it('should emit TENANTS_LIST_UPDATED event when tenant list changes', () => {
      const tenantStore = createMockStore({
        currentTenant: null,
        tenants: []
      });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateTenantStore(tenantStore);

      // Simulate tenant list update
      const tenants = [
        { id: 'tenant1', name: 'Tenant 1', domain: 'tenant1.com' },
        { id: 'tenant2', name: 'Tenant 2', domain: 'tenant2.com' }
      ];
      tenantStore.setState({ tenants });

      expect(eventSpy).toHaveBeenCalledWith(
        TENANT_EVENTS.TENANTS_LIST_UPDATED,
        {
          tenants,
          count: 2,
          timestamp: expect.any(Date)
        },
        'CoreTenant'
      );
    });

    it('should not emit TENANT_SWITCHED event for same tenant', () => {
      const tenant = { id: 'tenant1', name: 'Test Tenant', domain: 'test.com' };
      const tenantStore = createMockStore({
        currentTenant: tenant,
        tenants: [tenant]
      });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      coreEventIntegration.integrateTenantStore(tenantStore);
      eventSpy.mockClear();

      // Set the same tenant again
      tenantStore.setState({
        currentTenant: tenant,
        tenants: [tenant]
      });

      expect(eventSpy).not.toHaveBeenCalledWith(
        TENANT_EVENTS.TENANT_SWITCHED,
        expect.anything(),
        'CoreTenant'
      );
    });
  });

  describe('Event Bus Error Handling', () => {
    it('should handle eventBus.emit errors gracefully', () => {
      const authStore = createMockStore({ user: null, isAuthenticated: false });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock eventBus.emit to throw an error
      jest.spyOn(eventBus, 'emit').mockImplementation(() => {
        throw new Error('EventBus error');
      });

      expect(() => {
        coreEventIntegration.integrateAuthStore(authStore);
        authStore.setState({ isAuthenticated: true });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to emit auth event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Store Subscription Management', () => {
    it('should return unsubscribe function from auth store integration', () => {
      const authStore = createMockStore({ user: null, isAuthenticated: false });

      const unsubscribe = coreEventIntegration.integrateAuthStore(authStore);

      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should return unsubscribe function from tenant store integration', () => {
      const tenantStore = createMockStore({
        currentTenant: null,
        tenants: []
      });

      const unsubscribe = coreEventIntegration.integrateTenantStore(tenantStore);

      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should stop emitting events after unsubscribing from auth store', () => {
      const authStore = createMockStore({ user: null, isAuthenticated: false });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      const unsubscribe = coreEventIntegration.integrateAuthStore(authStore);
      eventSpy.mockClear();

      // Unsubscribe
      unsubscribe();

      // Try to trigger event
      authStore.setState({ isAuthenticated: true });

      // Should not emit any events (except possibly internal zustand events)
      const authEventCalls = eventSpy.mock.calls.filter(call =>
        call[0].startsWith('auth.') && call[2] === 'CoreAuth'
      );
      expect(authEventCalls).toHaveLength(0);
    });

    it('should stop emitting events after unsubscribing from tenant store', () => {
      const tenantStore = createMockStore({
        currentTenant: null,
        tenants: []
      });
      const eventSpy = jest.spyOn(eventBus, 'emit');

      const unsubscribe = coreEventIntegration.integrateTenantStore(tenantStore);
      eventSpy.mockClear();

      // Unsubscribe
      unsubscribe();

      // Try to trigger event
      const tenant = { id: 'tenant1', name: 'Test Tenant', domain: 'test.com' };
      tenantStore.setState({ currentTenant: tenant });

      // Should not emit any events
      const tenantEventCalls = eventSpy.mock.calls.filter(call =>
        call[0].startsWith('tenant.') && call[2] === 'CoreTenant'
      );
      expect(tenantEventCalls).toHaveLength(0);
    });
  });
});