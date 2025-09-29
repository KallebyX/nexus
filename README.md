# Oryum Nexus 🚀

<div align="center">

**Framework Modular para Desenvolvimento Acelerado**

*Crie sistemas completos em horas, não semanas*

[![CI/CD](https://github.com/KallebyX/nexus/workflows/Oryum%20Nexus%20CI%2FCD/badge.svg)](https://github.com/KallebyX/nexus/actions)
[![Coverage](https://img.shields.io/badge/coverage-80%25-green.svg)](https://github.com/KallebyX/nexus)
[![Version](https://img.shields.io/npm/v/@oryum/nexus.svg)](https://www.npmjs.com/package/@oryum/nexus)

</div>

# 🎯 Oryum Nexus Framework

> **Framework Modular para Redução de 40% do Tempo de Desenvolvimento**

## 🚀 Visão Geral

O **Oryum Nexus** é um framework modular revolucionário projetado para acelerar o desenvolvimento de aplicações web modernas. Com uma arquitetura plug-and-play e automação inteligente, permite criar sistemas completos em **horas ao invés de semanas**.

### ✨ Características Principais
- 🧩 **Modularidade Total**: Componentes independentes e reutilizáveis
- ⚡ **Zero Config**: Funciona out-of-the-box com configuração mínima
- 🤖 **AI-First**: Automação inteligente em todo ciclo de desenvolvimento
- 🔒 **Enterprise Ready**: Segurança, auditoria e escalabilidade nativas
- 📱 **Full-Stack**: Frontend + Backend + Database + DevOps integrados

---

## 📋 Status do Projeto

**🎯 Completude Atual: ~30%** *(Atualizado: 29/09/2025)*

### ✅ Módulos Completos

#### 🗄️ Database Module - **COMPLETO (100%)**
Sistema completo de ORM enterprise com Sequelize:
- ✅ Multi-database: PostgreSQL + Redis + MongoDB
- ✅ BaseModel com UUID, timestamps, audit trails, soft deletes
- ✅ **6 Modelos Completos**: User, UserSession, ActivityLog, Permission, Role, Setting
- ✅ **RBAC System**: Roles hierárquicos com permissões granulares
- ✅ **Audit Trail**: Logs automáticos de todas operações
- ✅ **Migration System**: Scripts automatizados de migração e seeds
- ✅ Health checks e monitoramento

#### 🔐 Auth Module - **COMPLETO (100%)**
Sistema completo de autenticação e autorização:
- ✅ **AuthService**: JWT com refresh tokens, registro, login, logout
- ✅ **AuthMiddleware**: 7+ middlewares de segurança (auth, authorize, roles, ownership, rate limiting)
- ✅ **Password Security**: Validação, reset, políticas configuráveis
- ✅ **Session Management**: Device tracking, cleanup automático
- ✅ **Audit Integration**: Logs de tentativas de login, acessos negados

#### 🎨 UI Module - **BÁSICO (25%)**
- ✅ **Componentes**: Button, Input, Alert, Footer, LoginForm
- ✅ **Hooks**: useAuth, useCart, useForm, useApi  
- ✅ **Utilities**: Formatters, Validators, API helpers, Constants, Types

### 🚧 Em Desenvolvimento
- **API Module**: Express.js com integração completa aos módulos
- **CLI Tools**: Ferramentas de linha de comando nexus
- **Testing Module**: Framework de testes automatizado
- **Payments Module**: Integração Stripe/Mercado Pago
- **Notifications Module**: Email, SMS, Push, WhatsApp

---

### ✨ Principais Benefícios

- **⚡ Desenvolvimento Acelerado**: Sistemas completos em horas
- **🧩 Modularidade**: Plug & play com zero configuração
- **🤖 IA Integrada**: Documentação, testes e refatoração automáticos
- **🔒 Segurança por Padrão**: Rate limiting, sanitização, auditoria
- **📊 Monitoramento**: Métricas e alertas inteligentes

## 🚀 Início Rápido

### Instalação Global
```bash
# Instalar CLI do Nexus globalmente
npm install -g @oryum/nexus

# Criar novo projeto
nexus create meu-projeto

# Ou usando npx (sem instalação global)
npx @oryum/nexus create meu-projeto
```

### Configuração Inicial
```bash
# Entrar no diretório
cd meu-projeto

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Iniciar desenvolvimento
npm run dev:all
```

### Primeiro Deploy
```bash
# Executar testes
npm test

# Verificar segurança
npm run security:check

# Deploy para staging
npm run deploy:staging

# Deploy para produção (após aprovação)
npm run deploy:prod
```

## 🏗️ Arquitetura Modular

```
nexus/
├── modules/              # Módulos reutilizáveis
│   ├── auth/            # 🔐 Autenticação (JWT, OAuth, roles)
│   ├── database/        # 📊 Modelos e migrações
│   ├── ui/              # 🎨 Biblioteca de componentes
│   ├── ai/              # 🤖 Integração IA
│   ├── payments/        # 💳 Stripe/Mercado Pago
│   ├── notifications/   # 📨 Email, push, WhatsApp
│   └── monitoring/      # 📈 Logs e métricas
├── templates/           # Templates para projetos
├── scripts/             # Automação e IA
└── .github/            # CI/CD workflows
```

## 📦 Módulos Disponíveis

| Módulo | Descrição | Status |
|--------|-----------|--------|
| 🔐 **Auth** | JWT, OAuth, roles, onboarding | ✅ Disponível |
| 📊 **Database** | Modelos, migrações, backups | ✅ Disponível |
| 🎨 **UI** | Componentes React + Tailwind | ✅ Disponível |
| 🤖 **AI** | OpenAI/OpenRouter integration | ✅ Disponível |
| 💳 **Payments** | Stripe, Mercado Pago | 🚧 Em desenvolvimento |
| 📨 **Notifications** | Email, push, WhatsApp | 🚧 Em desenvolvimento |
| 📈 **Monitoring** | Logs, métricas, alertas | ✅ Disponível |

---

## 🚀 Quick Start

### 1. Instalação
```bash
# Clone o framework
git clone https://github.com/oryum/nexus.git
cd nexus

# Instalar dependências
npm install
```

### 2. Configuração do Banco
```bash
# Configurar PostgreSQL (necessário)
export DATABASE_URL="postgresql://user:password@localhost:5432/nexus_dev"

# Opcional: Redis para cache
export REDIS_URL="redis://localhost:6379"

# Executar migrações
npm run db:migrate
```

### 3. Executar Exemplo
```bash
# Iniciar API demo
node examples/api-demo.js

# Acesse: http://localhost:3001/health
```

### 4. Uso em Projeto
```javascript
import { initializeDatabase, initializeAuthModule } from '@oryum/nexus';

// Inicializar framework
const db = await initializeDatabase();
const auth = await initializeAuthModule();

// Usar modelos
const user = await db.User.create({
  email: 'user@example.com',
  password: 'secure123',
  first_name: 'João'
});

// Usar autenticação
const result = await auth.login('user@example.com', 'secure123');
```

### 5. API Endpoints Disponíveis
```bash
# Autenticação
POST /api/auth/register    # Registro de usuário
POST /api/auth/login       # Login
POST /api/auth/logout      # Logout
POST /api/auth/refresh     # Refresh token

# Usuário
GET  /api/profile          # Perfil (requer auth)

# Admin (requer role admin)
GET  /api/admin/users      # Listar usuários
GET  /api/admin/logs       # Logs de auditoria
GET  /api/admin/settings   # Configurações

# Público
GET  /health              # Status do sistema
GET  /api/settings        # Configurações públicas
```

---

## 🛠️ Stack Tecnológica

- **Frontend**: React + Next.js + TypeScript
- **Backend**: Node.js/Express + Python/Flask
- **Database**: Supabase/PostgreSQL
- **Deploy**: Vercel, Render, VPS
- **AI**: OpenAI, OpenRouter
- **Testes**: Jest, Playwright
- **CI/CD**: GitHub Actions

## 📋 Comandos Essenciais

### Desenvolvimento
```bash
npm run dev:all          # Inicia todos os serviços
npm run dev:frontend     # Apenas frontend (React/Next.js)
npm run dev:backend      # Apenas backend (Node.js/Express)
npm run test:watch       # Testes em watch mode
npm run health:check     # Verificar saúde do sistema
```

### IA Automation
```bash
npm run ai:docs          # Gerar documentação automática
npm run ai:test          # Gerar testes para código
npm run ai:refactor      # Sugestões de refatoração
npm run ai:security      # Análise de segurança com IA
```

### Qualidade e Segurança
```bash
npm run test             # Executar todos os testes
npm run test:coverage    # Testes com cobertura
npm run lint             # Verificar code style
npm run security:check   # Auditoria de segurança
npm run deps:update      # Atualizar dependências
```

### Deploy e Produção
```bash
npm run build            # Build para produção
npm run deploy:staging   # Deploy para staging
npm run deploy:prod      # Deploy para produção
npm run rollback         # Rollback do último deploy
npm run backup          # Backup do banco de dados
```

### Módulos
```bash
nexus module:add auth    # Adicionar módulo de autenticação
nexus module:add payments # Adicionar módulo de pagamentos
nexus module:list        # Listar módulos disponíveis
nexus module:remove ui   # Remover módulo
nexus module:update      # Atualizar todos os módulos
```

## � Exemplos Práticos

### Criar API Backend Completa (5 minutos)
```bash
# 1. Criar projeto backend
nexus create api-vendas --type backend

# 2. Configurar módulos
cd api-vendas
# Editar nexus.config.js para habilitar auth, database, monitoring

# 3. Gerar modelos automaticamente
npm run ai:generate-models -- --entity Product,Customer,Order

# 4. Deploy automático
git add . && git commit -m "Initial setup"
git push origin main  # Dispara CI/CD automático
```

### Dashboard Admin em React (10 minutos)
```bash
# 1. Criar projeto frontend
nexus create admin-dashboard --type frontend

# 2. Configurar UI e auth
cd admin-dashboard
# UI e Auth já vêm pré-configurados

# 3. Personalizar tema
npm run ui:theme-generator  # Gerar paleta de cores

# 4. Adicionar páginas automaticamente
npm run ai:generate-pages -- --pages users,products,analytics

# 5. Deploy
npm run deploy:prod
```

### Sistema Completo (E-commerce em 3 horas)
```bash
# 1. Criar projeto fullstack
nexus create loja-online --type fullstack

# 2. Configurar todos os módulos
# Auth, Database, UI, Payments (Stripe), Notifications

# 3. Gerar estrutura automaticamente
npm run ai:generate-ecommerce

# 4. Customizar com IA
npm run ai:customize -- --business "loja de roupas femininas"

# 5. Testes automáticos
npm run ai:test suite

# 6. Deploy completo
npm run deploy:full  # Frontend + Backend + Database
```

### Microserviço de Notificações
```bash
# 1. Criar microserviço
nexus create notifications-service --type microservice

# 2. Configurar apenas módulos necessários
# Notifications, Monitoring, Database

# 3. Implementar com IA
npm run ai:implement -- --service "envio de emails e WhatsApp"

# 4. Integrar com sistema principal
npm run integrate --with api-vendas

# 5. Deploy em container
npm run deploy:docker
```

## 📚 Documentação

- [📖 Guia Completo](./docs/guide.md)
- [🔐 Módulo Auth](./modules/auth/README.md)
- [📊 Módulo Database](./modules/database/README.md)
- [🎨 Módulo UI](./modules/ui/README.md)
- [🤖 Integração IA](./modules/ai/README.md)

## 🗺️ Roadmap

### MVP (Atual)
- ✅ Sistema de módulos
- ✅ Auth básico
- ✅ Database abstraction
- ✅ UI components
- ✅ CI/CD automatizado

### v1.0 (Próximo)
- 🚧 Payments completo
- 🚧 Notifications
- 🚧 Monitoring avançado
- 🚧 Testes E2E

### v2.0 (Futuro)
- 📋 Marketplace de módulos
- 🔌 API para equipes
- 🎯 Auto-scaling
- 🧠 IA avançada

## 🤝 Contribuindo

```bash
# Clonar repositório
git clone https://github.com/KallebyX/nexus.git

# Instalar dependências
npm install

# Executar testes
npm test

# Verificar saúde
npm run health:check
```

## 📄 Licença

MIT © [Oryum Tech](https://oryum.tech)

---

<div align="center">

**Construído com ❤️ pela [Oryum Tech](https://oryum.tech)**

[🌐 Website](https://oryum.tech) • [📧 Contato](mailto:contato@oryum.tech) • [📱 Trello](https://trello.com/b/oryum)

</div>
