# Event Bus Documentation

The Event Bus is the **communication backbone** of the AI-First SaaS React Starter, enabling loose coupling between plugins and core framework components through a powerful, type-safe event system.

## 🎯 Overview

The Event Bus provides a **publish-subscribe pattern** that allows different parts of the application to communicate without direct dependencies. This enables the plugin architecture to work seamlessly while maintaining separation of concerns.

### Key Features

- **Type-Safe Events** - Full TypeScript support for event definitions
- **High Performance** - Optimized for minimal overhead
- **Debugging Support** - Built-in event logging and history
- **Event Middleware** - Transform and filter events
- **Subscription Management** - Automatic cleanup and lifecycle management
- **Event Batching** - Optimize performance for high-frequency events

### Architecture

```
Event Bus Architecture
├── 🎛️ Core Event Bus              # Main event system
│   ├── Event Emitter               # Publishes events
│   ├── Event Subscribers           # Handles subscriptions
│   ├── Event History               # Debugging and replay
│   └── Performance Monitor         # Performance tracking
├── 🌍 Event Types                  # Type definitions
│   ├── Core Events                 # Framework events
│   ├── Plugin Events               # Plugin-specific events
│   └── Custom Events               # User-defined events
├── 🔧 Event Middleware             # Event processing
│   ├── Logging Middleware          # Event logging
│   ├── Validation Middleware       # Event validation
│   └── Transform Middleware        # Event transformation
└── 🧪 Testing Utilities            # Event testing tools
    ├── Event Simulation            # Mock events
    ├── Event Assertions            # Test helpers
    └── Event Recording             # Capture events
```

## 🏗️ Core Event Bus Implementation

### EventBus Class

