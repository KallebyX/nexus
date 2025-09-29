/**
 * API Module - Sistema de API Completo
 * Framework Nexus - Oryum
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { getDatabase } from '../database/index.js';
import { getAuthModule } from '../auth/index.js';

export class ApiModule {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.PORT || 3001,
      cors: {
        origin: config.cors?.origin || process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        ...config.cors
      },
      rateLimit: {
        windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000, // 15 min
        max: config.rateLimit?.max || 100, // requests per window
        message: { error: 'Muitas requisições, tente novamente em 15 minutos' },
        ...config.rateLimit
      },
      security: {
        contentSecurityPolicy: false, // Disable CSP for APIs
        crossOriginEmbedderPolicy: false,
        ...config.security
      },
      ...config
    };
    
    this.app = express();
    this.db = null;
    this.auth = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔌 Inicializando API Module...');
      
      // Get modules
      this.db = await getDatabase();
      this.auth = await getAuthModule();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('✅ API Module inicializado com sucesso');
      
      return this;
    } catch (error) {
      console.error('❌ Erro ao inicializar API Module:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet(this.config.security));
    
    // Compression
    this.app.use(compression());
    
    // CORS
    this.app.use(cors(this.config.cors));
    
    // Rate limiting
    const limiter = rateLimit(this.config.rateLimit);
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Make services available to routes
    this.app.locals.db = this.db;
    this.app.locals.auth = this.auth;
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
    
    // API info
    this.app.get('/api', this.apiInfo.bind(this));
    
    // Auth routes
    this.setupAuthRoutes();
    
    // User routes
    this.setupUserRoutes();
    
    // Admin routes
    this.setupAdminRoutes();
    
    // Settings routes
    this.setupSettingsRoutes();
  }

  setupAuthRoutes() {
    const router = express.Router();
    
    // Public auth endpoints
    router.post('/register', this.register.bind(this));
    router.post('/login', this.login.bind(this));
    router.post('/refresh', this.refreshToken.bind(this));
    router.post('/forgot-password', this.forgotPassword.bind(this));
    router.post('/reset-password', this.resetPassword.bind(this));
    
    // Protected auth endpoints
    router.post('/logout', this.auth.authenticate(), this.logout.bind(this));
    router.post('/change-password', this.auth.authenticate(), this.changePassword.bind(this));
    
    this.app.use('/api/auth', router);
  }

  setupUserRoutes() {
    const router = express.Router();
    
    // All user routes require authentication
    router.use(this.auth.authenticate());
    
    router.get('/profile', this.getProfile.bind(this));
    router.put('/profile', this.updateProfile.bind(this));
    router.delete('/profile', this.deleteProfile.bind(this));
    router.get('/sessions', this.getUserSessions.bind(this));
    router.delete('/sessions/:sessionId', this.deleteSession.bind(this));
    
    this.app.use('/api/user', router);
  }

  setupAdminRoutes() {
    const router = express.Router();
    
    // Admin routes require admin role
    router.use(this.auth.authenticate());
    router.use(this.auth.requireRole(['admin', 'super_admin']));
    
    // Users management
    router.get('/users', this.getUsers.bind(this));
    router.get('/users/:id', this.getUser.bind(this));
    router.put('/users/:id', this.updateUser.bind(this));
    router.delete('/users/:id', this.deleteUser.bind(this));
    router.post('/users/:id/roles', this.assignRole.bind(this));
    router.delete('/users/:id/roles/:roleId', this.removeRole.bind(this));
    
    // Roles management
    router.get('/roles', this.getRoles.bind(this));
    router.post('/roles', this.createRole.bind(this));
    router.put('/roles/:id', this.updateRole.bind(this));
    router.delete('/roles/:id', this.deleteRole.bind(this));
    
    // Permissions management
    router.get('/permissions', this.getPermissions.bind(this));
    router.post('/permissions', this.createPermission.bind(this));
    
    // Activity logs
    router.get('/logs', this.getLogs.bind(this));
    router.get('/logs/security', this.getSecurityLogs.bind(this));
    
    // System stats
    router.get('/stats', this.getSystemStats.bind(this));
    
    this.app.use('/api/admin', router);
  }

  setupSettingsRoutes() {
    const router = express.Router();
    
    // Public settings
    router.get('/public', this.getPublicSettings.bind(this));
    
    // User settings (require auth)
    router.get('/user', this.auth.authenticate(), this.getUserSettings.bind(this));
    router.put('/user', this.auth.authenticate(), this.updateUserSettings.bind(this));
    
    // Admin settings
    router.get('/admin', 
      this.auth.authenticate(), 
      this.auth.requireRole(['admin', 'super_admin']), 
      this.getAdminSettings.bind(this)
    );
    router.put('/admin', 
      this.auth.authenticate(), 
      this.auth.requireRole(['admin', 'super_admin']), 
      this.updateAdminSettings.bind(this)
    );
    
    this.app.use('/api/settings', router);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.originalUrl
      });
    });
    
    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('Erro na API:', error);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        success: false,
        error: isDevelopment ? error.message : 'Erro interno do servidor',
        ...(isDevelopment && { stack: error.stack })
      });
    });
  }

  // Route handlers
  async healthCheck(req, res) {
    try {
      const dbHealth = await this.db.healthCheck();
      const authHealth = await this.auth.healthCheck();
      
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: dbHealth,
          auth: authHealth
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async apiInfo(req, res) {
    res.json({
      name: 'Nexus Framework API',
      version: '1.0.0',
      description: 'API modular enterprise para desenvolvimento rápido',
      endpoints: {
        auth: '/api/auth/*',
        user: '/api/user/*',
        admin: '/api/admin/*',
        settings: '/api/settings/*',
        health: '/health'
      },
      documentation: '/docs',
      support: 'https://github.com/oryum/nexus'
    });
  }

  async register(req, res) {
    try {
      const result = await this.auth.register({
        ...req.body,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const result = await this.auth.login(email, password, {
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        device_info: {
          platform: req.get('User-Agent'),
          ip: req.ip
        }
      });
      
      res.json(result);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async logout(req, res) {
    try {
      const token = req.get('Authorization')?.replace('Bearer ', '');
      
      const result = await this.auth.logout(token, {
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;
      
      const result = await this.auth.refreshToken(refresh_token);
      
      res.json(result);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await this.db.User.findByPk(req.user.id, {
        include: ['role']
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        user: user.toSafeJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, search, role, status } = req.query;
      
      const where = {};
      if (search) {
        where[this.db.sequelize.Op.or] = [
          { first_name: { [this.db.sequelize.Op.iLike]: `%${search}%` } },
          { last_name: { [this.db.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [this.db.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }
      if (role) where.role_id = role;
      if (status) where.status = status;
      
      const users = await this.db.User.findAndCountAll({
        where,
        include: ['role'],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        success: true,
        users: users.rows.map(user => user.toSafeJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.count,
          pages: Math.ceil(users.count / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPublicSettings(req, res) {
    try {
      const settings = await this.db.Setting.getPublicSettings();
      
      res.json({
        success: true,
        settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🌐 API rodando na porta ${this.config.port}`);
        console.log(`📍 Health check: http://localhost:${this.config.port}/health`);
        console.log(`🔑 API endpoints: http://localhost:${this.config.port}/api/*`);
        resolve(this);
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 API servidor parado');
          resolve();
        });
      });
    }
  }
}

// Singleton instance
let apiInstance = null;

export async function initializeApi(config = {}) {
  if (!apiInstance) {
    apiInstance = new ApiModule(config);
    await apiInstance.initialize();
  }
  return apiInstance;
}

export async function getApi() {
  if (!apiInstance) {
    throw new Error('API Module não foi inicializado. Chame initializeApi() primeiro.');
  }
  return apiInstance;
}

export default ApiModule;