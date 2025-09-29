/**
 * Nexus Framework Demo Application
 * Demonstra o uso completo do framework com todos os módulos
 * 
 * @version 2.0.0
 * @example Complete Nexus App
 */

import { NexusApp } from './index.js';

// Configuração completa da aplicação
const appConfig = {
  name: 'Nexus Demo App',
  version: '1.0.0',
  environment: 'development',
  port: 3000,
  
  // Módulos a serem carregados
  modules: ['database', 'auth', 'api', 'monitoring', 'notifications'],
  
  // Configurações específicas por módulo
  database: {
    dialect: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'nexus_demo',
    username: 'postgres',
    password: 'password',
    logging: true,
    sync: true // Apenas para desenvolvimento
  },
  
  auth: {
    jwtSecret: 'demo-jwt-secret-change-in-production',
    jwtExpiresIn: '24h',
    bcryptRounds: 10,
    enableOAuth: false,
    enableTwoFactor: false
  },
  
  api: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    compression: true,
    helmet: true
  },
  
  monitoring: {
    logLevel: 'debug',
    enableMetrics: true,
    enableAlerts: true,
    alertThresholds: {
      cpu: 80,
      memory: 90,
      responseTime: 2000,
      errorRate: 5
    }
  },
  
  notifications: {
    providers: {
      email: {
        service: 'smtp',
        smtp: {
          host: 'localhost',
          port: 587,
          user: 'demo@nexus.local',
          pass: 'password'
        }
      }
    },
    templates: {
      welcome: {
        subject: 'Welcome to {{appName}}!',
        content: 'Hello {{userName}}, welcome to our platform!',
        sms: 'Welcome {{userName}}!',
        push: {
          title: 'Welcome!',
          body: 'Welcome to {{appName}}, {{userName}}!'
        }
      }
    }
  }
};