```typescript
// src/core/events/EventBus.ts
export interface EventListener<T = any> {
  (data: T): void | Promise<void>;
}

export interface EventRecord {
  id: string;
  name: string;
  data: any;
  timestamp: Date;
  source?: string;
  metadata?: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  eventName: string;
  listener: EventListener;
  once: boolean;
  priority: number;
  source?: string;
}

export class EventBus {
  private listeners: Map<string, EventSubscription[]> = new Map();
  private eventHistory: EventRecord[] = [];
  private middleware: EventMiddleware[] = [];
  private readonly maxHistorySize = 1000;
  private isDebugging = process.env.NODE_ENV === 'development';
  private performanceMonitor = new EventPerformanceMonitor();

  /**
   * Emit an event to all subscribers
   */
  async emit<T extends keyof EventMap>(
    eventName: T,
    data: EventMap[T],
    options: EmitOptions = {}
  ): Promise<void> {
    const eventRecord: EventRecord = {
      id: this.generateEventId(),
      name: eventName as string,
      data,
      timestamp: new Date(),
      source: options.source,
      metadata: options.metadata
    };

    // Process through middleware
    const processedRecord = await this.processMiddleware(eventRecord);
    if (!processedRecord) return; // Event was filtered out

    // Add to history
    this.addToHistory(processedRecord);

    // Get subscribers for this event
    const subscribers = this.listeners.get(eventName as string) || [];

    if (subscribers.length === 0) {
      if (this.isDebugging) {
        console.warn(`No subscribers for event: ${eventName}`);
      }
      return;
    }

    // Sort by priority (higher priority first)
    const sortedSubscribers = [...subscribers].sort((a, b) => b.priority - a.priority);

    // Track performance
    const performanceId = this.performanceMonitor.start(eventName as string);

    try {
      // Execute listeners based on execution mode
      if (options.async === false) {
        // Synchronous execution
        for (const subscription of sortedSubscribers) {
          await this.executeListener(subscription, processedRecord.data);
        }
      } else {
        // Parallel execution (default)
        const promises = sortedSubscribers.map(subscription =>
          this.executeListener(subscription, processedRecord.data)
        );
        await Promise.allSettled(promises);
      }
    } finally {
      this.performanceMonitor.end(performanceId);
    }

    // Remove one-time listeners
    this.removeOnceListeners(eventName as string);

    // Log event if debugging
    if (this.isDebugging) {
      console.log(`🎛️ Event: ${eventName}`, {
        data: processedRecord.data,
        subscribers: subscribers.length,
        metadata: processedRecord.metadata
      });
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe<T extends keyof EventMap>(
    eventName: T,
    listener: EventListener<EventMap[T]>,
    options: SubscribeOptions = {}
  ): () => void {
    const subscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      eventName: eventName as string,
      listener: listener as EventListener,
      once: options.once || false,
      priority: options.priority || 0,
      source: options.source
    };

    // Add to listeners map
    if (!this.listeners.has(eventName as string)) {
      this.listeners.set(eventName as string, []);
    }

    const eventListeners = this.listeners.get(eventName as string)!;
    eventListeners.push(subscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscription.id);
    };
  }

  /**
   * Subscribe to an event once
   */
  once<T extends keyof EventMap>(
    eventName: T,
    listener: EventListener<EventMap[T]>,
    options: Omit<SubscribeOptions, 'once'> = {}
  ): () => void {
    return this.subscribe(eventName, listener, { ...options, once: true });
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventName, subscriptions] of this.listeners.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.listeners.delete(eventName);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Wait for a specific event
   */
  waitFor<T extends keyof EventMap>(
    eventName: T,
    timeout: number = 5000,
    condition?: (data: EventMap[T]) => boolean
  ): Promise<EventMap[T]> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      const unsubscribe = this.subscribe(eventName, (data) => {
        if (!condition || condition(data)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(data);
        }
      });
    });
  }

  /**
   * Get event statistics
   */
  getStats(): EventBusStats {
    const eventCounts = new Map<string, number>();

    for (const record of this.eventHistory) {
      const count = eventCounts.get(record.name) || 0;
      eventCounts.set(record.name, count + 1);
    }

    return {
      totalEvents: this.eventHistory.length,
      totalSubscribers: Array.from(this.listeners.values())
        .reduce((total, subs) => total + subs.length, 0),
      eventCounts: Object.fromEntries(eventCounts),
      performanceStats: this.performanceMonitor.getStats()
    };
  }

  /**
   * Add middleware to the event pipeline
   */
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): EventRecord[] {
    return this.eventHistory.slice(0, limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }

  /**
   * Enable/disable debugging
   */
  setDebugging(enabled: boolean): void {
    this.isDebugging = enabled;
  }

  /**
   * Private helper methods
   */
  private async executeListener(
    subscription: EventSubscription,
    data: any
  ): Promise<void> {
    try {
      await subscription.listener(data);
    } catch (error) {
      console.error(`Error in event listener for ${subscription.eventName}:`, error);

      // Emit error event
      this.emit('EVENT_LISTENER_ERROR', {
        subscriptionId: subscription.id,
        eventName: subscription.eventName,
        error: error.message,
        source: subscription.source
      });
    }
  }

  private async processMiddleware(record: EventRecord): Promise<EventRecord | null> {
    let processedRecord = record;

    for (const middleware of this.middleware) {
      const result = await middleware.process(processedRecord);
      if (result === null) {
        return null; // Event filtered out
      }
      processedRecord = result;
    }

    return processedRecord;
  }

  private removeOnceListeners(eventName: string): void {
    const subscriptions = this.listeners.get(eventName);
    if (subscriptions) {
      const filtered = subscriptions.filter(sub => !sub.once);
      if (filtered.length === 0) {
        this.listeners.delete(eventName);
      } else {
        this.listeners.set(eventName, filtered);
      }
    }
  }

  private addToHistory(record: EventRecord): void {
    this.eventHistory.unshift(record);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global event bus instance
export const eventBus = new EventBus();
```

## 🌍 Event Type System

### Core Event Definitions

