/**
 * @fileoverview Enhanced Event Bus with Context Events
 *
 * Event bus for plugin communication with context awareness:
 * - Lightweight event system
 * - Context change events for multi-tenant features
 * - Core-to-plugin and plugin-to-plugin communication
 */

import type { User, ISODate, WorkspaceSettings } from '../types';
import { CORE_SYSTEM_EVENTS } from '../../events';

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
  [CORE_SYSTEM_EVENTS.CONTEXT_CHANGED]: ContextChangeEvent;
  [CORE_SYSTEM_EVENTS.TENANT_SWITCHED]: { tenantId: string; userId: string };
  [CORE_SYSTEM_EVENTS.WORKSPACE_SWITCHED]: { workspaceId: string; workspace: WorkspaceContext };
  [CORE_SYSTEM_EVENTS.USER_UPDATED]: { user: User };
  [CORE_SYSTEM_EVENTS.AUTH_SUCCESS]: { userId: string };
  [CORE_SYSTEM_EVENTS.AUTH_LOGIN]: { user: User };
  [CORE_SYSTEM_EVENTS.AUTH_LOGOUT]: { userId: string };
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
    this.emit(CORE_SYSTEM_EVENTS.CONTEXT_CHANGED, contextChangeEvent);
  }

  /**
   * Subscribe to context change events
   */
  onContextChange(handler: (event: ContextChangeEvent) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.CONTEXT_CHANGED, handler);
  }

  /**
   * Emit tenant switch event
   */
  emitTenantSwitch(tenantId: string, userId: string): void {
    this.emit(CORE_SYSTEM_EVENTS.TENANT_SWITCHED, { tenantId, userId });
  }

  /**
   * Subscribe to tenant switch events
   */
  onTenantSwitch(handler: (event: { tenantId: string; userId: string }) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.TENANT_SWITCHED, handler);
  }

  /**
   * Emit workspace switch event
   */
  emitWorkspaceSwitch(workspaceId: string, workspace: WorkspaceContext): void {
    this.emit(CORE_SYSTEM_EVENTS.WORKSPACE_SWITCHED, { workspaceId, workspace });
  }

  /**
   * Subscribe to workspace switch events
   */
  onWorkspaceSwitch(handler: (event: { workspaceId: string; workspace: WorkspaceContext }) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.WORKSPACE_SWITCHED, handler);
  }

  /**
   * Emit user update event
   */
  emitUserUpdate(user: User): void {
    this.emit(CORE_SYSTEM_EVENTS.USER_UPDATED, { user });
  }

  /**
   * Subscribe to user update events
   */
  onUserUpdate(handler: (event: { user: User }) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.USER_UPDATED, handler);
  }

  /**
   * Emit auth success event
   */
  emitAuthSuccess(userId: string): void {
    this.emit(CORE_SYSTEM_EVENTS.AUTH_SUCCESS, { userId });
  }

  /**
   * Subscribe to auth success events
   */
  onAuthSuccess(handler: (event: { userId: string }) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.AUTH_SUCCESS, handler);
  }

  /**
   * Emit auth login event
   */
  emitAuthLogin(user: User): void {
    this.emit(CORE_SYSTEM_EVENTS.AUTH_LOGIN, { user });
  }

  /**
   * Subscribe to auth login events
   */
  onAuthLogin(handler: (event: { user: User }) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.AUTH_LOGIN, handler);
  }

  /**
   * Emit auth logout event
   */
  emitAuthLogout(userId: string): void {
    this.emit(CORE_SYSTEM_EVENTS.AUTH_LOGOUT, { userId });
  }

  /**
   * Subscribe to auth logout events
   */
  onAuthLogout(handler: (event: { userId: string }) => void): () => void {
    return this.on(CORE_SYSTEM_EVENTS.AUTH_LOGOUT, handler);
  }
}

// Export singleton instance
export const eventBus = new EventBus();