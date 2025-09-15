/**
 * Jest Configuration for AI-First SaaS React Starter
 * Comprehensive test setup with coverage requirements
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],

  // Coverage configuration
  collectCoverage: process.env.CI === 'true' || process.env.COVERAGE === 'true',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/testUtils.ts',
    '!src/**/testHelper.ts',
    '!src/**/pluginTestHelper.ts',
    '!src/mocks/**',
    '!src/setupTests.ts',
    '!src/test/**',
  ],

  // Coverage thresholds - ensuring >70% coverage
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
    // Specific thresholds for critical modules
    './src/core/plugins/': {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
    './src/core/auth/': {
      branches: 65,
      functions: 65,
      lines: 70,
      statements: 70,
    },
    './src/plugins/': {
      branches: 60,
      functions: 60,
      lines: 65,
      statements: 65,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Maximum worker processes
  maxWorkers: '50%',

  // Test timeout
  testTimeout: 10000,

  // Global test setup
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },

  // Mock specific modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Transform ignore patterns - don't transform node_modules except specific packages
  transformIgnorePatterns: [
    'node_modules/(?!(axios|antd|@ant-design|rc-.*)/)',
  ],

  // Error handling
  errorOnDeprecated: true,

  // Watch plugins for interactive mode
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Reporters for CI/CD integration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],

  // Test result processor for coverage badges
  testResultsProcessor: 'jest-sonar-reporter',

  // Snapshot serializers
  snapshotSerializers: [
    '@emotion/jest/serializer',
  ],
};