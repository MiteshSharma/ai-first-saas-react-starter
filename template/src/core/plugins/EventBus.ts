/**
 * @fileoverview Event Bus for inter-plugin communication
 *
 * Provides a flexible event-driven architecture for plugins to communicate
 * without tight coupling. Supports event history, error handling, and debugging.
 */

import { logger } from '../utils/logger';

export interface PluginEvent<T = unknown> {
  type: string;
  payload: T;
  metadata: {
    timestamp: Date;
    source: string;
    correlationId: string;
  };
}

export interface EventListenerConfig<T = unknown> {
  eventType: string;
  handler: (event: PluginEvent<T>) => void | Promise<void>;
  priority?: number; // Higher numbers execute first
}

/**
 * Event Bus implementation for plugin communication
 */
export class EventBus {
  private listeners: Map<string, Array<(event: PluginEvent) => void>> = new Map();
  private eventHistory: PluginEvent[] = [];
  private maxHistorySize: number = 1000; // Prevent memory leaks

  /**
   * Emit an event to all registered listeners
   */
  emit<T = unknown>(eventType: string, payload: T, source: string): void {
    const event: PluginEvent<T> = {
      type: eventType,
      payload,
      metadata: {
        timestamp: new Date(),
        source,
        correlationId: this.generateCorrelationId()
      }
    };

    // Store for debugging/replay (with size limit)
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit to all listeners
    const eventListeners = this.listeners.get(eventType) || [];
    eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error(`Error in event listener for ${eventType}`, 'EventBus', error);
        this.emit('eventbus.error', {
          originalEvent: event,
          error: error instanceof Error ? error.message : String(error)
        }, 'EventBus');
      }
    });
  }

  /**
   * Register an event listener
   * @returns Unsubscribe function
   */
  on(eventType: string, listener: (event: PluginEvent) => void): () => void {
    const eventListeners = this.listeners.get(eventType) || [];
    eventListeners.push(listener);
    this.listeners.set(eventType, eventListeners);

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Remove an event listener
   */
  off(eventType: string, listener: (event: PluginEvent) => void): void {
    const eventListeners = this.listeners.get(eventType) || [];
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(): PluginEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listeners for a specific event type
   */
  getListenersForEvent(eventType: string): Array<(event: PluginEvent) => void> {
    return this.listeners.get(eventType) || [];
  }

  /**
   * Generate a unique correlation ID for event tracking
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event analytics
   */
  getAnalytics() {
    const eventTypes = new Map<string, number>();
    const sources = new Map<string, number>();

    this.eventHistory.forEach(event => {
      // Count event types
      eventTypes.set(event.type, (eventTypes.get(event.type) || 0) + 1);

      // Count sources
      sources.set(event.metadata.source, (sources.get(event.metadata.source) || 0) + 1);
    });

    return {
      totalEvents: this.eventHistory.length,
      eventTypes: Object.fromEntries(eventTypes),
      sources: Object.fromEntries(sources),
      oldestEvent: this.eventHistory[0]?.metadata.timestamp,
      newestEvent: this.eventHistory[this.eventHistory.length - 1]?.metadata.timestamp
    };
  }
}

// Create singleton instance
export const eventBus = new EventBus();