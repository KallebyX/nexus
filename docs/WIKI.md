# 📚 Nexus Framework - Wiki Completo

## Visão Geral
O **Oryum Nexus** é um framework modular enterprise-grade desenvolvido para reduzir em 40% o tempo de desenvolvimento de aplicações web completas. Baseado em arquitetura modular plug-and-play, permite criar sistemas completos em horas ao invés de semanas.

---

## 🏗️ Arquitetura do Framework

### Stack Tecnológico Principal
- **Frontend**: React 18 + Next.js 14 + TypeScript
- **Backend**: Node.js + Express.js + Sequelize ORM  
- **Database**: PostgreSQL (principal) + Redis (cache) + MongoDB (opcional)
- **Deploy**: Vercel, Render, VPS com CI/CD GitHub Actions
- **AI**: OpenAI/OpenRouter para automação de desenvolvimento

### Princípios Arquiteturais
1. **Modularidade**: Cada módulo funciona independentemente
2. **Plug & Play**: Zero configuração para usar módulos
3. **Type Safety**: TypeScript em todo o framework
4. **Enterprise Ready**: Padrões de segurança e auditoria
5. **AI-First**: Automação inteligente em todo ciclo de vida

---

## 📦 Estrutura de Módulos

### Core Modules (Essenciais)

#### 🗄️ Database Module - **COMPLETO**
Sistema completo de ORM com Sequelize para gerenciamento de dados enterprise.

**Características:**
- **Multi-database**: PostgreSQL + Redis + MongoDB
- **BaseModel**: UUID, timestamps, audit trails, soft deletes
- **RBAC**: Sistema completo de roles e permissões granulares
- **Audit**: Logs automáticos de todas as operações
- **Health Checks**: Monitoramento de saúde das conexões
- **Migrations**: Sistema automatizado de migrações

**Modelos Inclusos:**
```javascript
// Usuários e Autenticação
User              // Usuários com auth, 2FA, validações
UserSession       // Sessões JWT com device tracking
ActivityLog       // Logs de auditoria e atividade

// Sistema de Permissões (RBAC)
Role              // Papéis com hierarquia
Permission        // Permissões granulares por recurso/ação
Setting           // Configurações globais/por usuário
```

**Uso:**
```javascript
import { initializeDatabase } from '@oryum/nexus/database';

const db = await initializeDatabase({
  postgres: { host: 'localhost', database: 'app' },
  redis: { host: 'localhost' }
});

// Usar modelos
const user = await db.User.create({
  email: 'user@example.com',
  password: 'secure123'
});
```

#### 🔐 Auth Module - **EM DESENVOLVIMENTO**
Sistema completo de autenticação e autorização.

**Planejado:**
- JWT com refresh tokens
- OAuth2 (Google, GitHub, Facebook)
- 2FA com TOTP
- Rate limiting de login
- Password policies
- Session management

#### 🎨 UI Module - **BÁSICO**
Biblioteca de componentes React otimizada para produtividade.

**Componentes Atuais:**
- Button, Input, Alert, Footer, LoginForm

**Hooks Disponíveis:**
- useAuth, useCart, useForm, useApi

**Planejado:**
- 50+ componentes prontos
- Themes configuráveis
- Accessibility (a11y)
- Mobile-first design
- Storybook integration

### Utility Modules

#### 💳 Payments Module - **PLANEJADO**
Integração com sistemas de pagamento.
- Stripe integration
- Mercado Pago (Brasil)
- PayPal support
- Subscription handling
- Invoice generation

#### 📧 Notifications Module - **PLANEJADO**
Sistema completo de notificações.
- Email (SMTP, SendGrid, AWS SES)
- Push notifications
- SMS integration
- WhatsApp Business API
- In-app notifications

#### 📊 Monitoring Module - **PLANEJADO**
Observabilidade e monitoramento.
- Application metrics
- Error tracking (Sentry)
- Performance monitoring
- Custom dashboards
- Alerting system

#### 🧪 Testing Module - **PLANEJADO**
Framework de testes automatizado.
- Unit tests (Jest/Vitest)
- Integration tests
- E2E tests (Playwright)
- Test data factories
- Coverage reports

---

## 🚀 Guia de Início Rápido

### 1. Instalação
```bash
# Criar novo projeto
npx @oryum/nexus create meu-projeto

# Ou instalar em projeto existente
npm install @oryum/nexus
```

### 2. Configuração
```javascript
// nexus.config.js
export default {
  database: {
    postgres: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    redis: {
      host: process.env.REDIS_HOST
    }
  },
  modules: [
    '@oryum/nexus/database',
    '@oryum/nexus/auth',
    '@oryum/nexus/ui'
  ]
};
```

### 3. Inicialização
```javascript
// app.js
import { initializeNexus } from '@oryum/nexus';

const nexus = await initializeNexus({
  configFile: './nexus.config.js'
});

// Database estará disponível
const user = await nexus.db.User.findByEmail('user@example.com');
```

