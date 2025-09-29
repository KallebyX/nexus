# 🚀 Nexus Framework - Guia de Início Rápido

Este guia mostra como usar o Nexus Framework para criar uma aplicação completa em poucos minutos.

## 📋 Pré-requisitos

```bash
# Node.js 18+ e PostgreSQL
node --version  # >= 18.0.0
psql --version  # PostgreSQL 12+

# Opcional: Redis para cache
redis-server --version
```

## 🏁 Setup Inicial

### 1. Clone e Configuração
```bash
git clone https://github.com/oryum/nexus.git
cd nexus
npm install
```

### 2. Configuração do Banco
```bash
# Criar banco PostgreSQL
createdb nexus_dev

# Configurar variáveis de ambiente
cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexus_dev
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d

# API
PORT=3001
NODE_ENV=development
EOF
```

### 3. Executar Migrações
```bash
npm run db:migrate
```

## 🎯 Exemplo Básico: Sistema de Usuários

### 1. Configuração do Database
```javascript
// app.js
import { initializeDatabase } from './modules/database/index.js';
import { initializeAuthModule } from './modules/auth/index.js';

async function setupNexus() {
  // Inicializar database
  const db = await initializeDatabase();
  
  // Inicializar auth  
  const auth = await initializeAuthModule();
  
  // Sincronizar banco (apenas dev)
  await db.syncDatabase();
  
  return { db, auth };
}
```

### 2. Usando os Modelos
```javascript
const { db, auth } = await setupNexus();

// Criar usuário
const user = await db.User.create({
  email: 'joao@exemplo.com',
  first_name: 'João',
  last_name: 'Silva',
  password: 'senha123'
});

// Login
const loginResult = await auth.login('joao@exemplo.com', 'senha123');
console.log('Token:', loginResult.tokens.access_token);

// Verificar permissões
const hasPermission = await user.hasPermission('users.read.own');
console.log('Pode ler próprio perfil:', hasPermission);
```

### 3. API Express Completa
```javascript
import express from 'express';

const app = express();
app.use(express.json());

// Middleware de auth
app.use('/api/protected', auth.authenticate());

// Rota de registro
app.post('/api/register', async (req, res) => {
  try {
    const result = await auth.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota de login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await auth.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Rota protegida
app.get('/api/protected/profile', async (req, res) => {
  const user = await db.User.findByPk(req.user.id);
  res.json({ user: user.toSafeJSON() });
});

app.listen(3001, () => {
  console.log('🚀 Servidor rodando na porta 3001');
});
```

## 🎨 Usando Componentes UI

### 1. Setup React App
```bash
npx create-react-app minha-app
cd minha-app
npm install @oryum/nexus
```

### 2. Usando Componentes
```jsx
// App.jsx
import { Button, Input, Alert, LoginForm } from '@oryum/nexus/ui';
import { useAuth, useForm } from '@oryum/nexus/hooks';

function App() {
  const { login, user, isAuthenticated } = useAuth();
  const { register } = useForm();

  if (isAuthenticated) {
    return (
      <div>
        <Alert type="success">
          Bem-vindo, {user.first_name}!
        </Alert>
        <Button onClick={() => logout()}>
          Sair
        </Button>
      </div>
    );
  }

  return (
    <LoginForm 
      onSubmit={login}
      onRegister={register}
      showSocialLogins={true}
    />
  );
}
```

### 3. Hook de API
```jsx
import { useApi } from '@oryum/nexus/hooks';

function UsersList() {
  const { data, loading, error } = useApi('/api/users');
  
  if (loading) return <div>Carregando...</div>;
  if (error) return <Alert type="error">{error.message}</Alert>;
  
  return (
    <div>
      {data.users.map(user => (
        <div key={user.id}>
          {user.first_name} {user.last_name} - {user.email}
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Sistema RBAC (Roles e Permissões)

### 1. Definindo Permissões Personalizadas
```javascript
// Criar permissão customizada
await db.Permission.create({
  name: 'posts.publish',
  resource: 'posts',
  action: 'admin',
  description: 'Publicar posts no blog'
});

