/**
 * @fileoverview Simplified Event Bus (Plan 3)
 *
 * Simple event bus for plugin communication following plan_3 specifications:
 * - Lightweight event system
 * - No complex metadata
 * - Focus on core-to-plugin and plugin-to-plugin communication
 */

export class EventBus {
  private events: Map<string, Set<Function>> = new Map();

  /**
   * Subscribe to an event
   * @param event Event name
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  on(event: string, handler: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Emit an event to all subscribers
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: unknown): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
        }
      });
    }

  }

  /**
   * Unsubscribe from an event
   * @param event Event name
   * @param handler Event handler function
   */
  off(event: string, handler: Function): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  removeAllListeners(event: string): void {
    this.events.delete(event);
  }

  /**
   * Remove all event listeners
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Get list of events with listeners
   */
  getEvents(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get number of listeners for an event
   */
  getListenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();