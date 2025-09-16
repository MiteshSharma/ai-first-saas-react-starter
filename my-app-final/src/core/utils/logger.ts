// Enhanced logging utility for the application
// Provides proper logging levels and can be configured for different environments

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (level > this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
    };

    if (this.isDevelopment) {
      this.logToConsole(entry);
    }

    // In production, you could send logs to a service like LogRocket, Sentry, etc.
    if (!this.isDevelopment && level <= LogLevel.WARN) {
      this.logToService(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, context, data, timestamp } = entry;
    const timeStr = timestamp.toISOString();
    const contextStr = context ? `[${context}]` : '';
    const fullMessage = `${timeStr} ${contextStr} ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(fullMessage, data);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(fullMessage, data);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(fullMessage, data);
        break;
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.log(fullMessage, data);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(fullMessage, data);
    }
  }

  private logToService(entry: LogEntry): void {
    // Implement logging service integration here
    // For example: Sentry, LogRocket, or custom logging endpoint
    if (typeof window !== 'undefined' && (window as unknown as { logService?: { log: (entry: LogEntry) => void } }).logService) {
      (window as unknown as { logService: { log: (entry: LogEntry) => void } }).logService.log(entry);
    }
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  // Plugin-specific logging methods
  plugin = {
    init: (pluginName: string, message: string, data?: unknown): void => {
      this.info(`🔌 ${message}`, `Plugin:${pluginName}`, data);
    },

    error: (pluginName: string, message: string, data?: unknown): void => {
      this.error(`❌ ${message}`, `Plugin:${pluginName}`, data);
    },

    success: (pluginName: string, message: string, data?: unknown): void => {
      this.info(`✅ ${message}`, `Plugin:${pluginName}`, data);
    },
  };

  // API-specific logging methods
  api = {
    request: (method: string, url: string, data?: unknown): void => {
      this.debug(`→ ${method} ${url}`, 'API', data);
    },

    response: (method: string, url: string, status: number, data?: unknown): void => {
      const message = `← ${method} ${url} (${status})`;
      if (status >= 400) {
        this.error(message, 'API', data);
      } else {
        this.debug(message, 'API', data);
      }
    },

    error: (method: string, url: string, error: unknown): void => {
      this.error(`✗ ${method} ${url}`, 'API', error);
    },
  };

  // Store-specific logging methods
  store = {
    action: (storeName: string, action: string, data?: unknown): void => {
      this.debug(`${action}`, `Store:${storeName}`, data);
    },

    error: (storeName: string, action: string, error: unknown): void => {
      this.error(`Error in ${action}`, `Store:${storeName}`, error);
    },
  };
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogEntry };