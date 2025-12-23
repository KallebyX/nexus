# 📘 Nexus Framework - Guia Completo de Uso

> **Guia definitivo para usar o Nexus Framework em seus projetos**

## 📑 Índice

1. [Instalação e Setup](#-instalação-e-setup)
2. [Configuração Inicial](#-configuração-inicial)
3. [Módulo de Autenticação](#-módulo-de-autenticação)
4. [Módulo de Database](#-módulo-de-database)
5. [Módulo de API](#-módulo-de-api)
6. [Módulo de UI](#-módulo-de-ui)
7. [Módulo de Pagamentos](#-módulo-de-pagamentos)
8. [Módulo de Notificações](#-módulo-de-notificações)
9. [Módulo de Monitoramento](#-módulo-de-monitoramento)
10. [CLI e Comandos](#-cli-e-comandos)
11. [Testes](#-testes)
12. [Deploy](#-deploy)
13. [Troubleshooting](#-troubleshooting)

---

## 🚀 Instalação e Setup

### Pré-requisitos

```bash
# Node.js 18+ (recomendado: 20 LTS)
node --version  # v20.x.x

# npm ou yarn
npm --version   # 10.x.x

# PostgreSQL (para database)
psql --version  # 15.x+

# Redis (opcional, para cache)
redis-server --version  # 7.x+
```

### Instalação Global (Recomendado)

```bash
# Instalar CLI globalmente
npm install -g @oryum/nexus

# Verificar instalação
nexus --version
```

### Criar Novo Projeto

```bash
# Criar projeto completo
nexus create meu-app

# Criar projeto específico
nexus create meu-backend --type backend
nexus create meu-frontend --type frontend
nexus create meu-microservice --type microservice

# Entrar no projeto
cd meu-app

# Instalar dependências
npm install
```

### Estrutura do Projeto Criado

```
meu-app/
├── src/
│   ├── api/               # Rotas e controllers
│   ├── models/            # Modelos do banco
│   ├── services/          # Lógica de negócio
│   ├── middleware/        # Middlewares
│   └── utils/             # Utilitários
├── public/                # Arquivos estáticos
├── tests/                 # Testes
├── .env.example           # Variáveis de ambiente
├── nexus.config.js        # Configuração do Nexus
├── package.json           # Dependências
└── docker-compose.yml     # Docker config
```

---

## ⚙️ Configuração Inicial

### Arquivo .env

```bash
# Copiar template
cp .env.example .env

# Editar configurações
nano .env
```

### Variáveis Essenciais

```env
# Aplicação
NODE_ENV=development
APP_NAME=MeuApp
APP_URL=http://localhost:3000
PORT=3000

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/myapp_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (Cache)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=sua-chave-super-secreta-minimo-32-caracteres
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
EMAIL_FROM=noreply@seuapp.com

# Pagamentos
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AWS (opcional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### Arquivo nexus.config.js

```javascript
export default {
  // Nome do projeto
  name: 'meu-app',

  // Módulos habilitados
  modules: {
    auth: true,
    database: true,
    api: true,
    ui: true,
    payments: true,
    notifications: true,
    monitoring: true
  },

  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true
    }
  },

  // Configurações do banco
  database: {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development'
  },

  // Configurações de autenticação
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    passwordMinLength: 8,
    requireSpecialChars: true,
    maxLoginAttempts: 5
  }
};
```

---

## 🔐 Módulo de Autenticação

### Inicialização

```javascript
import { initializeAuth, AuthService } from '@oryum/nexus/auth';

// Inicializar serviço de auth
const auth = await initializeAuth({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d'
});
```

### Registro de Usuário

```javascript
// Registrar novo usuário
const result = await auth.register({
  email: 'usuario@exemplo.com',
  password: 'SenhaSegura123!',
  first_name: 'João',
  last_name: 'Silva'
});

console.log(result);
// {
//   success: true,
//   user: { id: 1, email: '...', first_name: '...', ... },
//   message: 'Usuário registrado com sucesso'
// }
```

### Login

```javascript
// Fazer login
const loginResult = await auth.login('usuario@exemplo.com', 'SenhaSegura123!', {
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});

console.log(loginResult);
// {
//   success: true,
//   user: { id: 1, email: '...', ... },
//   tokens: {
//     access_token: 'eyJ...',
//     refresh_token: 'eyJ...',
//     expires_in: 604800000,
//     token_type: 'Bearer'
//   }
// }
```

### Verificar Token

```javascript
// Verificar se token é válido
const verification = await auth.verifyToken(accessToken);

if (verification.valid) {
  console.log('Usuário:', verification.user);
} else {
  console.log('Token inválido:', verification.error);
}
```

### Refresh Token

```javascript
// Renovar tokens
const newTokens = await auth.refreshToken(refreshToken);

console.log(newTokens);
// {
//   success: true,
//   tokens: { access_token: '...', refresh_token: '...' }
// }
```

### Reset de Senha

```javascript
// Solicitar reset
await auth.requestPasswordReset('usuario@exemplo.com');
// Email será enviado automaticamente com link de reset

// Confirmar reset (com token do email)
await auth.resetPassword(resetToken, 'NovaSenhaSegura123!');
```

### Middleware de Autenticação

```javascript
import { AuthMiddleware } from '@oryum/nexus/auth';

const authMiddleware = new AuthMiddleware(auth);

// Rota protegida - requer autenticação
app.get('/api/perfil',
  authMiddleware.authenticate(),
  (req, res) => {
    res.json({ user: req.user });
  }
);

// Rota com role específica
app.get('/api/admin/usuarios',
  authMiddleware.authenticate(),
  authMiddleware.authorize(['admin']),
  (req, res) => {
    // Apenas admins podem acessar
  }
);

// Rota com permissões específicas
app.delete('/api/usuarios/:id',
  authMiddleware.authenticate(),
  authMiddleware.requirePermissions(['users.delete']),
  (req, res) => {
    // Requer permissão específica
  }
);
```

---

## 📊 Módulo de Database

### Inicialização

```javascript
import { initializeDatabase } from '@oryum/nexus/database';

const db = await initializeDatabase();

// Modelos disponíveis
const { User, UserSession, Role, Permission, ActivityLog, Setting } = db;
```

### CRUD de Usuários

```javascript
// Criar usuário
const user = await db.User.create({
  email: 'novo@exemplo.com',
  first_name: 'Maria',
  last_name: 'Santos',
  password_hash: 'senha123' // Será hasheado automaticamente
});

// Buscar usuário
const foundUser = await db.User.findOne({
  where: { email: 'novo@exemplo.com' },
  include: ['role', 'sessions']
});

// Atualizar
await user.update({
  first_name: 'Maria Clara'
});

// Soft delete (mantém registro, marca como deletado)
await user.destroy();

// Hard delete (remove completamente)
await user.destroy({ force: true });
```

### Modelos com Relacionamentos

```javascript
// Buscar usuário com todas as relações
const userComplete = await db.User.findByPk(1, {
  include: [
    { model: db.Role, as: 'role' },
    { model: db.UserSession, as: 'sessions' },
    { model: db.ActivityLog, as: 'activities' }
  ]
});

// Acessar dados relacionados
console.log(userComplete.role.name);
console.log(userComplete.sessions.length);
```

### Transactions

```javascript
const transaction = await db.sequelize.transaction();

try {
  const user = await db.User.create({ ... }, { transaction });
  const role = await db.Role.findOne({ where: { name: 'admin' } });
  await user.setRole(role, { transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Migrações e Seeds

```bash
# Executar migrações
npm run db:migrate

# Executar seeds (dados iniciais)
npm run db:seed

# Reset do banco (drop + create + migrate + seed)
npm run db:reset
```

---

## 🌐 Módulo de API

### Criando uma API Express

```javascript
import { createAPI } from '@oryum/nexus/api';

const api = createAPI({
  prefix: '/api',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo de requests
  },
  cors: {
    origin: ['http://localhost:3000']
  }
});

// Iniciar servidor
api.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
```

### Rotas e Controllers

```javascript
// routes/users.js
import { Router } from 'express';
import { authMiddleware } from '@oryum/nexus/auth';

const router = Router();

// Listar usuários (apenas admin)
router.get('/',
  authMiddleware.authenticate(),
  authMiddleware.authorize(['admin']),
  async (req, res) => {
    const users = await db.User.findAll();
    res.json({ success: true, data: users });
  }
);

// Criar usuário
router.post('/',
  authMiddleware.authenticate(),
  authMiddleware.authorize(['admin']),
  async (req, res) => {
    const user = await db.User.create(req.body);
    res.status(201).json({ success: true, data: user });
  }
);

// Obter usuário específico
router.get('/:id',
  authMiddleware.authenticate(),
  async (req, res) => {
    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ success: true, data: user });
  }
);

export default router;
```

### Validação com Joi

```javascript
import Joi from 'joi';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(2).required(),
  last_name: Joi.string().min(2)
});

router.post('/', async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details.map(d => d.message)
    });
  }

  const user = await db.User.create(value);
  res.status(201).json({ success: true, data: user });
});
```

### Error Handling

```javascript
import { errorHandler, AppError } from '@oryum/nexus/api';

// Lançar erro customizado
router.get('/:id', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Middleware de erro (adicionar no final)
app.use(errorHandler);
```

---

## 🎨 Módulo de UI

### Componentes React

```jsx
import {
  Button,
  DataTable,
  Modal,
  FormBuilder
} from '@oryum/nexus/ui';

// Botão com variantes
<Button variant="primary" size="medium" onClick={handleClick}>
  Salvar
</Button>

<Button variant="danger" loading={isLoading}>
  Deletar
</Button>

<Button variant="outline" icon={<IconPlus />}>
  Adicionar
</Button>
```

### DataTable

```jsx
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <span className={`badge ${value}`}>{value}</span>
    )
  }
];

const actions = [
  { label: 'Editar', onClick: handleEdit, color: 'blue' },
  { label: 'Excluir', onClick: handleDelete, color: 'red' }
];

<DataTable
  data={users}
  columns={columns}
  actions={actions}
  pagination={true}
  pageSize={10}
  searchable={true}
  sortable={true}
  selectable={true}
  onSelectionChange={handleSelection}
/>
```

### Modal

```jsx
import { useModal } from '@oryum/nexus/ui/hooks';

function MyComponent() {
  const { isOpen, open, close, data } = useModal();

  return (
    <>
      <Button onClick={() => open({ userId: 1 })}>
        Abrir Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Editar Usuário"
        size="medium"
      >
        <p>Editando usuário: {data?.userId}</p>
        <Button onClick={close}>Fechar</Button>
      </Modal>
    </>
  );
}
```

### Hooks Disponíveis

```jsx
// useForm - Gerenciamento de formulários
import { useForm } from '@oryum/nexus/ui/hooks';

const {
  values,
  errors,
  handleChange,
  handleSubmit,
  isSubmitting
} = useForm(
  { email: '', password: '' },
  {
    email: { required: true, pattern: /email/ },
    password: { required: true, min: 8 }
  }
);

// useApi - Requisições HTTP
import { useApi } from '@oryum/nexus/ui/hooks';

const { get, post, loading, error } = useApi('/api');
const users = await get('/users');

// useAuth - Autenticação
import { useAuth } from '@oryum/nexus/ui/hooks';

const { user, login, logout, isAuthenticated } = useAuth();

// useToast - Notificações
import { useToast } from '@oryum/nexus/ui/hooks';

const { success, error, info, warning } = useToast();
success('Operação realizada com sucesso!');

// useLocalStorage - Persistência
import { useLocalStorage } from '@oryum/nexus/ui/hooks';

const [theme, setTheme] = useLocalStorage('theme', 'light');

// useDebounce - Debounce de valores
import { useDebounce } from '@oryum/nexus/ui/hooks';

const debouncedSearch = useDebounce(searchTerm, 300);
```

---

## 💳 Módulo de Pagamentos

### Configuração Stripe

```javascript
import { PaymentsModule } from '@oryum/nexus/payments';

const payments = new PaymentsModule({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  }
});
```

### Processar Pagamento

```javascript
// Pagamento único
const result = await payments.processPayment({
  amount: 9990, // R$ 99,90 em centavos
  currency: 'BRL',
  customerId: customer.stripeId,
  paymentMethodId: 'pm_card_visa',
  description: 'Pedido #12345'
});

console.log(result);
// {
//   success: true,
//   transactionId: 'pi_...',
//   status: 'succeeded'
// }
```

### Assinaturas

```javascript
// Criar cliente
const customer = await payments.createCustomer({
  email: 'cliente@exemplo.com',
  name: 'João Silva',
  paymentMethodId: 'pm_...'
});

// Criar assinatura
const subscription = await payments.createSubscription({
  customerId: customer.id,
  priceId: 'price_monthly_pro',
  trialDays: 14
});

// Cancelar assinatura
await payments.cancelSubscription(subscription.id);
```

### Webhooks

```javascript
// Endpoint para webhooks do Stripe
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const event = payments.verifyWebhook(
      req.body,
      req.headers['stripe-signature']
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
    }

    res.json({ received: true });
  }
);
```

---

## 📨 Módulo de Notificações

### Configuração

```javascript
import { NotificationsModule } from '@oryum/nexus/notifications';

const notifications = new NotificationsModule({
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: 'noreply@meuapp.com'
  },
  sms: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM_NUMBER
    }
  }
});
```

### Enviar Email

```javascript
// Email simples
await notifications.sendEmail({
  to: 'usuario@exemplo.com',
  subject: 'Bem-vindo!',
  html: '<h1>Olá!</h1><p>Seja bem-vindo ao nosso app.</p>'
});

// Email com template
await notifications.sendEmail({
  to: 'usuario@exemplo.com',
  template: 'welcome',
  templateData: {
    userName: 'João',
    appName: 'MeuApp'
  }
});

// Email para múltiplos destinatários
await notifications.sendEmail({
  to: ['user1@exemplo.com', 'user2@exemplo.com'],
  subject: 'Newsletter',
  html: '...'
});
```

### Enviar SMS

```javascript
await notifications.sendSMS({
  to: '+5511999999999',
  message: 'Seu código de verificação é: 123456'
});

// Com template
await notifications.sendSMS({
  to: '+5511999999999',
  template: 'verification-code',
  templateData: { code: '123456' }
});
```

### Enviar WhatsApp

```javascript
await notifications.sendWhatsApp({
  to: '+5511999999999',
  message: 'Seu pedido foi enviado! Rastreio: ABC123'
});
```

### Notificação Multi-Canal

```javascript
await notifications.sendMultiChannel({
  channels: ['email', 'sms', 'push'],
  recipients: {
    email: 'user@exemplo.com',
    phone: '+5511999999999',
    pushSubscription: userPushSubscription
  },
  template: 'order-shipped',
  templateData: {
    orderNumber: '12345',
    trackingCode: 'BR123456789'
  }
});
```

---

## 📈 Módulo de Monitoramento

### Configuração

```javascript
import { MonitoringModule } from '@oryum/nexus/monitoring';

const monitoring = new MonitoringModule({
  metrics: true,
  logging: {
    level: 'info',
    file: './logs/app.log'
  },
  alerts: {
    email: 'admin@meuapp.com',
    slack: process.env.SLACK_WEBHOOK_URL
  }
});
```

### Health Check

```javascript
// Endpoint de health check
app.get('/health', async (req, res) => {
  const health = await monitoring.healthCheck();

  res.status(health.status === 'healthy' ? 200 : 503)
     .json(health);
});

// Resultado
// {
//   status: 'healthy',
//   uptime: 123456,
//   timestamp: '2024-...',
//   services: {
//     database: { status: 'connected', latency: 5 },
//     redis: { status: 'connected', latency: 2 },
//     memory: { used: '256MB', total: '1GB' }
//   }
// }
```

### Métricas

```javascript
// Registrar métrica customizada
monitoring.recordMetric('api.requests', 1, {
  method: 'GET',
  path: '/users',
  statusCode: 200
});

// Obter métricas
const metrics = await monitoring.getMetrics();
```

### Logs

```javascript
// Logging estruturado
monitoring.log('info', 'Usuário criado', {
  userId: 1,
  email: 'user@exemplo.com'
});

monitoring.log('error', 'Falha no pagamento', {
  orderId: 123,
  error: error.message
});

// Níveis: debug, info, warn, error, fatal
```

### Alertas

```javascript
// Configurar alerta
monitoring.alert('critical', 'Erro crítico no sistema', {
  service: 'payments',
  error: 'Connection timeout'
});
```

---

## 💻 CLI e Comandos

### Comandos Principais

```bash
# Criar projeto
nexus create <nome> [--type backend|frontend|fullstack|microservice]

# Adicionar módulo
nexus add <modulo>
# Módulos: auth, database, ui, payments, notifications, monitoring

# Remover módulo
nexus remove <modulo>

# Listar módulos
nexus list

# Desenvolvimento
nexus dev                    # Iniciar em modo desenvolvimento
nexus dev --port 4000        # Porta customizada

# Banco de dados
nexus db migrate             # Executar migrações
nexus db seed                # Executar seeds
nexus db reset               # Reset completo

# Docker
nexus docker init            # Criar docker-compose.yml
nexus docker up              # Subir containers
nexus docker down            # Parar containers

# Deploy
nexus deploy staging         # Deploy para staging
nexus deploy production      # Deploy para produção

# Utilitários
nexus health                 # Verificar saúde do sistema
nexus security               # Auditoria de segurança
nexus lint                   # Verificar código
nexus test                   # Executar testes
```

### npm Scripts

```bash
# Desenvolvimento
npm run dev                  # Servidor de desenvolvimento
npm run dev:frontend         # Apenas frontend
npm run dev:backend          # Apenas backend

# Build
npm run build                # Build para produção
npm run build:frontend       # Build frontend
npm run build:backend        # Build backend

# Testes
npm test                     # Todos os testes
npm run test:watch           # Watch mode
npm run test:coverage        # Com cobertura
npm run test:e2e             # Testes E2E

# Qualidade
npm run lint                 # ESLint
npm run format               # Prettier
npm run security:check       # Auditoria

# Database
npm run db:migrate           # Migrações
npm run db:seed              # Seeds
npm run db:reset             # Reset

# Deploy
npm run deploy:staging       # Staging
npm run deploy:prod          # Produção
```

---

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── services/
│   ├── models/
│   └── utils/
├── integration/             # Testes de integração
│   ├── api/
│   └── database/
├── e2e/                     # Testes end-to-end
│   ├── auth.e2e.test.js
│   ├── api.e2e.test.js
│   └── payments.e2e.test.js
└── helpers/                 # Utilitários de teste
    ├── mocks/
    └── fixtures/
```

### Escrever Testes

```javascript
// tests/unit/services/auth.test.js
import { describe, test, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../../../modules/auth/AuthService.js';

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService({
      jwtSecret: 'test-secret'
    });
  });

  describe('validatePassword', () => {
    test('should accept strong password', () => {
      expect(() => {
        authService.validatePassword('SecurePass123!');
      }).not.toThrow();
    });

    test('should reject weak password', () => {
      expect(() => {
        authService.validatePassword('weak');
      }).toThrow(/pelo menos/);
    });
  });
});
```

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --testPathPattern=auth

# Com cobertura
npm run test:coverage

# Watch mode (desenvolvimento)
npm run test:watch

# Apenas E2E
npm test -- --testPathPattern=e2e
```

---

## 🚀 Deploy

### Deploy Rápido com Docker

```bash
# Criar imagem
docker build -t meu-app:latest .

# Executar
docker run -p 3000:3000 --env-file .env meu-app:latest

# Com docker-compose
docker-compose up -d
```

### Deploy na AWS

```bash
# Configurar AWS CLI
aws configure

# Deploy com Elastic Beanstalk (mais fácil)
eb init meu-app --platform node.js
eb create meu-app-prod
eb deploy

# Ou deploy com ECS
nexus deploy aws --service ecs
```

### Deploy no GCP

```bash
# Configurar gcloud
gcloud auth login

# Deploy com Cloud Run (serverless)
gcloud run deploy meu-app \
  --source . \
  --platform managed \
  --region us-central1

# Deploy com App Engine
gcloud app deploy
```

### Deploy Manual em VPS

```bash
# Conectar ao servidor
ssh user@meu-servidor.com

# Clonar repositório
git clone https://github.com/meu/app.git
cd app

# Instalar dependências
npm install --production

# Configurar ambiente
cp .env.example .env
nano .env

# Executar migrações
npm run db:migrate

# Iniciar com PM2
pm2 start npm --name "meu-app" -- start
pm2 save
pm2 startup
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro de Conexão com Banco de Dados

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -h localhost -U postgres -d myapp_dev

# Verificar variáveis de ambiente
echo $DATABASE_URL
```

#### Erro de Dependências

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Erro de Porta em Uso

```bash
# Encontrar processo usando a porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm run dev
```

#### Erro de Migração

```bash
# Reset do banco (CUIDADO: apaga dados!)
npm run db:reset

# Ou executar migrações específicas
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate
```

#### Erro de JWT

```bash
# Verificar se JWT_SECRET está definido
echo $JWT_SECRET

# Gerar nova chave
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Logs e Debug

```bash
# Ver logs em tempo real
tail -f logs/app.log

# Ativar modo debug
DEBUG=nexus:* npm run dev

# Logs do PM2
pm2 logs meu-app
```

### Suporte

- **Documentação**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/oryum/nexus/issues)
- **Comunidade**: [Discord](https://discord.gg/oryum)
- **Email**: suporte@oryum.tech

---

## 📚 Próximos Passos

1. **[Tutorial Prático](./docs/TUTORIAL.md)** - Construa seu primeiro app
2. **[Guia de Arquitetura](./docs/ARCHITECTURE.md)** - Entenda a estrutura
3. **[API Reference](./docs/openapi.yaml)** - Documentação completa da API
4. **[Exemplos](./examples/)** - Projetos de exemplo

---

<div align="center">

**Construído com ❤️ pela [Oryum Tech](https://oryum.tech)**

</div>