```typescript
// src/core/events/types/eventTypes.ts
export interface EventMap {
  // Authentication Events
  USER_LOGIN: UserLoginEvent;
  USER_LOGOUT: UserLogoutEvent;
  USER_UPDATED: UserUpdatedEvent;
  TOKEN_REFRESHED: TokenRefreshEvent;
  AUTH_TOKEN_EXPIRED: AuthTokenExpiredEvent;

  // Plugin Events
  PLUGIN_ACTIVATED: PluginActivatedEvent;
  PLUGIN_DEACTIVATED: PluginDeactivatedEvent;
  PLUGIN_UNINSTALLED: PluginUninstalledEvent;
  PLUGIN_ERROR: PluginErrorEvent;

  // Task Management Events
  TASK_CREATED: TaskCreatedEvent;
  TASK_UPDATED: TaskUpdatedEvent;
  TASK_DELETED: TaskDeletedEvent;
  TASK_ASSIGNED: TaskAssignedEvent;
  TASK_STATUS_CHANGED: TaskStatusChangedEvent;

  // Project Management Events
  PROJECT_CREATED: ProjectCreatedEvent;
  PROJECT_UPDATED: ProjectUpdatedEvent;
  PROJECT_DELETED: ProjectDeletedEvent;
  PROJECT_MEMBER_ADDED: ProjectMemberAddedEvent;
  PROJECT_MEMBER_REMOVED: ProjectMemberRemovedEvent;

  // UI Events
  MODAL_OPENED: ModalEvent;
  MODAL_CLOSED: ModalEvent;
  THEME_CHANGED: ThemeChangedEvent;
  NAVIGATION_CHANGED: NavigationEvent;

  // System Events
  ERROR_OCCURRED: ErrorEvent;
  NETWORK_ERROR: NetworkErrorEvent;
  PERFORMANCE_WARNING: PerformanceWarningEvent;

  // Real-time Events
  REALTIME_CONNECTED: RealtimeConnectedEvent;
  REALTIME_DISCONNECTED: RealtimeDisconnectedEvent;
  REALTIME_MESSAGE: RealtimeMessageEvent;

  // File Events
  FILE_UPLOADED: FileUploadedEvent;
  FILE_DELETED: FileDeletedEvent;
  FILE_SHARED: FileSharedEvent;

  // Notification Events
  NOTIFICATION_ADDED: NotificationAddedEvent;
  NOTIFICATION_READ: NotificationReadEvent;

  // Custom Events (for plugins to extend)
  CUSTOM_EVENT: CustomEvent;
}

// Authentication Events
export interface UserLoginEvent {
  user: User;
  timestamp: Date;
  loginMethod?: 'password' | 'oauth' | 'sso';
  ip?: string;
  userAgent?: string;
}

export interface UserLogoutEvent {
  userId?: string;
  timestamp: Date;
  reason?: 'manual' | 'timeout' | 'forced';
}

export interface UserUpdatedEvent {
  user: User;
  changes: Partial<User>;
  updatedBy?: string;
  timestamp: Date;
}

// Task Events
export interface TaskCreatedEvent {
  task: Task;
  creator: string;
  projectId?: string;
  timestamp: Date;
}

export interface TaskUpdatedEvent {
  task: Task;
  changes: Partial<Task>;
  updatedBy: string;
  previousValues?: Partial<Task>;
  timestamp: Date;
}

export interface TaskAssignedEvent {
  taskId: string;
  assigneeId: string;
  assignedBy: string;
  previousAssigneeId?: string;
  timestamp: Date;
}

// Project Events
export interface ProjectCreatedEvent {
  project: Project;
  creator: string;
  template?: string;
  timestamp: Date;
}

export interface ProjectMemberAddedEvent {
  projectId: string;
  member: ProjectMember;
  addedBy: string;
  role: string;
  timestamp: Date;
}

// UI Events
export interface ModalEvent {
  modalId: string;
  data?: any;
  timestamp: Date;
}

export interface ThemeChangedEvent {
  theme: 'light' | 'dark' | 'auto';
  previousTheme?: string;
  timestamp: Date;
}

// System Events
export interface ErrorEvent {
  error: Error | string;
  source: string;
  context?: Record<string, any>;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceWarningEvent {
  metric: string;
  value: number;
  threshold: number;
  source: string;
  timestamp: Date;
}

// Custom Event (for plugin extensions)
export interface CustomEvent {
  type: string;
  payload: any;
  source: string;
  timestamp: Date;
}
```

### Event Type Helpers

