import '@testing-library/jest-dom';

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests if needed
const originalWarn = console.warn;
beforeAll((): void => {
  console.warn = (...args): void => {
    if (typeof args[0] === 'string' && args[0].includes('deprecated')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll((): void => {
  console.warn = originalWarn;
});
