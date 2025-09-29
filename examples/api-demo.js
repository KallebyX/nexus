/**
 * API Example - Nexus Framework Demo
 * Exemplo completo de API usando todos os módulos do framework
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './modules/database/index.js';
import { initializeAuthModule } from './modules/auth/index.js';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Muitas requisições, tente novamente em 15 minutos'
  }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Nexus Framework
let nexus = {
  db: null,
  auth: null
};

async function initializeNexus() {
  try {
    console.log('🚀 Inicializando Nexus Framework...');
    
    // Initialize database
    nexus.db = await initializeDatabase({
      postgres: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'nexus_dev',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        logging: process.env.NODE_ENV === 'development'
      }
    });
    
    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await nexus.db.syncDatabase();
    }
    
    // Initialize auth
    nexus.auth = await initializeAuthModule({
      jwtSecret: process.env.JWT_SECRET || 'nexus-demo-secret',
      jwtExpiresIn: '7d'
    });
    
    // Make available to routes
    app.locals.nexus = nexus;
    
    console.log('✅ Nexus Framework inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Nexus Framework:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await nexus.db.healthCheck();
    const authHealth = await nexus.auth.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: dbHealth,
        auth: authHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    
    const result = await nexus.auth.register({
      email,
      password,
      first_name,
      last_name,
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
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await nexus.auth.login(email, password, {
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
});

app.post('/api/auth/logout', nexus.auth?.authenticate(), async (req, res) => {
  try {
    const token = req.get('Authorization')?.replace('Bearer ', '');
    
    const result = await nexus.auth.logout(token, {
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
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    const result = await nexus.auth.refreshToken(refresh_token);
    
    res.json(result);
    
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Protected Routes (require authentication)
app.get('/api/profile', nexus.auth?.authenticate(), async (req, res) => {
  try {
    const user = await nexus.db.User.findByPk(req.user.id, {
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
});

// Admin Routes (require admin role)
app.get('/api/admin/users', 
  nexus.auth?.authenticate(),
  nexus.auth?.requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const where = {};
      if (search) {
        where[nexus.db.sequelize.Op.or] = [
          { first_name: { [nexus.db.sequelize.Op.iLike]: `%${search}%` } },
          { last_name: { [nexus.db.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [nexus.db.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }
      
      const users = await nexus.db.User.findAndCountAll({
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
);

// Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await nexus.db.Setting.getPublicSettings();
    
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
});

app.get('/api/admin/settings',
  nexus.auth?.authenticate(),
  nexus.auth?.requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const { category } = req.query;
      
      const settings = await nexus.db.Setting.getByCategory(category || 'general', true);
      
      res.json({
        success: true,
        settings: settings.map(setting => setting.toAdminJSON())
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Activity Logs
app.get('/api/admin/logs',
  nexus.auth?.authenticate(),
  nexus.auth?.requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, action, user_id } = req.query;
      
      const where = {};
      if (action) where.action = action;
      if (user_id) where.user_id = user_id;
      
      const logs = await nexus.db.ActivityLog.findAndCountAll({
        where,
        include: [
          {
            model: nexus.db.User,
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        success: true,
        logs: logs.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: logs.count,
          pages: Math.ceil(logs.count / parseInt(limit))
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Erro na API:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await initializeNexus();
  
  app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 API endpoints: http://localhost:${PORT}/api/*`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Desligando servidor...');
  if (nexus.db) {
    await nexus.db.disconnect();
  }
  process.exit(0);
});

export default app;

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  });
}