/**
 * @fileoverview Error Handlers
 *
 * Global error handling utilities for the application
 */

/**
 * Suppresses ResizeObserver loop errors which are common with Ant Design components
 * These errors are typically benign and occur when ResizeObserver can't deliver
 * all notifications within a single frame due to layout changes
 */
export const suppressResizeObserverErrors = (): void => {
  // Store the original console.error
  const originalConsoleError = console.error;

  // Override console.error to filter out ResizeObserver errors
  console.error = (...args: any[]) => {
    const errorMessage = args[0];

    // Check if it's a ResizeObserver error
    if (
      typeof errorMessage === 'string' &&
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // Silently ignore this specific error
      return;
    }

    // For all other errors, use the original console.error
    originalConsoleError.apply(console, args);
  };

  // Also handle window error events
  const originalWindowErrorHandler = window.onerror;

  window.onerror = (message, source, lineno, colno, error) => {
    // Check if it's a ResizeObserver error
    if (
      typeof message === 'string' &&
      message.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // Prevent the error from being displayed
      return true;
    }

    // For other errors, use the original handler if it exists
    if (originalWindowErrorHandler) {
      return originalWindowErrorHandler.call(window, message, source, lineno, colno, error);
    }

    return false;
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      typeof event.reason.message === 'string' &&
      event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // Prevent the unhandled rejection from being logged
      event.preventDefault();
    }
  });
};

/**
 * Initialize all error handlers
 */
export const initializeErrorHandlers = (): void => {
  suppressResizeObserverErrors();

  // Log that error handlers are initialized (for debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️ Error handlers initialized - ResizeObserver errors will be suppressed');
  }
};