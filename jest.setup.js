/**
 * Jest Setup - Configuração global de testes
 * Nexus Framework
 */

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-min-32-chars';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_USER = 'test_user';
process.env.POSTGRES_PASSWORD = 'test_password';
process.env.POSTGRES_DB = 'test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.PORT = '3000';

// Mock console to reduce noise (keep error and warn for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep warn and error for debugging test failures
  warn: console.warn,
  error: console.error,
};

// Global test utilities
global.testUtils = {
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
};

// Set global test timeout
jest.setTimeout(10000);

// Setup global test hooks
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});