```typescript
// src/core/events/types/eventHelpers.ts
export class EventTypeHelper {
  /**
   * Create a typed event emitter function
   */
  static createEmitter<T extends keyof EventMap>(eventName: T) {
    return (data: EventMap[T], options?: EmitOptions) => {
      return eventBus.emit(eventName, data, options);
    };
  }

  /**
   * Create a typed event subscriber function
   */
  static createSubscriber<T extends keyof EventMap>(eventName: T) {
    return (
      listener: EventListener<EventMap[T]>,
      options?: SubscribeOptions
    ) => {
      return eventBus.subscribe(eventName, listener, options);
    };
  }

  /**
   * Validate event data structure
   */
  static validateEvent<T extends keyof EventMap>(
    eventName: T,
    data: any
  ): data is EventMap[T] {
    // Implementation would include runtime type checking
    // This is a simplified version
    return typeof data === 'object' && data !== null;
  }
}

// Convenience functions for common events
export const authEvents = {
  emitLogin: EventTypeHelper.createEmitter('USER_LOGIN'),
  emitLogout: EventTypeHelper.createEmitter('USER_LOGOUT'),
  subscribeToLogin: EventTypeHelper.createSubscriber('USER_LOGIN'),
  subscribeToLogout: EventTypeHelper.createSubscriber('USER_LOGOUT')
};

export const taskEvents = {
  emitCreated: EventTypeHelper.createEmitter('TASK_CREATED'),
  emitUpdated: EventTypeHelper.createEmitter('TASK_UPDATED'),
  emitAssigned: EventTypeHelper.createEmitter('TASK_ASSIGNED'),
  subscribeToCreated: EventTypeHelper.createSubscriber('TASK_CREATED'),
  subscribeToUpdated: EventTypeHelper.createSubscriber('TASK_UPDATED'),
  subscribeToAssigned: EventTypeHelper.createSubscriber('TASK_ASSIGNED')
};
```

## 🔧 Event Middleware

### Middleware Interface

```typescript
// src/core/events/middleware/EventMiddleware.ts
export interface EventMiddleware {
  name: string;
  priority: number;
  process(event: EventRecord): Promise<EventRecord | null>;
}

export abstract class BaseEventMiddleware implements EventMiddleware {
  abstract name: string;
  abstract priority: number;

  abstract process(event: EventRecord): Promise<EventRecord | null>;

  protected shouldProcess(event: EventRecord): boolean {
    return true;
  }

  protected log(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.name}] ${message}`, data);
    }
  }
}
```

### Built-in Middleware

#### Logging Middleware
```typescript
// src/core/events/middleware/LoggingMiddleware.ts
export class LoggingMiddleware extends BaseEventMiddleware {
  name = 'LoggingMiddleware';
  priority = 100;

  async process(event: EventRecord): Promise<EventRecord> {
    // Log all events in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🎛️ Event: ${event.name}`);
      console.log('Data:', event.data);
      console.log('Timestamp:', event.timestamp);
      console.log('Source:', event.source);
      console.groupEnd();
    }

    // Send critical events to logging service in production
    if (process.env.NODE_ENV === 'production' && this.isCriticalEvent(event)) {
      await this.logToService(event);
    }

    return event;
  }

  private isCriticalEvent(event: EventRecord): boolean {
    const criticalEvents = [
      'ERROR_OCCURRED',
      'AUTH_TOKEN_EXPIRED',
      'PLUGIN_ERROR',
      'PERFORMANCE_WARNING'
    ];
    return criticalEvents.includes(event.name);
  }

  private async logToService(event: EventRecord): Promise<void> {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'info',
          message: `Event: ${event.name}`,
          data: event.data,
          timestamp: event.timestamp,
          source: event.source
        })
      });
    } catch (error) {
      console.error('Failed to log event to service:', error);
    }
  }
}
```

#### Validation Middleware
```typescript
// src/core/events/middleware/ValidationMiddleware.ts
export class ValidationMiddleware extends BaseEventMiddleware {
  name = 'ValidationMiddleware';
  priority = 200;

