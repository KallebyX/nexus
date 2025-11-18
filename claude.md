# Claude.md - Nexus Framework

## 📋 Visão Geral do Projeto

**Nexus Framework** é um framework empresarial modular full-stack que reduz o tempo de desenvolvimento em 40%. Desenvolvido pela Oryum Tech, oferece uma solução completa de plug-and-play com automação AI-powered.

### Métricas do Projeto
- **Versão**: 1.0.0
- **Status**: 99% Completo - Production Ready
- **Linhas de Código**: 21,821 linhas em 93 arquivos JavaScript
- **Cobertura de Testes**: 86% com 32 testes automatizados
- **Quality Score**: 1.94/3.0 ("Good")

---

## 🏗️ Arquitetura

### Padrões Arquiteturais Utilizados

1. **Modular Plug-and-Play Architecture**
   - Cada módulo é independente e pode ser inicializado separadamente
   - Pattern Singleton para instâncias de módulos
   - Lazy loading support

2. **Configuration-Driven Development**
   - Configuração centralizada em `nexus.config.js`
   - Configurações específicas por ambiente (dev/staging/prod)

3. **Service-Oriented Pattern**
   - Cada módulo expõe classes de serviço
   - Middleware pattern para cross-cutting concerns

4. **ORM com Active Record Pattern**
   - Sequelize models com herança de BaseModel
   - Audit trails, soft deletes, versioning

5. **Factory Pattern**
   - `NexusFramework.createApp(type)` para setup rápido

---

## 📁 Estrutura de Diretórios

```
nexus/
├── modules/              # 11 módulos empresariais (arquitetura core)
│   ├── auth/            # JWT, OAuth, RBAC, gerenciamento de sessão
│   ├── database/        # Sequelize ORM com 6 models
│   ├── api/             # Express.js REST API
│   ├── ui/              # React components, hooks, utilities
│   ├── ai/              # Integração OpenAI/Claude
│   ├── payments/        # Stripe, MercadoPago, PayPal
│   ├── notifications/   # Email, SMS, Push, WhatsApp
│   ├── monitoring/      # Winston logging, Prometheus/Grafana
│   ├── testing/         # Jest testing framework
│   ├── docker/          # Utilitários de containerização
│   └── [outros módulos]
├── cli/                 # Interface de linha de comando
│   ├── nexus.js        # CLI principal (551 linhas)
│   └── create-project.js
├── scripts/            # Automação e scripts AI
│   ├── deploy-manager.js
│   ├── health-check.js
│   ├── ai-docs-generator.js
│   ├── ai-test-generator.js
│   ├── security-checker.js
│   ├── code-analyzer.py
│   └── nexus-auto-refactor.py
├── templates/          # Templates de projeto
│   ├── backend/
│   ├── frontend/
│   └── microservice/
├── docs/              # Documentação
├── examples/          # Implementações demo
├── utils/             # Utilitários compartilhados
├── index.js          # Entry point do framework
└── nexus.config.js   # Configuração padrão
```

---

## 🔧 Stack Tecnológico

### Backend
- **Node.js** 18+ com ES Modules
- **Express.js** - Framework de API
- **Sequelize ORM** - PostgreSQL, Redis, MongoDB support
- **JWT + Passport.js** - Autenticação
- **bcryptjs** - Hash de senhas

### Frontend
- **React** 18.3.1
- **Next.js** 14.0.4
- **TypeScript** support

### Testing
- **Jest** 29.7.0
- **React Testing Library**
- **Supertest** - Testes de API
- **Selenium WebDriver** - E2E
- 30 arquivos de teste

### DevOps
- **Docker** - Multi-stage builds
- **Docker Compose** - Configs dev + produção
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy

### Databases
- **PostgreSQL** - Primário via Sequelize
- **Redis** - Cache/sessions
- **MongoDB** support
- **Supabase** integration

### AI/Automação
- **OpenAI API** integration
- **Model Context Protocol (MCP)**
- Análise automatizada de código
- Geração auto de docs e testes

### Payments
- **Stripe**
- **MercadoPago** (PIX, Card, Boleto)
- **PayPal**

### Comunicação
- **Twilio** - SMS
- **Nodemailer** - Email
- **Web Push** - Notificações
- **WhatsApp** support

### Segurança
- Helmet.js
- Express Rate Limit
- CORS
- Joi validation
- SQL injection protection

---

## 🔑 Arquivos Importantes

### Entry Points
- `/index.js` - Export principal do framework com classe NexusFramework
- `/cli/nexus.js` - Interface CLI (executável via `nexus`)
- `/nexus.config.js` - Configuração padrão do framework

### Módulos Principais
- `/modules/auth/index.js` - Módulo de autenticação
- `/modules/database/index.js` - Módulo de database
- `/modules/api/index.js` - Módulo de API

### Database Models (6 modelos)
- User
- UserSession
- ActivityLog
- Permission
- Role
- Setting

### Scripts Importantes
- `deploy-manager.js` - Deploy multi-ambiente
- `health-check.js` - Diagnósticos do sistema
- `security-checker.js` - Auditorias de segurança
- `ai-docs-generator.js` - Auto-documentação

---

## ✅ Status de Implementação

### Completo (100%)

✅ **Core Framework** - Arquitetura modular, sistema ES modules, health check
✅ **CLI Tools** - Scaffolding, add modules, dev server, DB management, Docker, deploy
✅ **Auth Module** - JWT, RBAC, sessions, rate limiting, audit logging
✅ **Database Module** - Sequelize, 6 models, migrations, connection pooling
✅ **API Module** - Express, security middleware, rate limiting, error handling
✅ **UI Module** - React components, hooks, form builder, utilities
✅ **Docker Module** - Multi-stage builds, Compose, Nginx, SSL/TLS
✅ **Testing Module** - Jest, 30 test files, 86% coverage
✅ **Monitoring Module** - Winston logging, Prometheus/Grafana
✅ **Payments Module** - Stripe, MercadoPago, PayPal, subscriptions
✅ **Notifications Module** - Multi-channel, templates, queue
✅ **AI Module** - OpenAI, code analysis, template generation
✅ **Documentation** - README, WIKI, TUTORIAL, QUICKSTART