---

## 💾 Database Layer - Guia Completo

### Configuração de Banco
```javascript
// .env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017/mydb

// Configuração automática
const db = await initializeDatabase(); // Usa env vars
```

### Modelos Base
Todo modelo herda de `BaseModel` que inclui:

```javascript
// Campos automáticos em todos os modelos
{
  id: UUID,                    // Primary key UUID v4
  created_at: TIMESTAMP,       // Data criação
  updated_at: TIMESTAMP,       // Data última atualização  
  deleted_at: TIMESTAMP,       // Soft delete
  created_by: UUID,           // Usuário que criou
  updated_by: UUID,           // Usuário que atualizou
  version: INTEGER            // Controle de versão
}
```

### Sistema RBAC (Role-Based Access Control)

#### Roles (Papéis)
```javascript
// Roles padrão do sistema
const roles = [
  'super_admin',  // Acesso total
  'admin',        // Administrador  
  'moderator',    // Moderador
  'editor',       // Editor de conteúdo
  'user',         // Usuário padrão
  'guest'         // Visitante
];

// Verificar permissões
const user = await db.User.findByPk(userId, {
  include: ['role', 'permissions']
});

if (await user.hasPermission('users.create')) {
  // Usuário pode criar usuários
}
```

#### Permissions (Permissões)
```javascript
// Estrutura de permissões
{
  resource: 'users',           // Recurso (users, posts, etc)
  action: 'create',           // Ação (create, read, update, delete, admin)
  scope: 'own',               // Escopo (own, group, all)
  conditions: {}              // Condições especiais
}

// Exemplos de permissões
'users.create'              // Criar usuários
'users.read.own'           // Ver próprio perfil
'users.read.all'           // Ver todos usuários  
'posts.update.own'         // Editar próprios posts
'system.admin'             // Administração sistema
```

### Audit Trail (Trilha de Auditoria)
```javascript
// Logs automáticos de todas as operações
const logs = await db.ActivityLog.findAll({
  where: { 
    user_id: userId,
    action: 'login'
  }
});

// Tipos de logs automáticos
- User login/logout
- Data creation/update/delete  
- Permission changes
- Settings modifications
- Security events
- API requests
```

---

## 🔧 Scripts e Automação

### Scripts de Desenvolvimento
```bash
# Database
npm run db:migrate          # Executar migrações
npm run db:seed            # Popular dados iniciais
npm run db:reset           # Reset completo do banco

# Desenvolvimento
npm run dev                # Modo desenvolvimento
npm run dev:all           # Todos os serviços
npm run test              # Executar testes
npm run test:watch        # Testes em watch mode

# AI Automation
npm run ai:docs           # Gerar documentação
npm run ai:test           # Gerar testes
npm run ai:refactor       # Sugerir refatorações

# Deploy
npm run build             # Build produção
npm run deploy:staging    # Deploy staging
npm run deploy:prod       # Deploy produção
```

### Automação com IA
O framework inclui scripts de IA para acelerar desenvolvimento:

```javascript
// ai-docs-generator.js - Gera documentação automática
nexus ai:docs src/components/Button.jsx

// ai-test-generator.js - Cria testes baseados no código  
nexus ai:test src/services/UserService.js

// ai-refactor.js - Sugere melhorias de código
nexus ai:refactor src/utils/helpers.js
```

---

## 🛡️ Segurança

### Recursos de Segurança
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Input Sanitization**: Sanitização automática de entradas
- **SQL Injection Prevention**: ORM com prepared statements
- **XSS Protection**: Headers de segurança automáticos
- **CSRF Protection**: Tokens CSRF em formulários
- **JWT Security**: Tokens seguros com refresh
- **Audit Logs**: Log completo de atividades
- **Password Policies**: Políticas de senha configuráveis

### Headers de Segurança Automáticos
```javascript
// Headers aplicados automaticamente
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': '...'
}
```

---

## 📈 Performance e Escalabilidade

### Otimizações Incluídas
- **Database Connection Pooling**: Pool de conexões otimizado
- **Redis Caching**: Cache automático de queries
- **CDN Ready**: Assets otimizados para CDN
- **Code Splitting**: Divisão automática de código
- **Image Optimization**: Otimização automática de imagens
- **Bundle Analysis**: Análise de tamanho do bundle

### Métricas e Monitoramento
```javascript
// Métricas automáticas coletadas
{
  database: {
    query_time: 'ms',
    active_connections: 'count',
    cache_hit_rate: 'percentage'
  },
  api: {
    response_time: 'ms', 
    requests_per_minute: 'count',
    error_rate: 'percentage'
  },
  system: {
    memory_usage: 'mb',
    cpu_usage: 'percentage',
    disk_usage: 'percentage'
  }
}
```

---

## 🌍 Deploy e DevOps

