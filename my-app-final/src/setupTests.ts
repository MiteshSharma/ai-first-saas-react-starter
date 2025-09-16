/**
 * @fileoverview Test Setup Configuration
 * Global test setup for Jest and React Testing Library
 */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Mock window.matchMedia
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

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage with actual storage behavior
class StorageMock {
  private storage: { [key: string]: string } = {};

  getItem = (key: string): string | null => {
    return this.storage[key] || null;
  };

  setItem = (key: string, value: string): void => {
    this.storage[key] = value;
  };

  removeItem = (key: string): void => {
    delete this.storage[key];
  };

  clear = (): void => {
    this.storage = {};
  };

  key = (index: number): string | null => {
    const keys = Object.keys(this.storage);
    return keys[index] || null;
  };

  get length(): number {
    return Object.keys(this.storage).length;
  }

  // Test utilities
  _getStorage = () => this.storage;
  _setStorage = (newStorage: { [key: string]: string }) => {
    this.storage = newStorage;
  };
}

const localStorageMock = new StorageMock();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = new StorageMock();
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message, ...args) => {
    // Allow specific error messages that we want to test
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') || message.includes('Error:'))
    ) {
      originalError(message, ...args);
    }
  });

  console.warn = jest.fn((message, ...args) => {
    // Allow specific warning messages that we want to test
    if (typeof message === 'string' && (message.includes('Warning:') || message.includes('deprecated'))) {
      originalWarn(message, ...args);
    }
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test cleanup
afterEach(() => {
  // Clear localStorage mock data
  localStorageMock.clear();

  // Clear sessionStorage mock data
  sessionStorageMock.clear();

  // Clear all other mocks (but preserve storage mock implementations)
  // Note: We don't call jest.clearAllMocks() here because it would clear
  // the localStorage/sessionStorage mock implementations
});

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
  } as Response)
);

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock crypto for testing
const mockCrypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  randomUUID: () => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  readonly encoding = 'utf-8';

  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }

  encodeInto(): { read: number; written: number } {
    return { read: 0, written: 0 };
  }
} as any;

global.TextDecoder = class TextDecoder {
  readonly encoding = 'utf-8';
  readonly fatal = false;
  readonly ignoreBOM = false;

  constructor(public label?: string, public options?: any) {}

  decode(input?: Uint8Array): string {
    if (!input) return '';
    return Buffer.from(input).toString('utf8');
  }
};
