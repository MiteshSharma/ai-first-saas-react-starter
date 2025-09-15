/**
 * @fileoverview EventBus Test Suite
 * Comprehensive tests for the EventBus core functionality
 */

import { EventBus, PluginEvent } from '../EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.clearHistory();
  });

  describe('Event Emission', () => {
    it('should emit events with correct structure', () => {
      const mockListener = jest.fn();
      eventBus.on('test.event', mockListener);

      const testPayload = { data: 'test' };
      eventBus.emit('test.event', testPayload, 'TestSource');

      expect(mockListener).toHaveBeenCalledTimes(1);
      const calledEvent = mockListener.mock.calls[0][0];
      expect(calledEvent).toMatchObject({
        type: 'test.event',
        payload: testPayload,
        metadata: expect.objectContaining({
          source: 'TestSource',
          timestamp: expect.any(Date),
          correlationId: expect.any(String)
        })
      });
    });

    it('should emit events to multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventBus.on('test.event', listener1);
      eventBus.on('test.event', listener2);

      eventBus.emit('test.event', { data: 'test' }, 'TestSource');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in listeners gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalListener = jest.fn();
      const errorBusListener = jest.fn();

      eventBus.on('test.event', errorListener);
      eventBus.on('test.event', normalListener);
      eventBus.on('eventbus.error', errorBusListener);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      eventBus.emit('test.event', { data: 'test' }, 'TestSource');

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(normalListener).toHaveBeenCalledTimes(1);
      expect(errorBusListener).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Event Listeners', () => {
    it('should register and unregister listeners', () => {
      const listener = jest.fn();
      const unsubscribe = eventBus.on('test.event', listener);

      eventBus.emit('test.event', {}, 'TestSource');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventBus.emit('test.event', {}, 'TestSource');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should remove specific listeners with off method', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventBus.on('test.event', listener1);
      eventBus.on('test.event', listener2);

      eventBus.off('test.event', listener1);
      eventBus.emit('test.event', {}, 'TestSource');

      expect(listener1).toHaveBeenCalledTimes(0);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return correct listeners for event types', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventBus.on('test.event', listener1);
      eventBus.on('other.event', listener2);

      const testEventListeners = eventBus.getListenersForEvent('test.event');
      const otherEventListeners = eventBus.getListenersForEvent('other.event');
      const noEventListeners = eventBus.getListenersForEvent('nonexistent.event');

      expect(testEventListeners).toHaveLength(1);
      expect(testEventListeners[0]).toBe(listener1);
      expect(otherEventListeners).toHaveLength(1);
      expect(otherEventListeners[0]).toBe(listener2);
      expect(noEventListeners).toHaveLength(0);
    });
  });

  describe('Event History', () => {
    it('should store event history', () => {
      eventBus.emit('event1', { data: 1 }, 'Source1');
      eventBus.emit('event2', { data: 2 }, 'Source2');

      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('event1');
      expect(history[1].type).toBe('event2');
    });

    it('should limit history size to prevent memory leaks', () => {
      // Emit more than maxHistorySize events (1000)
      for (let i = 0; i < 1001; i++) {
        eventBus.emit('test.event', { index: i }, 'TestSource');
      }

      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(1000);
      expect(history[0].payload.index).toBe(1); // First event should be removed
    });

    it('should clear event history', () => {
      eventBus.emit('test.event', {}, 'TestSource');
      expect(eventBus.getEventHistory()).toHaveLength(1);

      eventBus.clearHistory();
      expect(eventBus.getEventHistory()).toHaveLength(0);
    });

    it('should return immutable event history', () => {
      eventBus.emit('test.event', {}, 'TestSource');
      const history1 = eventBus.getEventHistory();
      const history2 = eventBus.getEventHistory();

      expect(history1).not.toBe(history2); // Should be different objects
      expect(history1).toEqual(history2); // But with same content
    });
  });

  describe('Analytics', () => {
    it('should provide correct analytics', () => {
      eventBus.emit('event1', {}, 'Source1');
      eventBus.emit('event1', {}, 'Source1');
      eventBus.emit('event2', {}, 'Source2');

      const analytics = eventBus.getAnalytics();

      expect(analytics.totalEvents).toBe(3);
      expect(analytics.eventTypes).toEqual({
        event1: 2,
        event2: 1
      });
      expect(analytics.sources).toEqual({
        Source1: 2,
        Source2: 1
      });
      expect(analytics.oldestEvent).toBeInstanceOf(Date);
      expect(analytics.newestEvent).toBeInstanceOf(Date);
    });

    it('should return correct analytics for empty history', () => {
      const analytics = eventBus.getAnalytics();

      expect(analytics.totalEvents).toBe(0);
      expect(analytics.eventTypes).toEqual({});
      expect(analytics.sources).toEqual({});
      expect(analytics.oldestEvent).toBeUndefined();
      expect(analytics.newestEvent).toBeUndefined();
    });
  });

  describe('Correlation ID Generation', () => {
    it('should generate unique correlation IDs', () => {
      const listener = jest.fn();
      eventBus.on('test.event', listener);

      eventBus.emit('test.event', {}, 'TestSource');
      eventBus.emit('test.event', {}, 'TestSource');

      const event1 = listener.mock.calls[0][0];
      const event2 = listener.mock.calls[1][0];

      expect(event1.metadata.correlationId).toBeDefined();
      expect(event2.metadata.correlationId).toBeDefined();
      expect(event1.metadata.correlationId).not.toBe(event2.metadata.correlationId);
    });
  });
});