// Criar role customizado
const editorRole = await db.Role.create({
  name: 'blog_editor',
  display_name: 'Editor do Blog',
  description: 'Pode criar e editar posts'
});

// Associar permissão ao role
await editorRole.addPermission('posts.create');
await editorRole.addPermission('posts.update.own');
await editorRole.addPermission('posts.publish');
```

### 2. Middleware de Autorização
```javascript
// Só editores podem publicar
app.post('/api/posts/:id/publish', 
  auth.authenticate(),
  auth.authorize('posts.publish'),
  async (req, res) => {
    // Lógica de publicação
  }
);

// Só pode editar próprios posts
app.put('/api/posts/:id',
  auth.authenticate(),
  auth.requireOwnership('id', 'Post'),
  async (req, res) => {
    // Lógica de edição
  }
);
```

## 📊 Logs e Monitoramento

### 1. Logs Automáticos
```javascript
// Todos os modelos já fazem log automaticamente
const user = await db.User.create({ ... }); // Log: user_created
await user.update({ status: 'active' });    // Log: user_updated
await user.destroy();                       // Log: user_deleted

// Auth faz logs de segurança
await auth.login(email, password); // Log: user_login, login_failed
```

### 2. Consultar Logs
```javascript
// Logs de um usuário
const userLogs = await db.ActivityLog.findAll({
  where: { user_id: user.id },
  order: [['created_at', 'DESC']]
});

// Logs por ação
const loginLogs = await db.ActivityLog.findAll({
  where: { action: 'user_login' },
  include: ['user']
});

// Logs de segurança
const securityLogs = await db.ActivityLog.findAll({
  where: { 
    action: ['login_failed', 'access_denied', 'account_locked'] 
  }
});
```

## ⚙️ Configurações Dinâmicas

### 1. Configurações do Sistema
```javascript
// Buscar configuração
const maxLoginAttempts = await db.Setting.get('security.max_login_attempts', 5);

// Definir configuração
await db.Setting.set('app.theme', 'dark');

// Configurações por usuário
await db.Setting.set('notifications.email', true, userId);
```

### 2. Configurações na API
```javascript
// Endpoint público para configurações
app.get('/api/settings', async (req, res) => {
  const settings = await db.Setting.getPublicSettings();
  res.json(settings);
});

// Endpoint admin para todas configurações
app.get('/api/admin/settings', 
  auth.requireRole('admin'),
  async (req, res) => {
    const settings = await db.Setting.getByCategory('all', true);
    res.json(settings);
  }
);
```

## 🚀 Deploy e Produção

### 1. Build para Produção
```bash
# Instalar dependências de produção
npm ci --production

# Configurar variáveis de ambiente
export NODE_ENV=production
export DATABASE_URL=postgresql://...
export JWT_SECRET=...

# Executar migrações
npm run db:migrate
```

### 2. Docker (Recomendado)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### 3. Health Checks
```javascript
// Endpoint de health check (já incluído)
app.get('/health', async (req, res) => {
  const health = await db.healthCheck();
  res.json({
    status: 'healthy',
    database: health,
    timestamp: new Date()
  });
});
```

## 📚 Próximos Passos

1. **Explorar Exemplos**: Veja `/examples/` para mais casos de uso
2. **Ler Documentação**: Consulte `/docs/WIKI.md` para referência completa  
3. **Contribuir**: Veja issues no GitHub para contribuir
4. **Comunidade**: Join Discord para suporte e discussões

## 🆘 Troubleshooting

### Problemas Comuns

**Erro de Conexão com Banco**:
```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Testar conexão
psql $DATABASE_URL
```

**Erro de JWT**:
- Certifique-se que `JWT_SECRET` está configurado
- Tokens expiram em 7 dias por padrão

**Permissões Negadas**:
- Verifique se usuário tem o role correto
- Confirme se role tem as permissões necessárias

**Performance**:
- Use Redis para cache (opcional mas recomendado)
- Configure connection pooling no PostgreSQL

---

*Para suporte: Discord `#nexus-support` ou GitHub Issues*