/**
 * @fileoverview Enhanced Event Bus with Context Events
 *
 * Event bus for plugin communication with context awareness:
 * - Lightweight event system
 * - Context change events for multi-tenant features
 * - Core-to-plugin and plugin-to-plugin communication
 */

import type { User, ISODate, WorkspaceSettings } from '../types';

// Context-related event types
export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface WorkspaceContext {
  id: string;
  name: string;
  slug: string;
  tenantId: string;
  type: 'project' | 'department' | 'team' | 'client';
  status: 'active' | 'archived' | 'deleted';
  settings: WorkspaceSettings;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ContextChangeEvent {
  type: 'tenant' | 'workspace' | 'user';
  previousContext?: {
    tenant?: TenantContext;
    workspace?: WorkspaceContext;
    user?: User;
  };
  currentContext: {
    tenant?: TenantContext;
    workspace?: WorkspaceContext;
    user?: User;
  };
  timestamp: ISODate;
}

// Standard event types
export interface SystemEvents {
  'context:changed': ContextChangeEvent;
  'tenant:switched': { tenantId: string; userId: string };
  'workspace:switched': { workspaceId: string; workspace: WorkspaceContext };
  'user:updated': { user: User };
  'auth:success': { userId: string };
  'auth:login': { user: User };
  'auth:logout': { userId: string };
}

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

  // Type-safe context event methods

  /**
   * Emit a context change event
   */
  emitContextChange(contextChangeEvent: ContextChangeEvent): void {
    this.emit('context:changed', contextChangeEvent);
  }

  /**
   * Subscribe to context change events
   */
  onContextChange(handler: (event: ContextChangeEvent) => void): () => void {
    return this.on('context:changed', handler);
  }

  /**
   * Emit tenant switch event
   */
  emitTenantSwitch(tenantId: string, userId: string): void {
    this.emit('tenant:switched', { tenantId, userId });
  }

  /**
   * Subscribe to tenant switch events
   */
  onTenantSwitch(handler: (event: { tenantId: string; userId: string }) => void): () => void {
    return this.on('tenant:switched', handler);
  }

  /**
   * Emit workspace switch event
   */
  emitWorkspaceSwitch(workspaceId: string, workspace: WorkspaceContext): void {
    this.emit('workspace:switched', { workspaceId, workspace });
  }

  /**
   * Subscribe to workspace switch events
   */
  onWorkspaceSwitch(handler: (event: { workspaceId: string; workspace: WorkspaceContext }) => void): () => void {
    return this.on('workspace:switched', handler);
  }

  /**
   * Emit user update event
   */
  emitUserUpdate(user: User): void {
    this.emit('user:updated', { user });
  }

  /**
   * Subscribe to user update events
   */
  onUserUpdate(handler: (event: { user: User }) => void): () => void {
    return this.on('user:updated', handler);
  }

  /**
   * Emit auth success event
   */
  emitAuthSuccess(userId: string): void {
    this.emit('auth:success', { userId });
  }

  /**
   * Subscribe to auth success events
   */
  onAuthSuccess(handler: (event: { userId: string }) => void): () => void {
    return this.on('auth:success', handler);
  }

  /**
   * Emit auth login event
   */
  emitAuthLogin(user: User): void {
    this.emit('auth:login', { user });
  }

  /**
   * Subscribe to auth login events
   */
  onAuthLogin(handler: (event: { user: User }) => void): () => void {
    return this.on('auth:login', handler);
  }

  /**
   * Emit auth logout event
   */
  emitAuthLogout(userId: string): void {
    this.emit('auth:logout', { userId });
  }

  /**
   * Subscribe to auth logout events
   */
  onAuthLogout(handler: (event: { userId: string }) => void): () => void {
    return this.on('auth:logout', handler);
  }
}

// Export singleton instance
export const eventBus = new EventBus();