### Estratégias de Deploy Suportadas

#### Vercel (Recomendado para Frontend)
```bash
# Deploy automático via GitHub
git push origin main  # Deploy automático

# Configuração vercel.json inclusa
```

#### Render (Backend e Fullstack)
```bash
# Deploy via GitHub integration
# Configuração render.yaml inclusa
```

#### VPS/Servidor Próprio
```bash
# Docker Compose incluído
docker-compose up -d

# Scripts de deploy
./scripts/deploy-production.sh
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml (incluído)
name: Deploy Nexus App
on:
  push: { branches: [main] }
jobs:
  test: # Testes automatizados
  build: # Build da aplicação  
  deploy: # Deploy para produção
  notify: # Notificações de sucesso/erro
```

---

## 🔌 API Reference

### Database Module API

```javascript
import { initializeDatabase } from '@oryum/nexus/database';

// Inicialização
const db = await initializeDatabase(config);

// Modelos disponíveis
db.User           // Gerenciamento de usuários
db.UserSession    // Sessões e tokens
db.ActivityLog    // Logs de auditoria
db.Permission     // Permissões granulares
db.Role           // Papéis e hierarquia
db.Setting        // Configurações do sistema

// Utilitários
db.healthCheck()  // Verificar saúde do banco
db.syncDatabase() // Sincronizar estrutura
db.disconnect()   // Desconectar
```

### User Model API
```javascript
// Criação de usuário
const user = await db.User.create({
  email: 'user@example.com',
  first_name: 'João',
  last_name: 'Silva', 
  password: 'senha123'
});

// Autenticação
const authenticated = await db.User.authenticate(
  'user@example.com', 
  'senha123'
);

// Gerenciar permissões
await user.addRole('editor');
await user.grantPermission('posts.create');
const can = await user.can('posts.update.own');

// Dados seguros para API
const safeData = user.toSafeJSON();
```

---

## 🎛️ Configurações Avançadas

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MONGODB_URL=mongodb://...

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API
API_PORT=3000
API_RATE_LIMIT=100
API_CORS_ORIGINS=*

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Configuração Personalizada
```javascript
// nexus.config.js
export default {
  database: {
    // Config database
  },
  auth: {
    providers: ['local', 'google', 'github'],
    session: {
      duration: '7d',
      maxDevices: 5
    }
  },
  api: {
    rateLimit: {
      windowMs: 60000,
      max: 100
    },
    cors: {
      origin: ['http://localhost:3000']
    }
  },
  ui: {
    theme: 'dark',
    language: 'pt-BR'
  }
};
```

---

## 🤖 AI Integration

### Recursos de IA Incluídos
- **Documentation AI**: Gera docs automáticas do código
- **Test AI**: Cria testes baseados em análise de código  
- **Refactor AI**: Sugere melhorias e otimizações
- **Debug AI**: Ajuda na resolução de bugs
- **Deploy AI**: Automação inteligente de deploy

### Exemplos de Uso
```bash
# Gerar documentação para componente
nexus ai docs src/components/UserCard.jsx

# Criar testes para service
nexus ai test src/services/PaymentService.js

# Refatorar código legado
nexus ai refactor src/legacy/old-module.js

# Deploy inteligente com rollback
nexus ai deploy --environment=production --rollback-on-error
```

---

## 📊 Roadmap e Futuras Versões

### v1.0 - MVP (Atual - 25%)
- ✅ Database Module completo
- 🚧 Auth Module  
- 🚧 API Module
- 🚧 UI Module básico

### v1.1 - Core Features (Q4 2025)
- Payments Module
- Notifications Module  
- Testing Module
- CLI completo

### v1.2 - Advanced Features (Q1 2026)
- Monitoring Module
- Advanced UI Components
- Marketplace interno
- Multi-tenancy support

### v2.0 - Enterprise (Q2 2026)
- Microservices architecture
- Kubernetes support  
- Advanced AI features
- Enterprise dashboard

---

## 🤝 Contribuindo

### Como Contribuir
1. Fork do repositório
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das alterações (`git commit -am 'Add nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

### Padrões de Código
- ESLint + Prettier configurado
- TypeScript obrigatório
- Testes para novas features
- Documentação atualizada
- Commit messages padronizadas

---

## 📞 Suporte

### Recursos de Ajuda
- **Documentação**: [docs.nexus.oryum.com](https://docs.nexus.oryum.com)
- **Discord**: [discord.gg/nexus](https://discord.gg/nexus)  
- **GitHub Issues**: Para bugs e feature requests
- **Email**: support@oryum.com

### Status do Projeto
- **Versão Atual**: 0.25.0 (MVP em desenvolvimento)
- **Licença**: MIT
- **Maintainer**: Oryum Team
- **Última Atualização**: 29/09/2025

---

*Este wiki é atualizado automaticamente conforme o framework evolui. Para a versão mais recente, consulte a documentação online.*