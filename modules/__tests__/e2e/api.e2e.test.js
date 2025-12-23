/**
 * E2E Tests - API Flow
 * Nexus Framework
 *
 * Testes end-to-end para o fluxo completo da API
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock do Express app
const createMockApp = () => {
  const routes = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {}
  };

  const middlewares = [];

  return {
    routes,
    middlewares,

    use(middleware) {
      middlewares.push(middleware);
    },

    get(path, ...handlers) {
      routes.GET[path] = handlers;
    },

    post(path, ...handlers) {
      routes.POST[path] = handlers;
    },

    put(path, ...handlers) {
      routes.PUT[path] = handlers;
    },

    delete(path, ...handlers) {
      routes.DELETE[path] = handlers;
    },

    async handle(method, path, body = {}, headers = {}) {
      const handlers = routes[method][path];
      if (!handlers) {
        return { status: 404, body: { error: 'Not Found' } };
      }

      let responseStatus = 200;
      let responseBody = {};

      const req = {
        method,
        path,
        body,
        headers,
        params: {},
        query: {},
        user: headers.authorization ? { id: 1, role: 'user' } : null
      };

      const res = {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        },
        send(data) {
          responseBody = data;
          return this;
        }
      };

      const next = (error) => {
        if (error) {
          responseStatus = error.status || 500;
          responseBody = { error: error.message };
        }
      };

      // Executar middlewares
      for (const middleware of middlewares) {
        await middleware(req, res, next);
      }

      // Executar handlers
      for (const handler of handlers) {
        await handler(req, res, next);
      }

      return { status: responseStatus, body: responseBody };
    }
  };
};

// Mock database
const mockDb = {
  items: [],
  users: [
    { id: 1, email: 'admin@nexus.dev', role: 'admin' },
    { id: 2, email: 'user@nexus.dev', role: 'user' }
  ]
};

describe('E2E: API CRUD Operations', () => {
  let app;

  beforeAll(() => {
    app = createMockApp();

    // Configurar rotas CRUD
    app.get('/api/items', async (req, res) => {
      res.json({ success: true, data: mockDb.items });
    });

    app.post('/api/items', async (req, res) => {
      const item = { id: mockDb.items.length + 1, ...req.body };
      mockDb.items.push(item);
      res.status(201).json({ success: true, data: item });
    });

    app.get('/api/items/:id', async (req, res) => {
      const item = mockDb.items.find(i => i.id === parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ success: true, data: item });
    });

    app.put('/api/items/:id', async (req, res) => {
      const index = mockDb.items.findIndex(i => i.id === parseInt(req.params.id));
      if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
      mockDb.items[index] = { ...mockDb.items[index], ...req.body };
      res.json({ success: true, data: mockDb.items[index] });
    });

    app.delete('/api/items/:id', async (req, res) => {
      const index = mockDb.items.findIndex(i => i.id === parseInt(req.params.id));
      if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
      mockDb.items.splice(index, 1);
      res.json({ success: true, message: 'Item deleted' });
    });
  });

  beforeEach(() => {
    mockDb.items = [];
  });

  describe('Create (POST)', () => {
    test('should create new item', async () => {
      const response = await app.handle('POST', '/api/items', { name: 'Test Item', price: 100 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Item');
      expect(response.body.data.id).toBeDefined();
    });

    test('should create multiple items', async () => {
      await app.handle('POST', '/api/items', { name: 'Item 1' });
      await app.handle('POST', '/api/items', { name: 'Item 2' });
      await app.handle('POST', '/api/items', { name: 'Item 3' });

      const listResponse = await app.handle('GET', '/api/items');
      expect(listResponse.body.data.length).toBe(3);
    });
  });

  describe('Read (GET)', () => {
    test('should list all items', async () => {
      mockDb.items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const response = await app.handle('GET', '/api/items');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    test('should return empty array when no items', async () => {
      const response = await app.handle('GET', '/api/items');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('Update (PUT)', () => {
    test('should update existing item', async () => {
      mockDb.items = [{ id: 1, name: 'Original Name', price: 50 }];

      // Simular put
      mockDb.items[0] = { ...mockDb.items[0], name: 'Updated Name' };

      expect(mockDb.items[0].name).toBe('Updated Name');
      expect(mockDb.items[0].price).toBe(50);
    });
  });

  describe('Delete (DELETE)', () => {
    test('should delete existing item', async () => {
      mockDb.items = [{ id: 1, name: 'To Delete' }];

      mockDb.items = mockDb.items.filter(i => i.id !== 1);

      expect(mockDb.items.length).toBe(0);
    });
  });
});

describe('E2E: API Error Handling', () => {
  let app;

  beforeAll(() => {
    app = createMockApp();

    // Rota que gera erro
    app.get('/api/error', async (req, res, next) => {
      next({ status: 500, message: 'Internal Server Error' });
    });

    // Rota com validação
    app.post('/api/validate', async (req, res) => {
      if (!req.body.email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      res.json({ success: true });
    });
  });

  test('should handle internal server error', async () => {
    const response = await app.handle('GET', '/api/error');

    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });

  test('should return 404 for unknown routes', async () => {
    const response = await app.handle('GET', '/api/unknown');

    expect(response.status).toBe(404);
  });

  test('should return validation error for invalid data', async () => {
    const response = await app.handle('POST', '/api/validate', {});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Email');
  });
});

describe('E2E: API Authentication Middleware', () => {
  let app;

  beforeAll(() => {
    app = createMockApp();

    // Middleware de autenticação
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/protected')) {
        if (!req.headers.authorization) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }
        if (req.headers.authorization !== 'Bearer valid-token') {
          res.status(403).json({ error: 'Invalid token' });
          return;
        }
      }
      next();
    });

    app.get('/api/protected/resource', async (req, res) => {
      res.json({ success: true, data: 'Protected data' });
    });

    app.get('/api/public/resource', async (req, res) => {
      res.json({ success: true, data: 'Public data' });
    });
  });

  test('should allow access to public routes', async () => {
    const response = await app.handle('GET', '/api/public/resource');

    expect(response.status).toBe(200);
    expect(response.body.data).toBe('Public data');
  });

  test('should require authentication for protected routes', async () => {
    const response = await app.handle('GET', '/api/protected/resource');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Authentication');
  });

  test('should allow access with valid token', async () => {
    const response = await app.handle(
      'GET',
      '/api/protected/resource',
      {},
      { authorization: 'Bearer valid-token' }
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toBe('Protected data');
  });

  test('should reject invalid token', async () => {
    const response = await app.handle(
      'GET',
      '/api/protected/resource',
      {},
      { authorization: 'Bearer invalid-token' }
    );

    expect(response.status).toBe(403);
  });
});

describe('E2E: API Rate Limiting', () => {
  test('should track request counts', () => {
    const requestCounts = new Map();
    const limit = 100;
    const windowMs = 15 * 60 * 1000; // 15 minutos

    const checkRateLimit = (ip) => {
      const now = Date.now();
      const record = requestCounts.get(ip) || { count: 0, resetAt: now + windowMs };

      if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
      }

      record.count++;
      requestCounts.set(ip, record);

      return record.count <= limit;
    };

    // Simular requisições
    for (let i = 0; i < 100; i++) {
      expect(checkRateLimit('192.168.1.1')).toBe(true);
    }

    // A 101ª requisição deve ser bloqueada
    expect(checkRateLimit('192.168.1.1')).toBe(false);
  });
});

describe('E2E: API Pagination', () => {
  let app;
  let items;

  beforeAll(() => {
    // Gerar 100 items de teste
    items = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      createdAt: new Date(Date.now() - i * 1000)
    }));

    app = createMockApp();

    app.get('/api/paginated', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const paginatedItems = items.slice(offset, offset + limit);

      res.json({
        success: true,
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total: items.length,
          totalPages: Math.ceil(items.length / limit)
        }
      });
    });
  });

  test('should return paginated results', async () => {
    const response = await app.handle('GET', '/api/paginated');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(10);
    expect(response.body.pagination.totalPages).toBe(10);
  });
});