// Criar e inicializar a aplicação
async function startDemoApp() {
  try {
    console.log('🚀 Starting Nexus Demo Application...');
    
    // Criar instância da aplicação
    const app = new NexusApp(appConfig);
    
    // Adicionar middlewares customizados
    app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path}`);
      next();
    });
    
    // Event listeners
    app.on('app:started', (data) => {
      console.log('🎉 App started successfully on port:', data.port);
    });
    
    app.on('user:registered', async (user) => {
      console.log('👤 New user registered:', user.email);
      
      // Enviar notificação de boas-vindas
      const notifications = app.getModule('notifications');
      if (notifications) {
        await notifications.sendMultiChannel({
          channels: ['email', 'sms'],
          to: user.email,
          template: 'welcome',
          data: {
            userName: user.name,
            appName: appConfig.name
          }
        });
      }
    });
    
    // Inicializar e iniciar
    await app.init();
    await app.start();
    
    // Demonstrar funcionalidades
    await demonstrateFeatures(app);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });
    
    return app;
    
  } catch (error) {
    console.error('❌ Failed to start demo app:', error);
    process.exit(1);
  }
}

// Demonstrar funcionalidades do framework
async function demonstrateFeatures(app) {
  console.log('\n🎭 Demonstrating Nexus Framework Features...\n');
  
  // 1. Database Operations
  console.log('1️⃣ Database Operations:');
  const db = app.getModule('database');
  if (db) {
    try {
      // Criar um usuário de teste
      const User = db.getModel('User');
      const testUser = await User.create({
        name: 'Demo User',
        email: 'demo@nexus.local',
        password: 'demo123',
        active: true
      });
      console.log('   ✅ Test user created:', testUser.email);
      
      // Buscar usuários
      const users = await User.findAll({ limit: 5 });
      console.log(`   📊 Total users found: ${users.length}`);
      
    } catch (error) {
      console.log('   ❌ Database demo failed:', error.message);
    }
  }
  
  // 2. Authentication
  console.log('\n2️⃣ Authentication System:');
  const auth = app.getModule('auth');
  if (auth) {
    try {
      // Login demo
      const loginResult = await auth.authenticate({
        email: 'demo@nexus.local',
        password: 'demo123'
      });
      
      if (loginResult.success) {
        console.log('   ✅ Authentication successful');
        console.log('   🎫 JWT Token generated');
      }
      
    } catch (error) {
      console.log('   ❌ Auth demo failed:', error.message);
    }
  }
  
  // 3. Monitoring & Metrics
  console.log('\n3️⃣ Monitoring System:');
  const monitoring = app.getModule('monitoring');
  if (monitoring) {
    // Registrar algumas métricas de demonstração
    monitoring.recordMetric('demo_requests', Math.floor(Math.random() * 100));
    monitoring.recordMetric('demo_response_time', Math.random() * 1000);
    monitoring.log('info', 'Demo metrics recorded');
    
    const metrics = monitoring.getMetricsSummary();
    console.log('   📈 Metrics recorded:', Object.keys(metrics).length);
  }
  
  // 4. Health Check
  console.log('\n4️⃣ Health Check:');
  const health = await app.health();
  console.log('   🏥 Overall status:', health.status);
  console.log('   🔧 Modules status:', Object.keys(health.modules).map(m => 
    `${m}: ${health.modules[m].status}`
  ).join(', '));
  
  // 5. Notifications (simulado)
  console.log('\n5️⃣ Notifications System:');
  const notifications = app.getModule('notifications');
  if (notifications) {
    console.log('   📧 Email notifications ready');
    console.log('   📱 SMS notifications ready');
    console.log('   📲 Push notifications ready');
  }
  
  console.log('\n🎉 All Nexus features demonstrated successfully!\n');
  console.log('📚 Check the API documentation at: http://localhost:3000/api/docs');
  console.log('📊 Monitor health at: http://localhost:3000/monitoring/health');
  console.log('📈 View metrics at: http://localhost:3000/monitoring/metrics');
}

// API Routes de demonstração
function addDemoRoutes(app) {
  const api = app.getModule('api');
  if (!api) return;
  
  // Rota de demonstração
  api.addRoutes('/demo', (router) => {
    
    // Listar funcionalidades
    router.get('/features', (req, res) => {
      res.json({
        framework: 'Nexus',
        version: '2.0.0',
        features: [
          'Modular Architecture',
          'Database ORM with Multi-DB',
          'JWT Authentication + RBAC',
          'Express.js API Server',
          'Real-time Monitoring',
          'Multi-channel Notifications',
          'Automated Testing',
          'CLI Tools',
          'Type Safety',
          'Enterprise Security'
        ],
        modules: Array.from(app.modules.keys()),
        endpoints: {
          health: '/monitoring/health',
          metrics: '/monitoring/metrics',
          auth: '/auth/*',
          demo: '/demo/*'
        }
      });
    });
    
    // Status da aplicação
    router.get('/status', async (req, res) => {
      const health = await app.health();
      res.json({
        ...health,
        demo: true,
        timestamp: new Date().toISOString()
      });
    });
    
    // Testar notificações
    router.post('/test-notification', async (req, res) => {
      try {
        const notifications = app.getModule('notifications');
        if (!notifications) {
          return res.status(404).json({ error: 'Notifications module not loaded' });
        }
        
        const result = await notifications.sendEmail({
          to: req.body.email || 'test@example.com',
          subject: 'Nexus Test Notification',
          content: 'This is a test notification from Nexus Framework!'
        });
        
        res.json({ success: true, result });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
  });
}

// Executar se for o arquivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  startDemoApp()
    .then(app => {
      addDemoRoutes(app);
      console.log('✨ Nexus Demo App is ready for use!');
    })
    .catch(error => {
      console.error('💥 Demo app failed to start:', error);
      process.exit(1);
    });
}

export { startDemoApp, appConfig, demonstrateFeatures };