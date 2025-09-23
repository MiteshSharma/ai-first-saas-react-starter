import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupMocks } from './mocks';
import { initAllPerformanceMonitoring } from './core/services/performance';

// Suppress ResizeObserver errors (common with Ant Design components)
// eslint-disable-next-line no-console
const originalConsoleError = console.error;
// eslint-disable-next-line no-console
console.error = (...args: unknown[]) => {
  const errorMessage = args[0];
  if (
    typeof errorMessage === 'string' &&
    errorMessage.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return; // Silently ignore ResizeObserver errors
  }
  originalConsoleError.apply(console, args);
};

// Handle ResizeObserver errors in window.onerror
window.onerror = (message) => {
  if (
    typeof message === 'string' &&
    message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return true; // Prevent error from showing
  }
  return false;
};

// Initialize performance monitoring
initAllPerformanceMonitoring();

// Initialize API mocks if enabled
setupMocks();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
