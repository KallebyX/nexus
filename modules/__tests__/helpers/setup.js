/**
 * Test Setup Helpers
 * Nexus Framework Testing Configuration
 */

import { jest } from '@jest/globals';

/**
 * Setup test environment
 */
export const setupTestEnvironment = () => {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.POSTGRES_HOST = 'localhost';
  process.env.POSTGRES_PORT = '5432';
  process.env.POSTGRES_USER = 'test_user';
  process.env.POSTGRES_PASSWORD = 'test_password';
  process.env.POSTGRES_DB = 'test_db';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';

  // Suppress console logs during tests
  if (!process.env.VERBOSE_TESTS) {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }
};

/**
 * Cleanup test environment
 */
export const cleanupTestEnvironment = () => {
  // Clear environment variables
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  delete process.env.POSTGRES_HOST;
  delete process.env.POSTGRES_PORT;
  delete process.env.POSTGRES_USER;
  delete process.env.POSTGRES_PASSWORD;
  delete process.env.POSTGRES_DB;
  delete process.env.REDIS_HOST;
  delete process.env.REDIS_PORT;
};

/**
 * Wait for async operations
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Suppress console for specific test
 */
export const suppressConsole = () => {
  const originalConsole = { ...console };

  beforeAll(() => {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  afterAll(() => {
    global.console = originalConsole;
  });
};

/**
 * Mock external dependencies
 */
export const mockExternalDependencies = () => {
  // Mock bcryptjs
  jest.unstable_mockModule('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
    genSalt: jest.fn().mockResolvedValue('test-salt'),
  }));

  // Mock jsonwebtoken
  jest.unstable_mockModule('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('test-jwt-token'),
    verify: jest.fn().mockReturnValue({ id: '123', email: 'test@example.com' }),
    decode: jest.fn().mockReturnValue({ id: '123', email: 'test@example.com' }),
  }));

  // Mock nodemailer
  jest.unstable_mockModule('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: jest.fn().mockResolvedValue(true),
    }),
  }));

  // Mock redis
  jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    }),
  }));
};

/**
 * Create test timeout
 */
export const withTimeout = (fn, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Test timeout after ${timeout}ms`));
    }, timeout);

    Promise.resolve(fn())
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Create isolated test context
 */
export const createTestContext = () => {
  const context = {
    mocks: {},
    cleanup: [],
  };

  const addMock = (name, mock) => {
    context.mocks[name] = mock;
  };

  const addCleanup = (fn) => {
    context.cleanup.push(fn);
  };

  const runCleanup = async () => {
    for (const fn of context.cleanup.reverse()) {
      await fn();
    }
    context.cleanup = [];
  };

  return {
    context,
    addMock,
    addCleanup,
    runCleanup,
  };
};

/**
 * Assert async throws
 */
export const expectAsyncThrow = async (fn, expectedError) => {
  let error = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }

  if (!error) {
    throw new Error('Expected function to throw an error');
  }

  if (expectedError && error.message !== expectedError) {
    throw new Error(`Expected error message "${expectedError}", got "${error.message}"`);
  }

  return error;
};

/**
 * Create spy on console methods
 */
export const spyConsole = () => {
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };

  const restore = () => {
    Object.values(spies).forEach(spy => spy.mockRestore());
  };

  return { spies, restore };
};

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test${Date.now()}@example.com`,
  uuid: () => '123e4567-e89b-12d3-a456-' + Date.now(),
  string: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  number: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  boolean: () => Math.random() > 0.5,
  date: () => new Date(),
  array: (length = 5, generator = () => ({})) => Array.from({ length }, generator),
};

export default {
  setupTestEnvironment,
  cleanupTestEnvironment,
  waitFor,
  suppressConsole,
  mockExternalDependencies,
  withTimeout,
  createTestContext,
  expectAsyncThrow,
  spyConsole,
  generateTestData,
};