  async process(event: EventRecord): Promise<EventRecord | null> {
    // Validate required fields
    if (!this.hasRequiredFields(event)) {
      console.error('Event validation failed: missing required fields', event);
      return null; // Filter out invalid event
    }

    // Validate event data structure
    if (!this.validateEventData(event)) {
      console.error('Event validation failed: invalid data structure', event);
      return null;
    }

    // Sanitize event data
    return {
      ...event,
      data: this.sanitizeEventData(event.data)
    };
  }

  private hasRequiredFields(event: EventRecord): boolean {
    return !!(event.name && event.timestamp && event.id);
  }

  private validateEventData(event: EventRecord): boolean {
    // Use EventTypeHelper for runtime type checking
    return EventTypeHelper.validateEvent(event.name as keyof EventMap, event.data);
  }

  private sanitizeEventData(data: any): any {
    // Remove sensitive information
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      // Remove common sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          delete sanitized[field];
        }
      }

      return sanitized;
    }

    return data;
  }
}
```

#### Transform Middleware
```typescript
// src/core/events/middleware/TransformMiddleware.ts
export class TransformMiddleware extends BaseEventMiddleware {
  name = 'TransformMiddleware';
  priority = 50;

  async process(event: EventRecord): Promise<EventRecord> {
    // Add metadata
    const enrichedEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Transform specific events
    return this.transformEventData(enrichedEvent);
  }

  private transformEventData(event: EventRecord): EventRecord {
    switch (event.name) {
      case 'USER_LOGIN':
        return this.transformUserLoginEvent(event);
      case 'TASK_CREATED':
        return this.transformTaskCreatedEvent(event);
      default:
        return event;
    }
  }

  private transformUserLoginEvent(event: EventRecord): EventRecord {
    return {
      ...event,
      data: {
        ...event.data,
        loginDuration: this.calculateLoginDuration(),
        deviceType: this.getDeviceType()
      }
    };
  }

  private transformTaskCreatedEvent(event: EventRecord): EventRecord {
    return {
      ...event,
      data: {
        ...event.data,
        estimatedDuration: this.estimateTaskDuration(event.data),
        priority: this.calculatePriority(event.data)
      }
    };
  }

  private getCurrentUserId(): string | undefined {
    return useAuthStore.getState().user?.id;
  }

  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  private calculateLoginDuration(): number {
    // Calculate time since last logout
    const lastLogout = localStorage.getItem('lastLogout');
    if (lastLogout) {
      return Date.now() - parseInt(lastLogout, 10);
    }
    return 0;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private estimateTaskDuration(taskData: any): number {
    // Simple estimation based on task complexity
    const baseTime = 60; // minutes
    const complexityMultiplier = taskData.priority === 'high' ? 2 : 1;
    const descriptionMultiplier = taskData.description?.length > 100 ? 1.5 : 1;

    return baseTime * complexityMultiplier * descriptionMultiplier;
  }

  private calculatePriority(taskData: any): string {
    // Auto-calculate priority if not set
    if (taskData.priority) return taskData.priority;

    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const now = new Date();
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilDue < 1) return 'critical';
      if (daysUntilDue < 3) return 'high';
      if (daysUntilDue < 7) return 'medium';
    }

