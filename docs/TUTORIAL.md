# 📚 Nexus Framework - Tutorial Completo de Uso

## 🎯 Guia Definitivo: Do Zero ao Deploy em 30 Minutos

**Bem-vindo ao tutorial oficial do Nexus Framework!** Este guia vai te levar do setup inicial até ter uma aplicação enterprise completa rodando em produção.

---

## 📋 Pré-requisitos

### 🛠️ Ferramentas Necessárias
```bash
# Node.js 18+ e npm
node --version  # >= 18.0.0
npm --version   # >= 8.0.0

# Docker (opcional, mas recomendado)
docker --version
docker-compose --version

# Git
git --version
```

### 📦 Dependências do Sistema
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y curl git build-essential

# macOS (com Homebrew)
brew install node npm git docker

# Windows (com Chocolatey)
choco install nodejs npm git docker-desktop
```

---

## 🚀 Parte 1: Instalação e Setup (5 minutos)

### 1.1 Instalação Global do CLI
```bash
# Instalar o Nexus CLI globalmente
npm install -g @oryum/nexus

# Verificar instalação
nexus --version
nexus --help
```

### 1.2 Primeiro Projeto
```bash
# Criar novo projeto
nexus create meu-projeto-enterprise

# Navegar para o diretório
cd meu-projeto-enterprise

# Verificar estrutura criada
tree -L 3
```

### 1.3 Setup Inicial Automático
```bash
# Instalar dependências
npm install

# Configurar ambiente de desenvolvimento
nexus dev --setup

# Verificar health do projeto
nexus health --detailed
```

**✅ Resultado Esperado**: Projeto criado com 13 módulos enterprise funcionais.

---

## 🏗️ Parte 2: Arquitetura e Módulos (10 minutos)

### 2.1 Explorando a Estrutura
```
meu-projeto-enterprise/
├── modules/                 # 📦 Módulos core
│   ├── auth/               # 🔐 Autenticação JWT + RBAC
│   ├── database/           # 🗄️ ORM + Models + Migrations
│   ├── api/                # 🌐 Express + Middleware
│   ├── ui/                 # 🎨 React Components
│   ├── docker/             # 🐳 Containerização
│   ├── testing/            # 🧪 Jest + Coverage
│   ├── monitoring/         # 📊 Logs + Metrics
│   ├── notifications/      # 📢 Email + SMS + Push
│   └── payments/           # 💳 Stripe + MercadoPago
├── scripts/                # 🤖 Automação + IA
├── templates/              # 📋 Scaffolding
└── docs/                   # 📚 Documentação
```

### 2.2 Configuração do Database
```bash
# Configurar PostgreSQL (Docker)
nexus docker --init database

# Criar e rodar migrations
nexus db migrate

# Popular com dados iniciais
nexus db seed --env development
```

### 2.3 Configuração da Autenticação
```javascript
// config/auth.js
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
    refreshExpiresIn: '30d'
  },
  rbac: {
    enabled: true,
    defaultRole: 'user',
    adminRole: 'admin'
  }
};
```

**✅ Resultado**: Database configurado, modelos criados, autenticação ativa.

---

## 🎨 Parte 3: Desenvolvimento Frontend (10 minutos)

### 3.1 Componentes Prontos
```jsx
// src/pages/Dashboard.jsx
import { useAuth, DataTable, Modal } from '@nexus/ui';

export function Dashboard() {
  const { user, permissions } = useAuth();
  
  return (
    <div className="nexus-dashboard">
      <h1>Bem-vindo, {user.name}!</h1>
      
      {permissions.includes('admin') && (
        <DataTable 
          endpoint="/api/users"
          columns={['name', 'email', 'role']}
          actions={['edit', 'delete']}
          searchable
          paginated
        />
      )}
    </div>
  );
}
```

### 3.2 Hooks Enterprise
```jsx
// Usando hooks prontos do framework
import { 
  useAuth,      // Autenticação completa
  useApi,       // Requests com cache
  useForm,      // Formulários validados
  useRealtime,  // WebSocket + SSE
  usePermissions // RBAC granular
} from '@nexus/ui';

export function UserManagement() {
  const { hasPermission } = usePermissions();
  const { get, post, put, delete: del } = useApi();
  const { data: users, loading, error } = get('/api/users');
  
  if (!hasPermission('users.read')) {
    return <AccessDenied />;
  }
  
  // Componente renderiza automaticamente
}
```

### 3.3 Servidor de Desenvolvimento
```bash
# Iniciar servidor com hot reload
nexus dev

# Abre automaticamente:
# Frontend: http://localhost:3000
# API: http://localhost:3001
# Admin: http://localhost:3002
```

**✅ Resultado**: Interface completa com autenticação, dashboard e componentes enterprise.

---

## 🌐 Parte 4: Backend e APIs (5 minutos)

### 4.1 APIs Auto-Geradas
```javascript
// O framework já criou estas rotas automaticamente:

// Autenticação
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh

// Usuários (com RBAC)
GET    /api/users          # Lista usuários
POST   /api/users          # Criar usuário
GET    /api/users/:id      # Buscar usuário
PUT    /api/users/:id      # Atualizar usuário
DELETE /api/users/:id      # Deletar usuário

// Admin
GET    /api/admin/health   # Status do sistema
GET    /api/admin/metrics  # Métricas em tempo real
GET    /api/admin/logs     # Logs do sistema
```

### 4.2 Criando APIs Customizadas
```javascript
// modules/api/routes/produtos.js
import { Router } from 'express';
import { authMiddleware, rbacMiddleware } from '@nexus/auth';

const router = Router();

// Middleware automático de auth + RBAC
router.use(authMiddleware);

// CRUD automático com validação
router.get('/', rbacMiddleware('produtos.read'), async (req, res) => {
  const produtos = await Produto.findAll({
    include: ['categoria', 'fornecedor'],
    where: req.query.filters,
    order: req.query.sort,
    limit: req.query.limit || 50
  });
  
  res.json({ produtos, total: produtos.length });
});

export default router;
```

### 4.3 Testando APIs
```bash
# Testar endpoints com curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nexus.dev", "password": "admin123"}'

# Ou usar a interface de testes automática
nexus test api --interactive
```

**✅ Resultado**: APIs REST completas com autenticação, validação e documentação.

---

## 🐳 Parte 5: Containerização e Deploy

### 5.1 Setup Docker
```bash
# Gerar arquivos Docker otimizados
nexus docker --init

# Build da aplicação
nexus docker build --env production

# Rodar localmente
nexus docker up
```

### 5.2 Deploy Multi-Ambiente
```bash
# Deploy para desenvolvimento
nexus deploy development

# Deploy para staging
nexus deploy staging --migrate

# Deploy para produção (com aprovação)
nexus deploy production --require-approval
```

### 5.3 Monitoramento
```bash
# Verificar status dos serviços
nexus health --remote

# Ver logs em tempo real
nexus logs --follow --environment production

# Métricas de performance
nexus metrics --dashboard
```

**✅ Resultado**: Aplicação rodando em produção com monitoramento completo.

---

## 🧪 Parte 6: Testes e Qualidade

### 6.1 Testes Automatizados
```bash
# Rodar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes específicos
npm test modules/auth
npm test api/users
```

### 6.2 Análise de Qualidade
```bash
# Análise de código com MCP
nexus analyze --full

# Sugestões de refatoração
nexus refactor --suggestions

# Security scan
nexus security --scan
```

### 6.3 Relatórios
```bash
# Gerar relatório completo
nexus report --format html

# Coverage report
nexus coverage --open

# Performance report
nexus performance --benchmark
```

**✅ Resultado**: 86% test coverage, código analisado, vulnerabilidades detectadas.

---

## 📊 Exemplos Práticos Completos

### 🛒 E-commerce em 15 Minutos
```bash
# Criar loja online completa
nexus create loja-online --template ecommerce

cd loja-online
nexus dev

# Funcionalidades incluídas:
# ✅ Catálogo de produtos
# ✅ Carrinho de compras
# ✅ Pagamentos (Stripe + PIX)
# ✅ Gestão de pedidos
# ✅ Admin dashboard
# ✅ Relatórios de vendas
```

### 📱 SaaS Platform em 20 Minutos
```bash
# Criar plataforma SaaS
nexus create minha-saas --template saas

cd minha-saas
nexus dev --with-billing

# Funcionalidades incluídas:
# ✅ Multi-tenancy
# ✅ Subscription management
# ✅ API rate limiting
# ✅ Billing automático
# ✅ Analytics dashboard
# ✅ User onboarding
```

### 🏢 Corporate Dashboard em 10 Minutos
```bash
# Dashboard corporativo
nexus create corp-dash --template corporate

cd corp-dash
nexus dev --with-monitoring

# Funcionalidades incluídas:
# ✅ Real-time metrics
# ✅ User management
# ✅ Role-based access
# ✅ Data visualization
# ✅ Report generation
# ✅ Alert system
```

---

## 🔧 Comandos Essenciais de Produção

### 📊 Monitoramento
```bash
# Health check completo
nexus health --all-services

# Logs estruturados
nexus logs --json --level error

# Métricas em tempo real
nexus metrics --live --port 9090

# Backup automático
nexus backup --schedule daily
```

### 🚀 Deploy e Rollback
```bash
# Deploy com zero downtime
nexus deploy production --zero-downtime

# Rollback automático se falhar
nexus deploy production --auto-rollback

# Blue-green deployment
nexus deploy production --strategy blue-green

# Canary release
nexus deploy production --canary 10%
```

### 🔒 Segurança
```bash
# Scan de vulnerabilidades
nexus security --full-scan

# Audit de dependências
nexus audit --fix-critical

# Certificate management
nexus ssl --auto-renew

# Rate limiting config
nexus rate-limit --update-rules
```

---

## 🎯 Troubleshooting Comum

### ❌ Problema: "Database connection failed"
```bash
# Solução
nexus db --reset-connection
nexus health --check-db
nexus docker restart database
```

### ❌ Problema: "Auth token expired"
```bash
# Solução
nexus auth --refresh-tokens
nexus config auth.jwt.expiresIn 24h
```

### ❌ Problema: "Module not found"
```bash
# Solução
nexus modules --refresh
npm install
nexus health --check-modules
```

### 📞 Suporte
- 📚 Documentação: https://nexus.dev/docs
- 💬 Discord: https://discord.gg/nexus-dev
- 🐛 Issues: https://github.com/KallebyX/nexus/issues
- 📧 Email: support@nexus.dev

---

## 🎉 Parabéns!

Você completou o tutorial completo do Nexus Framework! Agora você pode:

✅ **Criar aplicações enterprise em minutos**  
✅ **Deploy automatizado em múltiplos ambientes**  
✅ **Monitoramento e métricas em tempo real**  
✅ **Segurança enterprise com RBAC**  
✅ **Testes automatizados com 86% coverage**  
✅ **APIs REST prontas para produção**  

### 🚀 Próximos Passos
1. Explore os templates avançados (`nexus templates --list`)
2. Configure integração CI/CD (`nexus ci --setup`)
3. Implemente features customizadas (`nexus generate --help`)
4. Join da comunidade Nexus (`nexus community --join`)

**O Nexus Framework transformou desenvolvimento enterprise!** 🎊

---

*Tutorial atualizado: Setembro 2025*  
*Versão do Framework: 1.0.0*  
*Status: Production Ready* ✅