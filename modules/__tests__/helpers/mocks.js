/**
 * Test Mocks and Helpers
 * Nexus Framework Testing Utilities
 */

import { jest } from '@jest/globals';

/**
 * Mock Database Module
 */
export const createMockDatabase = () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    }),
  },
  User: {
    create: jest.fn().mockResolvedValue({
      id: '123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  },
  UserSession: {
    create: jest.fn().mockResolvedValue({
      id: '456',
      user_id: '123',
      token: 'test-token',
    }),
    findOne: jest.fn().mockResolvedValue(null),
    destroy: jest.fn().mockResolvedValue(1),
  },
  ActivityLog: {
    create: jest.fn().mockResolvedValue({
      id: '789',
      user_id: '123',
      action: 'test_action',
    }),
    findAll: jest.fn().mockResolvedValue([]),
  },
  Permission: {
    create: jest.fn().mockResolvedValue({
      id: '111',
      name: 'test_permission',
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
  },
  Role: {
    create: jest.fn().mockResolvedValue({
      id: '222',
      name: 'test_role',
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
  },
  Setting: {
    create: jest.fn().mockResolvedValue({
      id: '333',
      key: 'test_key',
      value: 'test_value',
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
  },
  isInitialized: true,
  config: {
    database: 'test_db',
    host: 'localhost',
    port: 5432,
  },
});

/**
 * Mock Auth Service
 */
export const createMockAuthService = () => ({
  register: jest.fn().mockResolvedValue({
    user: {
      id: '123',
      email: 'test@example.com',
    },
    tokens: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    },
  }),
  login: jest.fn().mockResolvedValue({
    user: {
      id: '123',
      email: 'test@example.com',
    },
    tokens: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    },
  }),
  logout: jest.fn().mockResolvedValue(true),
  refreshToken: jest.fn().mockResolvedValue({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  }),
  verifyToken: jest.fn().mockResolvedValue({
    id: '123',
    email: 'test@example.com',
  }),
  requestPasswordReset: jest.fn().mockResolvedValue({
    resetToken: 'reset-token',
  }),
  resetPassword: jest.fn().mockResolvedValue(true),
  validatePassword: jest.fn().mockResolvedValue(true),
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
});

/**
 * Mock Auth Middleware
 */
export const createMockAuthMiddleware = () => ({
  authenticate: jest.fn().mockReturnValue((req, res, next) => {
    req.user = { id: '123', email: 'test@example.com' };
    next();
  }),
  authorize: jest.fn().mockReturnValue((req, res, next) => next()),
  requireRole: jest.fn().mockReturnValue((req, res, next) => next()),
  requireOwnership: jest.fn().mockReturnValue((req, res, next) => next()),
  optionalAuth: jest.fn().mockReturnValue((req, res, next) => next()),
  rateLimit: jest.fn().mockReturnValue((req, res, next) => next()),
  auditLog: jest.fn().mockReturnValue((req, res, next) => next()),
});

/**
 * Mock Express Request
 */
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

/**
 * Mock Express Response
 */
export const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock Express Next
 */
export const createMockNext = () => jest.fn();

/**
 * Mock Redis Client
 */
export const createMockRedis = () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  flushAll: jest.fn().mockResolvedValue('OK'),
});

/**
 * Mock API Module
 */
export const createMockApiModule = () => ({
  app: {
    listen: jest.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return { close: jest.fn() };
    }),
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  server: null,
  isInitialized: true,
});

/**
 * Mock Sequelize Model Instance
 */
export const createMockModelInstance = (data = {}) => ({
  ...data,
  save: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  reload: jest.fn().mockResolvedValue(true),
  toJSON: jest.fn().mockReturnValue(data),
});

/**
 * Setup Database Mock for Module Import
 */
export const mockDatabaseModule = () => {
  const mockDb = createMockDatabase();

  jest.unstable_mockModule('../../database/index.js', () => ({
    initializeDatabase: jest.fn().mockResolvedValue(mockDb),
    getDatabase: jest.fn().mockResolvedValue(mockDb),
    DatabaseModule: jest.fn().mockImplementation(() => mockDb),
  }));

  return mockDb;
};

/**
 * Setup Auth Mock for Module Import
 */
export const mockAuthModule = () => {
  const mockAuth = createMockAuthService();
  const mockMiddleware = createMockAuthMiddleware();

  jest.unstable_mockModule('../../auth/AuthService.js', () => ({
    initializeAuth: jest.fn().mockResolvedValue(mockAuth),
    getAuth: jest.fn().mockResolvedValue(mockAuth),
    AuthService: jest.fn().mockImplementation(() => mockAuth),
  }));

  jest.unstable_mockModule('../../auth/AuthMiddleware.js', () => ({
    getAuthMiddleware: jest.fn().mockResolvedValue(mockMiddleware),
    AuthMiddleware: jest.fn().mockImplementation(() => mockMiddleware),
  }));

  return { mockAuth, mockMiddleware };
};

/**
 * Clear all mocks
 */
export const clearAllMocks = () => {
  jest.clearAllMocks();
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.resetAllMocks();
};

/**
 * Create test user data
 */
export const createTestUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  password: 'hashed-password',
  first_name: 'Test',
  last_name: 'User',
  is_active: true,
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Create test JWT payload
 */
export const createTestJWTPayload = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  role: 'user',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

/**
 * Create test session
 */
export const createTestSession = (overrides = {}) => ({
  id: '789e4567-e89b-12d3-a456-426614174000',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  token: 'test-session-token',
  refresh_token: 'test-refresh-token',
  device_info: 'Test Device',
  ip_address: '127.0.0.1',
  expires_at: new Date(Date.now() + 86400000),
  created_at: new Date(),
  ...overrides,
});

export default {
  createMockDatabase,
  createMockAuthService,
  createMockAuthMiddleware,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockRedis,
  createMockApiModule,
  createMockModelInstance,
  mockDatabaseModule,
  mockAuthModule,
  clearAllMocks,
  resetAllMocks,
  createTestUser,
  createTestJWTPayload,
  createTestSession,
};