    return 'low';
  }
}
```

## 🎯 Event Patterns

### Request-Response Pattern

```typescript
// src/core/events/patterns/RequestResponsePattern.ts
export class RequestResponsePattern {
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  /**
   * Send a request and wait for response
   */
  async sendRequest<TRequest, TResponse>(
    requestEvent: string,
    responseEvent: string,
    data: TRequest,
    timeout: number = 5000
  ): Promise<TResponse> {
    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${requestEvent}`));
      }, timeout);

      // Store request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutId
      });

      // Subscribe to response
      const unsubscribe = eventBus.subscribe(responseEvent as keyof EventMap, (responseData: any) => {
        if (responseData.requestId === requestId) {
          const request = this.pendingRequests.get(requestId);
          if (request) {
            clearTimeout(request.timeout);
            this.pendingRequests.delete(requestId);
            unsubscribe();

            if (responseData.error) {
              request.reject(new Error(responseData.error));
            } else {
              request.resolve(responseData.data);
            }
          }
        }
      });

      // Send request
      eventBus.emit(requestEvent as keyof EventMap, {
        ...data,
        requestId
      } as any);
    });
  }

  /**
   * Handle a request and send response
   */
  handleRequest<TRequest, TResponse>(
    requestEvent: string,
    responseEvent: string,
    handler: (data: TRequest) => Promise<TResponse> | TResponse
  ): () => void {
    return eventBus.subscribe(requestEvent as keyof EventMap, async (requestData: any) => {
      try {
        const response = await handler(requestData);

        eventBus.emit(responseEvent as keyof EventMap, {
          requestId: requestData.requestId,
          data: response
        } as any);
      } catch (error) {
        eventBus.emit(responseEvent as keyof EventMap, {
          requestId: requestData.requestId,
          error: error.message
        } as any);
      }
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global instance
export const requestResponsePattern = new RequestResponsePattern();
```

### Event Aggregation Pattern

```typescript
// src/core/events/patterns/EventAggregationPattern.ts
export class EventAggregationPattern {
  private aggregators = new Map<string, EventAggregator>();

  /**
   * Create an event aggregator
   */
  createAggregator(
    name: string,
    events: string[],
    handler: (aggregatedData: any[]) => void,
    options: {
      timeout?: number;
      maxEvents?: number;
      condition?: (events: any[]) => boolean;
    } = {}
  ): void {
    const aggregator = new EventAggregator(events, handler, options);
    this.aggregators.set(name, aggregator);
    aggregator.start();
  }

  /**
   * Stop an aggregator
   */
  stopAggregator(name: string): void {
    const aggregator = this.aggregators.get(name);
    if (aggregator) {
      aggregator.stop();
      this.aggregators.delete(name);
    }
  }

  /**
   * Stop all aggregators
   */
  stopAll(): void {
    for (const [name] of this.aggregators) {
      this.stopAggregator(name);
    }
  }
}

class EventAggregator {
  private collectedEvents: any[] = [];
  private subscriptions: (() => void)[] = [];
  private timeoutId?: NodeJS.Timeout;

  constructor(
    private events: string[],
    private handler: (aggregatedData: any[]) => void,
    private options: {
      timeout?: number;
      maxEvents?: number;
      condition?: (events: any[]) => boolean;
    }
  ) {}

  start(): void {
    // Subscribe to all events
    for (const eventName of this.events) {
      const unsubscribe = eventBus.subscribe(eventName as keyof EventMap, (data) => {
        this.addEvent({ event: eventName, data, timestamp: new Date() });
      });
      this.subscriptions.push(unsubscribe);
    }

    // Set timeout if specified
    if (this.options.timeout) {
      this.resetTimeout();
    }
  }

  stop(): void {
    // Unsubscribe from all events
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions = [];

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private addEvent(eventData: any): void {
    this.collectedEvents.push(eventData);

    // Check if we should trigger the handler
    if (this.shouldTrigger()) {
      this.triggerHandler();
    }

    // Reset timeout
    if (this.options.timeout) {
      this.resetTimeout();
    }
  }

  private shouldTrigger(): boolean {
    // Check max events
    if (this.options.maxEvents && this.collectedEvents.length >= this.options.maxEvents) {
      return true;
    }

    // Check custom condition
    if (this.options.condition && this.options.condition(this.collectedEvents)) {
      return true;
    }

    return false;
  }

  private triggerHandler(): void {
    const events = [...this.collectedEvents];
    this.collectedEvents = [];
    this.handler(events);
  }

  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (this.collectedEvents.length > 0) {
        this.triggerHandler();
      }
    }, this.options.timeout);
  }
}

// Global instance
export const eventAggregationPattern = new EventAggregationPattern();
```

## 🧪 Testing Utilities

### Event Testing Helpers

```typescript
// src/core/events/testing/eventTestHelpers.ts
export class EventTestHelper {
  private recordedEvents: EventRecord[] = [];
  private originalEmit: any;

  /**
   * Start recording events
   */
  startRecording(): void {
    this.recordedEvents = [];
    this.originalEmit = eventBus.emit.bind(eventBus);

    eventBus.emit = (eventName: any, data: any, options?: any) => {
      this.recordedEvents.push({
        id: Date.now().toString(),
        name: eventName,
        data,
        timestamp: new Date(),
        source: options?.source
      });

      return this.originalEmit(eventName, data, options);
    };
  }

  /**
   * Stop recording events
   */
  stopRecording(): void {
    if (this.originalEmit) {
      eventBus.emit = this.originalEmit;
      this.originalEmit = null;
    }
  }

  /**
   * Get recorded events
   */
  getRecordedEvents(): EventRecord[] {
    return [...this.recordedEvents];
  }

  /**
   * Clear recorded events
   */
  clearRecordedEvents(): void {
    this.recordedEvents = [];
  }

  /**
   * Assert that an event was emitted
   */
  expectEventEmitted(eventName: string, expectedData?: any): void {
    const event = this.recordedEvents.find(e => e.name === eventName);
    if (!event) {
      throw new Error(`Expected event '${eventName}' to be emitted`);
    }

    if (expectedData) {
      expect(event.data).toEqual(expectedData);
    }
  }

  /**
   * Assert that an event was not emitted
   */
  expectEventNotEmitted(eventName: string): void {
    const event = this.recordedEvents.find(e => e.name === eventName);
    if (event) {
      throw new Error(`Expected event '${eventName}' not to be emitted`);
    }
  }

  /**
   * Wait for a specific event in tests
   */
  async waitForEvent(
    eventName: string,
    timeout: number = 1000,
    condition?: (data: any) => boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      const unsubscribe = eventBus.subscribe(eventName as keyof EventMap, (data) => {
        if (!condition || condition(data)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(data);
        }
      });
    });
  }

  /**
   * Simulate an event for testing
   */
  async simulateEvent(eventName: string, data: any, options?: any): Promise<void> {
    await eventBus.emit(eventName as keyof EventMap, data, options);
  }

  /**
   * Create a mock event listener
   */
  createMockListener(): jest.MockedFunction<EventListener> {
    return jest.fn();
  }
}

// Helper function for tests
export const setupEventTest = () => {
  const eventHelper = new EventTestHelper();

  beforeEach(() => {
    eventHelper.startRecording();
    eventBus.clear();
  });

  afterEach(() => {
    eventHelper.stopRecording();
    eventBus.clear();
  });

  return eventHelper;
};
```

### Plugin Event Testing

```typescript
// src/core/events/testing/pluginEventTesting.ts
export class PluginEventTester {
  private pluginContext: MockPluginContext;
  private eventHelper: EventTestHelper;

  constructor(pluginContext: MockPluginContext) {
    this.pluginContext = pluginContext;
    this.eventHelper = new EventTestHelper();
  }

  /**
   * Test plugin event subscriptions
   */
  async testPluginEventSubscriptions(
    plugin: Plugin,
    eventTests: Array<{
      eventName: string;
      eventData: any;
      expectedBehavior: (plugin: Plugin, context: MockPluginContext) => void | Promise<void>;
    }>
  ): Promise<void> {
    // Activate plugin
    await plugin.activate?.(this.pluginContext);

    // Test each event
    for (const test of eventTests) {
      // Emit the event
      await eventBus.emit(test.eventName as keyof EventMap, test.eventData);

      // Wait a bit for async handlers
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check expected behavior
      await test.expectedBehavior(plugin, this.pluginContext);
    }

    // Deactivate plugin
    await plugin.deactivate?.(this.pluginContext);
  }

  /**
   * Test plugin event emissions
   */
  async testPluginEventEmissions(
    plugin: Plugin,
    action: (plugin: Plugin, context: MockPluginContext) => Promise<void>,
    expectedEvents: Array<{
      eventName: string;
      dataValidator?: (data: any) => boolean;
    }>
  ): Promise<void> {
    this.eventHelper.startRecording();

    try {
      // Activate plugin
      await plugin.activate?.(this.pluginContext);

      // Perform action
      await action(plugin, this.pluginContext);

      // Check expected events
      for (const expected of expectedEvents) {
        const recordedEvent = this.eventHelper.getRecordedEvents()
          .find(e => e.name === expected.eventName);

        if (!recordedEvent) {
          throw new Error(`Expected event '${expected.eventName}' was not emitted`);
        }

        if (expected.dataValidator && !expected.dataValidator(recordedEvent.data)) {
          throw new Error(`Event '${expected.eventName}' data validation failed`);
        }
      }
    } finally {
      this.eventHelper.stopRecording();
      await plugin.deactivate?.(this.pluginContext);
    }
  }
}
```

## 📊 Performance Monitoring

### Event Performance Monitor

```typescript
// src/core/events/monitoring/EventPerformanceMonitor.ts
export class EventPerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();
  private activeTimers = new Map<string, { start: number; eventName: string }>();

  /**
   * Start timing an event
   */
  start(eventName: string): string {
    const timerId = `${eventName}_${Date.now()}_${Math.random()}`;
    this.activeTimers.set(timerId, {
      start: performance.now(),
      eventName
    });
    return timerId;
  }

  /**
   * End timing an event
   */
  end(timerId: string): void {
    const timer = this.activeTimers.get(timerId);
    if (!timer) return;

    const duration = performance.now() - timer.start;
    this.activeTimers.delete(timerId);

    // Record metric
    if (!this.metrics.has(timer.eventName)) {
      this.metrics.set(timer.eventName, []);
    }

    const eventMetrics = this.metrics.get(timer.eventName)!;
    eventMetrics.push({
      duration,
      timestamp: new Date(),
      eventName: timer.eventName
    });

    // Keep only last 100 metrics per event
    if (eventMetrics.length > 100) {
      eventMetrics.splice(0, eventMetrics.length - 100);
    }

    // Warn about slow events
    if (duration > 100) { // 100ms threshold
      console.warn(`Slow event detected: ${timer.eventName} took ${duration.toFixed(2)}ms`);

      eventBus.emit('PERFORMANCE_WARNING', {
        metric: 'event_duration',
        value: duration,
        threshold: 100,
        source: timer.eventName,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};

    for (const [eventName, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const durations = metrics.map(m => m.duration);
      const total = durations.reduce((sum, d) => sum + d, 0);
      const sorted = [...durations].sort((a, b) => a - b);

      stats[eventName] = {
        count: metrics.length,
        averageDuration: total / metrics.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        medianDuration: sorted[Math.floor(sorted.length / 2)],
        p95Duration: sorted[Math.floor(sorted.length * 0.95)],
        totalDuration: total
      };
    }

    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }
}

interface PerformanceMetric {
  duration: number;
  timestamp: Date;
  eventName: string;
}

interface PerformanceStats {
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  medianDuration: number;
  p95Duration: number;
  totalDuration: number;
}
```

## 📋 Best Practices

### 1. Event Design
- **Clear Naming** - Use descriptive, consistent event names
- **Rich Data** - Include all relevant context in event data
- **Immutable Data** - Don't modify event data after emission
- **Backward Compatibility** - Consider event schema evolution

### 2. Performance
- **Batching** - Batch high-frequency events
- **Async Handlers** - Use async handlers for expensive operations
- **Selective Subscription** - Only subscribe to needed events
- **Cleanup** - Always unsubscribe to prevent memory leaks

### 3. Error Handling
- **Isolated Failures** - One handler failure shouldn't affect others
- **Error Events** - Emit error events for monitoring
- **Graceful Degradation** - Handle missing event handlers
- **Timeout Handling** - Set timeouts for request-response patterns

### 4. Testing
- **Event Recording** - Record events during tests
- **Mock Handlers** - Use mock handlers for isolation
- **Async Testing** - Properly handle async event flows
- **Event Ordering** - Test event sequence dependencies

---

The Event Bus provides a powerful foundation for building scalable, loosely-coupled applications. By following these patterns and best practices, you can create robust plugin architectures that scale with your application's complexity.

## 📚 Next Steps

Continue exploring the framework:

1. **[Plugin Development](./plugin-development.md)** - Build plugins using events
2. **[State Management](./state-management.md)** - Integrate events with stores
3. **[Testing](./testing.md)** - Test event-driven applications
4. **[Performance](./performance.md)** - Optimize event performance

**Master event-driven architecture!** 🎛️✨