### Gaps Identificados (1%)

⚠️ **Minor Gaps:**
- Cobertura de testes poderia ser melhorada (atual: 86%, meta: 90%+)
- Testes E2E configurados mas podem precisar mais casos
- Algumas features AI integradas mas precisam validação real
- Módulo Marketplace existe mas integração pode ser mínima

⚠️ **Considerações de Produção:**
- Faltam configurações de deploy para cloud providers específicos
- Resultados de security audit não visíveis
- Benchmarks de performance mencionados mas relatórios não encontrados
- Algumas variáveis de ambiente precisam ser configuradas
- Certificados SSL precisam ser fornecidos para produção

⚠️ **Limitações Conhecidas:**
- Framework requer Node.js 18+
- PostgreSQL é necessário para funcionalidade completa
- Alguns módulos requerem serviços externos
- Scripts Python requerem ambiente Python

---

## 🚀 Comandos Principais

### Build
```bash
npm install              # Instalar dependências
npm run build           # Build frontend + backend
npm run build:frontend  # Build Next.js
npm run build:backend   # Compilação backend
npm run lint            # ESLint com auto-fix
npm run format          # Prettier formatting
```

### Testing
```bash
npm test              # Executar todos os testes
npm run test:watch    # Modo watch
```

### Deploy
```bash
npm run deploy          # Deploy usando scripts
nexus deploy dev        # Deploy development
nexus deploy staging    # Deploy staging
nexus deploy prod       # Deploy production
```

### Docker
```bash
nexus docker --init     # Inicializar arquivos Docker
nexus docker --build    # Build imagem
nexus docker --run      # Iniciar containers
docker-compose up       # Development
docker-compose -f docker-compose.production.yml up # Production
```

### Database
```bash
npm run db:migrate     # Executar migrations
npm run db:seed        # Seed database
npm run db:reset       # Reset database
nexus db              # Gerenciamento DB interativo
```

### Health
```bash
npm run health:check    # Diagnósticos de saúde do sistema
nexus health           # Health check via CLI
```

---

## 🎯 Objetivos do Framework

1. **Reduzir tempo de desenvolvimento em 40%**
2. **Fornecer arquitetura modular plug-and-play**
3. **Automação AI-powered para desenvolvimento**
4. **Segurança empresarial por padrão**
5. **Integração completa de DevOps**
6. **Scaffolding e deploy rápidos**

---

## 📚 Documentação Disponível

- **README.md** (13KB) - Visão geral e quick start
- **WIKI.md** (47KB) - Referência técnica completa
- **TUTORIAL.md** (11KB) - Guia hands-on
- **QUICKSTART.md** (8.5KB) - Setup rápido
- **use-cases.md** - Casos de uso validados
- READMEs específicos por módulo

---

## 🔐 Segurança

### Features Implementadas
- JWT com refresh tokens
- RBAC hierárquico
- Rate limiting anti-brute force
- Helmet.js para headers seguros
- CORS configurável
- Joi validation
- SQL injection protection
- Audit logging
- Session management com device tracking
- Password policies

---

## 🧪 Testing

### Estrutura de Testes
- Testes unitários em diretórios `__tests__` dentro de cada módulo
- Testes de integração para endpoints API
- Testes de componentes para módulo UI
- 32 testes automatizados passando
- Cobertura de 86%

### Configuração Jest
- Node environment
- Babel transformation
- Coverage collection
- HTML/LCOV/text reporters

---

## 🐳 Docker & DevOps

### Docker
- Multi-stage Dockerfile (builder + production)
- Docker Compose para dev e produção
- Nginx configurado
- SSL/TLS support
- Health checks integrados

### CI/CD
- GitHub Actions pipeline
- Triggers em push para main/develop e PRs
- Jobs: test, build, deploy
- Docker Buildx com cache
- Security audit automatizado

---

## 💡 Convenções de Código

### JavaScript/Node.js
- ES Modules (import/export)
- Async/await para operações assíncronas
- Error handling com try/catch
- Middleware pattern

### Estrutura de Módulos
```javascript
modules/
  nome-modulo/
    index.js          # Export principal
    config.js         # Configurações
    middleware/       # Middlewares
    services/         # Lógica de negócio
    models/           # Models Sequelize
    __tests__/        # Testes
    README.md         # Docs do módulo
```

### Configuração
- Configurações em `nexus.config.js`
- Variáveis de ambiente em `.env`
- Configurações específicas por módulo em `config.js`

---

## 🎓 Próximos Passos Sugeridos

1. **Melhorar Cobertura de Testes**: De 86% para 90%+
2. **Adicionar Testes E2E**: Mais casos de teste end-to-end
3. **Documentação de Deploy**: Guias específicos para AWS, GCP, Azure
4. **Security Audit**: Executar e documentar resultados
5. **Performance Benchmarks**: Gerar e documentar relatórios
6. **Marketplace Integration**: Completar integração do módulo marketplace
7. **Produção**: Configurar para deploy real em cloud
8. **Monitoramento**: Configurar Sentry/error tracking em produção

---

## 📞 Suporte

- **Documentação**: Ver `/docs`
- **Exemplos**: Ver `/examples`
- **Issues**: GitHub issues
- **Oryum Tech**: Desenvolvedores do framework
