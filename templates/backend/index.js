/**
 * Template completo de Backend - Oryum Nexus
 * Express.js com autenticação, banco de dados, middlewares e APIs
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { AuthModule } from '../../modules/auth/index.js';
import { DatabaseModule } from '../../modules/database/index.js';
import { MonitoringModule } from '../../modules/monitoring/index.js';
import { PaymentsModule } from '../../modules/payments/index.js';
import { NotificationsModule } from '../../modules/notifications/index.js';
import { IntegrationsModule } from '../../integrations/index.js';

export class BackendTemplate {
  constructor(config = {}) {
    this.config = {
      port: process.env.PORT || 3001,
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // max requests por window
      },
      database: {
        url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/nexus'
      },
      ...config
    };

    this.app = express();
    this.modules = {};
    
    this.initializeModules();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async initializeModules() {
    console.log('🚀 Inicializando módulos do backend...');

    // Autenticação
    this.modules.auth = new AuthModule({
      jwtSecret: process.env.JWT_SECRET,
      providers: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
      }
    });

    // Banco de dados
    this.modules.database = new DatabaseModule({
      connectionString: this.config.database.url
    });

    // Monitoramento
    this.modules.monitoring = new MonitoringModule({
      logLevel: process.env.LOG_LEVEL || 'info'
    });

    // Pagamentos
    this.modules.payments = new PaymentsModule({
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      }
    });

    // Notificações
    this.modules.notifications = new NotificationsModule();

    // Integrações
    this.modules.integrations = new IntegrationsModule();

    console.log('✅ Módulos inicializados com sucesso');
  }

  setupMiddlewares() {
    // Segurança
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));

    // CORS
    this.app.use(cors(this.config.cors));

    // Compressão
    this.app.use(compression());

    // Rate limiting
    this.app.use(rateLimit(this.config.rateLimit));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging de requests
    this.app.use((req, res, next) => {
      this.modules.monitoring.logRequest(req);
      next();
    });

    // Middleware de autenticação
    this.app.use('/api', this.modules.auth.middleware());

    // Middleware de integrações (webhooks)
    this.app.use(this.modules.integrations.webhookMiddleware());
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = {
          status: 'healthy',
          timestamp: new Date(),
          uptime: process.uptime(),
          modules: {}
        };

        // Health check de cada módulo
        for (const [name, module] of Object.entries(this.modules)) {
          if (typeof module.healthCheck === 'function') {
            health.modules[name] = await module.healthCheck();
          }
        }

        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Rota de informações da API
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Nexus Backend API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          payments: '/api/payments',
          notifications: '/api/notifications',
          webhooks: '/webhooks'
        }
      });
    });

    // Rotas de autenticação
    this.setupAuthRoutes();

    // Rotas de usuários
    this.setupUserRoutes();

    // Rotas de pagamentos
    this.setupPaymentRoutes();

    // Rotas de notificações
    this.setupNotificationRoutes();

    // Rotas de dados
    this.setupDataRoutes();

    // Rotas de admin
    this.setupAdminRoutes();
  }

  setupAuthRoutes() {
    const router = express.Router();

    // Registro de usuário
    router.post('/register', async (req, res) => {
      try {
        const { email, password, name } = req.body;

        // Validação básica
        if (!email || !password || !name) {
          return res.status(400).json({
            error: 'Email, senha e nome são obrigatórios'
          });
        }

        // Verificar se usuário já existe
        const existingUser = await this.modules.database.findUser({ email });
        if (existingUser) {
          return res.status(409).json({
            error: 'Usuário já existe'
          });
        }

        // Criar usuário
        const hashedPassword = await this.modules.auth.hashPassword(password);
        const user = await this.modules.database.createUser({
          email,
          password: hashedPassword,
          name,
          role: 'user'
        });

        // Gerar tokens
        const tokens = await this.modules.auth.generateTokens(user);

        // Enviar email de boas-vindas
        await this.modules.notifications.sendEmail({
          to: email,
          template: 'welcome',
          templateData: {
            userName: name,
            appName: 'Nexus',
            loginUrl: `${process.env.FRONTEND_URL}/login`
          }
        });

        res.status(201).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          tokens
        });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'auth_register' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Login
    router.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            error: 'Email e senha são obrigatórios'
          });
        }

        // Buscar usuário
        const user = await this.modules.database.findUser({ email });
        if (!user) {
          return res.status(401).json({
            error: 'Credenciais inválidas'
          });
        }

        // Verificar senha
        const isValidPassword = await this.modules.auth.verifyPassword(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            error: 'Credenciais inválidas'
          });
        }

        // Gerar tokens
        const tokens = await this.modules.auth.generateTokens(user);

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          tokens
        });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'auth_login' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Refresh token
    router.post('/refresh', async (req, res) => {
      try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
          return res.status(400).json({
            error: 'Refresh token é obrigatório'
          });
        }

        const tokens = await this.modules.auth.refreshTokens(refreshToken);
        res.json({ success: true, tokens });
      } catch (error) {
        res.status(401).json({ error: 'Refresh token inválido' });
      }
    });

    // Logout
    router.post('/logout', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        await this.modules.auth.revokeTokens(req.user.id);
        res.json({ success: true, message: 'Logout realizado com sucesso' });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'auth_logout' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    this.app.use('/api/auth', router);
  }

  setupUserRoutes() {
    const router = express.Router();

    // Obter perfil do usuário
    router.get('/profile', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const user = await this.modules.database.findUser({ id: req.user.id });
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt
          }
        });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'user_profile' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Atualizar perfil
    router.put('/profile', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { name, email } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (email) updates.email = email;

        const user = await this.modules.database.updateUser(req.user.id, updates);
        
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'user_update' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Listar usuários (admin)
    router.get('/', this.modules.auth.requireRole('admin'), async (req, res) => {
      try {
        const { page = 1, limit = 10 } = req.query;
        const users = await this.modules.database.findUsers({
          page: parseInt(page),
          limit: parseInt(limit)
        });

        res.json({ success: true, users });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'users_list' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    this.app.use('/api/users', router);
  }

  setupPaymentRoutes() {
    const router = express.Router();

    // Criar sessão de checkout
    router.post('/checkout', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { items, successUrl, cancelUrl } = req.body;

        const session = await this.modules.payments.createCheckoutSession({
          customerId: req.user.id,
          items,
          successUrl,
          cancelUrl
        });

        res.json({ success: true, session });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'payment_checkout' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Webhook do Stripe
    router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
      try {
        await this.modules.payments.handleStripeWebhook(req.body, req.headers['stripe-signature']);
        res.status(200).send('OK');
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'stripe_webhook' });
        res.status(400).send('Webhook Error');
      }
    });

    // Histórico de pagamentos
    router.get('/history', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const payments = await this.modules.payments.getCustomerPayments(req.user.id);
        res.json({ success: true, payments });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'payment_history' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    this.app.use('/api/payments', router);
  }

  setupNotificationRoutes() {
    const router = express.Router();

    // Enviar notificação
    router.post('/send', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { type, recipients, message, template, templateData } = req.body;

        let result;
        switch (type) {
          case 'email':
            result = await this.modules.notifications.sendEmail({
              to: recipients,
              template,
              templateData
            });
            break;
          case 'sms':
            result = await this.modules.notifications.sendSMS({
              to: recipients,
              template,
              templateData
            });
            break;
          default:
            return res.status(400).json({ error: 'Tipo de notificação inválido' });
        }

        res.json({ success: true, result });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'notification_send' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    this.app.use('/api/notifications', router);
  }

  setupDataRoutes() {
    const router = express.Router();

    // CRUD genérico para qualquer entidade
    router.get('/:entity', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { entity } = req.params;
        const { page = 1, limit = 10, ...filters } = req.query;

        const data = await this.modules.database.find(entity, {
          filters,
          page: parseInt(page),
          limit: parseInt(limit)
        });

        res.json({ success: true, data });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'data_get' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    router.post('/:entity', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { entity } = req.params;
        const data = req.body;

        const result = await this.modules.database.create(entity, {
          ...data,
          createdBy: req.user.id
        });

        res.status(201).json({ success: true, data: result });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'data_create' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    router.put('/:entity/:id', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { entity, id } = req.params;
        const data = req.body;

        const result = await this.modules.database.update(entity, id, {
          ...data,
          updatedBy: req.user.id
        });

        res.json({ success: true, data: result });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'data_update' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    router.delete('/:entity/:id', this.modules.auth.requireAuth(), async (req, res) => {
      try {
        const { entity, id } = req.params;

        await this.modules.database.delete(entity, id);
        res.json({ success: true, message: 'Registro deletado' });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'data_delete' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    this.app.use('/api/data', router);
  }

  setupAdminRoutes() {
    const router = express.Router();

    // Dashboard de métricas
    router.get('/dashboard', this.modules.auth.requireRole('admin'), async (req, res) => {
      try {
        const metrics = await this.modules.monitoring.getMetrics();
        const userCount = await this.modules.database.count('users');
        const paymentCount = await this.modules.database.count('payments');

        res.json({
          success: true,
          dashboard: {
            metrics,
            stats: {
              users: userCount,
              payments: paymentCount,
              uptime: process.uptime()
            }
          }
        });
      } catch (error) {
        this.modules.monitoring.logError(error, { context: 'admin_dashboard' });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Logs do sistema
    router.get('/logs', this.modules.auth.requireRole('admin'), async (req, res) => {
      try {
        const { level, limit = 100 } = req.query;
        const logs = await this.modules.monitoring.getLogs({ level, limit });
        res.json({ success: true, logs });
      } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    this.app.use('/api/admin', router);
  }

  setupErrorHandling() {
    // 404 Handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl
      });
    });

    // Error Handler
    this.app.use((error, req, res, next) => {
      this.modules.monitoring.logError(error, {
        context: 'global_error_handler',
        path: req.path,
        method: req.method
      });

      if (res.headersSent) {
        return next(error);
      }

      res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    });
  }

  async start() {
    try {
      // Conectar ao banco de dados
      await this.modules.database.connect();

      // Iniciar servidor
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Backend rodando na porta ${this.config.port}`);
        console.log(`📍 Health check: http://localhost:${this.config.port}/health`);
        console.log(`📍 API docs: http://localhost:${this.config.port}/api`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    console.log('🛑 Iniciando shutdown graceful...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Servidor HTTP fechado');
      });
    }

    // Fechar conexões de banco
    if (this.modules.database) {
      await this.modules.database.disconnect();
    }

    console.log('✅ Shutdown concluído');
    process.exit(0);
  }
}

export default BackendTemplate;