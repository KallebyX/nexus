/**
 * Exemplo Prático - API Backend com Oryum Nexus
 * Demonstra uso completo dos módulos do framework
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AuthModule } from '../modules/auth/index.js';
import { DatabaseModule } from '../modules/database/index.js';
import { AIModule } from '../modules/ai/index.js';
import { MonitoringModule } from '../modules/monitoring/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar módulos do Nexus
const auth = new AuthModule({
  provider: 'supabase',
  socialLogin: ['google', 'github'],
  roles: ['admin', 'user', 'moderator']
});

const database = new DatabaseModule({
  provider: 'supabase',
  migrations: true,
  backups: true
});

const ai = new AIModule({
  provider: 'openai',
  model: 'gpt-4',
  features: ['docs', 'tests', 'refactor']
});

const monitoring = new MonitoringModule({
  logging: true,
  metrics: true,
  alerts: true
});

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { error: 'Muitas tentativas, tente novamente em 15 minutos' }
});
app.use(limiter);

// Middleware de monitoramento
app.use(monitoring.middleware());

// Rotas de autenticação
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Log da tentativa de login
  monitoring.log('info', 'Login attempt', { email });
  
  const result = await auth.login(email, password);
  
  if (result.success) {
    monitoring.log('info', 'Login successful', { email });
    res.json(result);
  } else {
    monitoring.log('warning', 'Login failed', { email, error: result.error });
    res.status(401).json(result);
  }
});

app.post('/auth/register', async (req, res) => {
  const { email, password, userData } = req.body;
  
  const result = await auth.register(email, password, userData);
  res.status(result.success ? 201 : 400).json(result);
});

app.post('/auth/social/:provider', async (req, res) => {
  const { provider } = req.params;
  const result = await auth.socialLogin(provider);
  res.json(result);
});

// Rotas protegidas
app.get('/profile', auth.middleware(), (req, res) => {
  res.json({ 
    user: req.user,
    message: 'Perfil acessado com sucesso' 
  });
});

// Rota apenas para admins
app.get('/admin/users', 
  auth.middleware(), 
  auth.requireRole('admin'), 
  async (req, res) => {
    const users = await database.User.findAll();
    res.json(users);
  }
);

// Rotas com IA integrada
app.post('/ai/generate-docs', 
  auth.middleware(), 
  async (req, res) => {
    const { code, language } = req.body;
    
    const documentation = await ai.generateDocumentation(code, language);
    res.json({ documentation });
  }
);

app.post('/ai/generate-tests', 
  auth.middleware(), 
  async (req, res) => {
    const { code, framework } = req.body;
    
    const tests = await ai.generateTests(code, framework);
    res.json({ tests });
  }
);

// Rota de métricas (para monitoramento)
app.get('/metrics', (req, res) => {
  const metrics = monitoring.getMetrics();
  res.json(metrics);
});

// Rota de health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    modules: {
      auth: await auth.healthCheck(),
      database: await database.healthCheck(),
      ai: await ai.healthCheck(),
      monitoring: monitoring.healthCheck()
    }
  };
  
  res.json(health);
});

// Middleware de erro global
app.use((error, req, res, next) => {
  monitoring.log('error', 'Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Nexus rodando na porta ${PORT}`);
  console.log(`📊 Métricas disponíveis em: http://localhost:${PORT}/metrics`);
  console.log(`🔍 Health check em: http://localhost:${PORT}/health`);
  
  monitoring.log('info', 'Server started', { port: PORT });
});

export default app;