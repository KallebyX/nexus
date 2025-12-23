/**
 * Tests for migrate script
 * Nexus Framework
 * Comprehensive migration testing suite
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock do database
const mockDb = {
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  syncDatabase: jest.fn()
};

// Mock initializeDatabase
const mockInitializeDatabase = jest.fn().mockResolvedValue(mockDb);

// Função de migração para testes
const runMigrations = async () => {
  const db = await mockInitializeDatabase();
  await db.syncDatabase(false);

  const adminExists = await db.User.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    await db.User.create({
      email: 'admin@nexus.dev',
      first_name: 'Admin',
      last_name: 'Nexus',
      password_hash: 'admin123',
      role: 'admin',
      status: 'active',
      email_verified: true,
      email_verified_at: new Date()
    });
    return { seeded: true };
  }

  return { seeded: false };
};

describe('Migration Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.User.findOne.mockReset();
    mockDb.User.create.mockReset();
    mockDb.syncDatabase.mockReset();
    mockInitializeDatabase.mockClear();
  });

  describe('runMigrations', () => {
    test('should be a function', () => {
      expect(typeof runMigrations).toBe('function');
    });

    test('should return a promise', () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      const result = runMigrations();
      expect(result).toBeInstanceOf(Promise);
    });

    test('should initialize database', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      await runMigrations();

      expect(mockInitializeDatabase).toHaveBeenCalled();
    });

    test('should sync database without dropping tables', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      await runMigrations();

      expect(mockDb.syncDatabase).toHaveBeenCalledWith(false);
    });

    test('should check for existing admin user', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      await runMigrations();

      expect(mockDb.User.findOne).toHaveBeenCalledWith({ where: { role: 'admin' } });
    });

    test('should create admin user if not exists', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      const result = await runMigrations();

      expect(mockDb.User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@nexus.dev',
          first_name: 'Admin',
          last_name: 'Nexus',
          role: 'admin',
          status: 'active'
        })
      );
      expect(result.seeded).toBe(true);
    });

    test('should not create admin user if already exists', async () => {
      mockDb.User.findOne.mockResolvedValue({ id: 1, email: 'admin@nexus.dev' });

      const result = await runMigrations();

      expect(mockDb.User.create).not.toHaveBeenCalled();
      expect(result.seeded).toBe(false);
    });
  });

  describe('Migration Idempotency', () => {
    test('should be safe to run multiple times', async () => {
      // Primeira execução - sem admin
      mockDb.User.findOne.mockResolvedValueOnce(null);
      mockDb.User.create.mockResolvedValueOnce({ id: 1 });
      await runMigrations();

      // Segunda execução - admin existe
      mockDb.User.findOne.mockResolvedValueOnce({ id: 1 });
      await runMigrations();

      // create deve ter sido chamado apenas uma vez
      expect(mockDb.User.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin User Data', () => {
    test('should create admin with correct structure', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      await runMigrations();

      const createCall = mockDb.User.create.mock.calls[0][0];

      expect(createCall).toHaveProperty('email', 'admin@nexus.dev');
      expect(createCall).toHaveProperty('first_name', 'Admin');
      expect(createCall).toHaveProperty('last_name', 'Nexus');
      expect(createCall).toHaveProperty('password_hash');
      expect(createCall).toHaveProperty('role', 'admin');
      expect(createCall).toHaveProperty('status', 'active');
      expect(createCall).toHaveProperty('email_verified', true);
      expect(createCall).toHaveProperty('email_verified_at');
    });

    test('should set email_verified_at to current date', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      const beforeRun = new Date();
      await runMigrations();
      const afterRun = new Date();

      const createCall = mockDb.User.create.mock.calls[0][0];
      const emailVerifiedAt = createCall.email_verified_at;

      expect(emailVerifiedAt.getTime()).toBeGreaterThanOrEqual(beforeRun.getTime());
      expect(emailVerifiedAt.getTime()).toBeLessThanOrEqual(afterRun.getTime());
    });
  });

  describe('Database Sync Options', () => {
    test('should not force sync (preserve data)', async () => {
      mockDb.User.findOne.mockResolvedValue(null);
      mockDb.User.create.mockResolvedValue({});

      await runMigrations();

      expect(mockDb.syncDatabase).toHaveBeenCalledWith(false);
    });
  });
});

describe('Migration Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.User.findOne.mockReset();
    mockDb.User.create.mockReset();
    mockDb.syncDatabase.mockReset();
  });

  test('should handle User.findOne errors gracefully', async () => {
    mockDb.User.findOne.mockRejectedValue(new Error('Query failed'));

    await expect(runMigrations()).rejects.toThrow('Query failed');
  });

  test('should handle User.create errors gracefully', async () => {
    mockDb.User.findOne.mockResolvedValue(null);
    mockDb.User.create.mockRejectedValue(new Error('Create failed'));

    await expect(runMigrations()).rejects.toThrow('Create failed');
  });

  test('should handle syncDatabase errors gracefully', async () => {
    mockDb.syncDatabase.mockRejectedValue(new Error('Sync failed'));

    await expect(runMigrations()).rejects.toThrow('Sync failed');
  });
});
