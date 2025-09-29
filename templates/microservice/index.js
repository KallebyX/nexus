/**
 * Template de Microsserviço - Oryum Nexus
 * Microsserviço com Docker, healthcheck, métricas e comunicação inter-serviços
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { MonitoringModule } from '../../modules/monitoring/index.js';
import { DatabaseModule } from '../../modules/database/index.js';
import { AuthModule } from '../../modules/auth/index.js';

export class MicroserviceTemplate {
  constructor(config = {}) {
    this.config = {
      name: config.name || 'nexus-microservice',
      version: config.version || '1.0.0',
      port: process.env.PORT || 3000,
      environment: process.env.NODE_ENV || 'development',
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
      },
      database: {
        url: process.env.DATABASE_URL
      },
      auth: {
        enabled: config.auth?.enabled !== false,
        jwtSecret: process.env.JWT_SECRET,
        publicKey: process.env.JWT_PUBLIC_KEY
      },
      serviceDiscovery: {
        enabled: config.serviceDiscovery?.enabled || false,
        consulUrl: process.env.CONSUL_URL || 'http://localhost:8500',
        healthCheckInterval: 30000
      },
      messaging: {
        enabled: config.messaging?.enabled || false,
        broker: process.env.MESSAGE_BROKER || 'redis://localhost:6379'
      },
      tracing: {
        enabled: config.tracing?.enabled || false,
        jaegerUrl: process.env.JAEGER_URL
      },
      ...config
    };

    this.app = express();
    this.modules = {};
    this.isReady = false;
    this.isHealthy = true;

    this.initializeModules();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async initializeModules() {
    console.log(`🚀 Inicializando microsserviço: ${this.config.name}`);

    // Monitoramento (sempre ativo)
    this.modules.monitoring = new MonitoringModule({
      serviceName: this.config.name,
      logLevel: process.env.LOG_LEVEL || 'info'
    });

    // Banco de dados (opcional)
    if (this.config.database.url) {
      this.modules.database = new DatabaseModule({
        connectionString: this.config.database.url,
        serviceName: this.config.name
      });
    }

    // Autenticação (opcional)
    if (this.config.auth.enabled) {
      this.modules.auth = new AuthModule({
        jwtSecret: this.config.auth.jwtSecret,
        publicKey: this.config.auth.publicKey,
        microservice: true
      });
    }

    // Service Discovery (opcional)
    if (this.config.serviceDiscovery.enabled) {
      await this.setupServiceDiscovery();
    }

    // Message Broker (opcional)
    if (this.config.messaging.enabled) {
      await this.setupMessaging();
    }

    // Tracing (opcional)
    if (this.config.tracing.enabled) {
      await this.setupTracing();
    }

    console.log('✅ Módulos do microsserviço inicializados');
  }

  setupMiddlewares() {
    // Segurança básica
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));
    this.app.use(compression());

    // Parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      this.modules.monitoring.logRequest(req);
      next();
    });

    // Request ID e Tracing
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] || this.generateRequestId();
      res.setHeader('X-Request-ID', req.id);
      
      if (this.config.tracing.enabled) {
        req.span = this.startSpan(`${req.method} ${req.path}`, req.id);
      }
      
      next();
    });

    // Autenticação (se habilitada)
    if (this.config.auth.enabled) {
      this.app.use('/api', this.modules.auth.middleware());
    }
  }

  setupRoutes() {
    // Health checks (padrão Kubernetes)
    this.app.get('/health', (req, res) => {
      const health = {
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        service: this.config.name,
        version: this.config.version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime())
      };

      const statusCode = this.isHealthy ? 200 : 503;
      res.status(statusCode).json(health);
    });

    this.app.get('/health/ready', (req, res) => {
      const ready = {
        status: this.isReady ? 'ready' : 'not_ready',
        service: this.config.name,
        timestamp: new Date().toISOString()
      };

      const statusCode = this.isReady ? 200 : 503;
      res.status(statusCode).json(ready);
    });

    this.app.get('/health/live', (req, res) => {
      res.status(200).json({
        status: 'alive',
        service: this.config.name,
        timestamp: new Date().toISOString()
      });
    });

    // Métricas (Prometheus format)
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.modules.monitoring.getPrometheusMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        res.status(500).send('Error generating metrics');
      }
    });

    // Info do serviço
    this.app.get('/info', (req, res) => {
      res.json({
        name: this.config.name,
        version: this.config.version,
        environment: this.config.environment,
        description: this.config.description || 'Nexus Microservice',
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        features: {
          database: !!this.modules.database,
          auth: this.config.auth.enabled,
          serviceDiscovery: this.config.serviceDiscovery.enabled,
          messaging: this.config.messaging.enabled,
          tracing: this.config.tracing.enabled
        }
      });
    });

    // Rotas da API do serviço
    this.setupServiceRoutes();
  }

  setupServiceRoutes() {
    const router = express.Router();

    // Exemplo de endpoint básico
    router.get('/', (req, res) => {
      res.json({
        message: `${this.config.name} is running`,
        version: this.config.version,
        timestamp: new Date().toISOString()
      });
    });

    // Endpoint para processamento customizado
    router.post('/process', async (req, res) => {
      try {
        const startTime = Date.now();
        
        // Processar dados
        const result = await this.processData(req.body);
        
        const processingTime = Date.now() - startTime;
        this.modules.monitoring.recordMetric('processing_time', processingTime);

        res.json({
          success: true,
          result,
          processingTime
        });
      } catch (error) {
        this.modules.monitoring.logError(error, { 
          context: 'process_data',
          requestId: req.id 
        });
        res.status(500).json({
          success: false,
          error: 'Processing failed'
        });
      }
    });

    // Comunicação entre serviços
    router.post('/internal/notify', async (req, res) => {
      try {
        const { event, data } = req.body;
        await this.handleInternalNotification(event, data);
        res.json({ success: true });
      } catch (error) {
        this.modules.monitoring.logError(error, { 
          context: 'internal_notify',
          requestId: req.id 
        });
        res.status(500).json({
          success: false,
          error: 'Notification failed'
        });
      }
    });

    this.app.use('/api', router);
  }

  async processData(data) {
    // Implementação específica do serviço
    // Este método deve ser sobrescrito pela implementação concreta
    console.log(`Processing data in ${this.config.name}:`, data);
    
    // Simulação de processamento
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      processed: true,
      timestamp: new Date().toISOString(),
      originalData: data
    };
  }

  async handleInternalNotification(event, data) {
    console.log(`Handling internal notification: ${event}`, data);
    
    // Implementação específica do serviço
    switch (event) {
      case 'user_created':
        await this.onUserCreated(data);
        break;
      case 'payment_processed':
        await this.onPaymentProcessed(data);
        break;
      default:
        console.log(`Unknown event: ${event}`);
    }
  }

  async onUserCreated(userData) {
    // Override em implementações específicas
    console.log('User created:', userData);
  }

  async onPaymentProcessed(paymentData) {
    // Override em implementações específicas
    console.log('Payment processed:', paymentData);
  }

  async setupServiceDiscovery() {
    // Implementação simplificada de service discovery
    console.log('🔍 Configurando service discovery...');
    
    // Registrar serviço no Consul ou similar
    const serviceInfo = {
      ID: `${this.config.name}-${this.generateInstanceId()}`,
      Name: this.config.name,
      Tags: ['nexus', 'microservice'],
      Address: process.env.SERVICE_HOST || 'localhost',
      Port: this.config.port,
      Check: {
        HTTP: `http://localhost:${this.config.port}/health`,
        Interval: '30s'
      }
    };

    // Simular registro no service discovery
    console.log('Service registered:', serviceInfo);
  }

  async setupMessaging() {
    console.log('📨 Configurando messaging...');
    
    // Configurar conexão com message broker (Redis, RabbitMQ, etc.)
    // Implementação específica dependendo do broker escolhido
    
    this.messageHandlers = new Map();
    
    // Adicionar handlers padrão
    this.addMessageHandler('service.health.check', async (message) => {
      return {
        service: this.config.name,
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      };
    });
  }

  addMessageHandler(topic, handler) {
    this.messageHandlers.set(topic, handler);
    console.log(`📨 Message handler adicionado: ${topic}`);
  }

  async publishMessage(topic, message) {
    // Publicar mensagem no broker
    console.log(`📤 Publishing message to ${topic}:`, message);
    
    // Implementação específica do broker
    this.modules.monitoring.recordMetric('messages_published', 1, { topic });
  }

  async setupTracing() {
    console.log('🔍 Configurando distributed tracing...');
    
    // Configurar Jaeger ou similar
    // Implementação específica do sistema de tracing
  }

  startSpan(operationName, requestId) {
    // Criar span para tracing distribuído
    return {
      operationName,
      requestId,
      startTime: Date.now(),
      finish: () => {
        const duration = Date.now() - this.startTime;
        this.modules.monitoring.recordMetric('span_duration', duration, { 
          operation: operationName 
        });
      }
    };
  }

  generateRequestId() {
    return `${this.config.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateInstanceId() {
    return `${process.env.HOSTNAME || 'local'}-${Date.now()}`;
  }

  setupErrorHandling() {
    // 404 Handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        service: this.config.name,
        path: req.originalUrl
      });
    });

    // Global Error Handler
    this.app.use((error, req, res, next) => {
      this.modules.monitoring.logError(error, {
        context: 'global_error_handler',
        service: this.config.name,
        requestId: req.id,
        path: req.path,
        method: req.method
      });

      if (res.headersSent) {
        return next(error);
      }

      res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        service: this.config.name,
        requestId: req.id,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    });
  }

  async start() {
    try {
      // Conectar dependências
      if (this.modules.database) {
        await this.modules.database.connect();
      }

      // Executar health checks
      await this.runStartupHealthChecks();

      // Iniciar servidor
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 ${this.config.name} rodando na porta ${this.config.port}`);
        console.log(`📍 Health: http://localhost:${this.config.port}/health`);
        console.log(`📍 Metrics: http://localhost:${this.config.port}/metrics`);
        console.log(`📍 Info: http://localhost:${this.config.port}/info`);
        
        this.isReady = true;
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error(`❌ Erro ao iniciar ${this.config.name}:`, error);
      this.isHealthy = false;
      process.exit(1);
    }
  }

  async runStartupHealthChecks() {
    console.log('🏥 Executando health checks de inicialização...');
    
    const checks = [];

    // Check database
    if (this.modules.database) {
      checks.push(this.modules.database.healthCheck());
    }

    // Check external dependencies
    checks.push(this.checkExternalDependencies());

    try {
      await Promise.all(checks);
      console.log('✅ Todos os health checks passaram');
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      throw error;
    }
  }

  async checkExternalDependencies() {
    // Verificar dependências externas (APIs, outros serviços, etc.)
    // Implementar conforme necessário
    return true;
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`🛑 Recebido ${signal}, iniciando shutdown graceful...`);
      this.isHealthy = false;
      this.isReady = false;

      // Parar de aceitar novas conexões
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Servidor HTTP fechado');
        });
      }

      // Fechar conexões de banco
      if (this.modules.database) {
        await this.modules.database.disconnect();
      }

      // Unregister do service discovery
      if (this.config.serviceDiscovery.enabled) {
        await this.unregisterFromServiceDiscovery();
      }

      console.log('✅ Shutdown concluído');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async unregisterFromServiceDiscovery() {
    console.log('🔍 Removendo serviço do service discovery...');
    // Implementar remoção do registro
  }

  // Método para criar Dockerfile
  generateDockerfile() {
    return `
# Dockerfile para ${this.config.name}
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:\${PORT:-3000}/health || exit 1

EXPOSE \${PORT:-3000}

CMD ["npm", "start"]
`;
  }

  // Método para criar docker-compose.yml
  generateDockerCompose() {
    return `
version: '3.8'

services:
  ${this.config.name}:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=\${DATABASE_URL}
      - JWT_SECRET=\${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ${this.config.name}
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
`;
  }

  // Health check detalhado
  async detailedHealthCheck() {
    const health = {
      service: this.config.name,
      version: this.config.version,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      dependencies: {}
    };

    try {
      // Check database
      if (this.modules.database) {
        health.dependencies.database = await this.modules.database.healthCheck();
      }

      // Check external APIs
      health.dependencies.external = await this.checkExternalDependencies();

      // Determinar status geral
      const hasUnhealthyDeps = Object.values(health.dependencies)
        .some(dep => dep.status !== 'healthy' && dep.status !== 'connected');
      
      if (hasUnhealthyDeps) {
        health.status = 'degraded';
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }
}

export default MicroserviceTemplate;
`;