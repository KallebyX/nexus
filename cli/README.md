# CLI Nexus - Oryum Framework

## Comandos Disponíveis

### Criação de Projetos
```bash
# Criar novo projeto completo
npx @oryum/nexus create <project-name>

# Criar projeto com template específico
npx @oryum/nexus create <project-name> --template=backend
npx @oryum/nexus create <project-name> --template=frontend
npx @oryum/nexus create <project-name> --template=microservice
npx @oryum/nexus create <project-name> --template=fullstack
```

### Gerenciamento de Módulos
```bash
# Listar módulos disponíveis
nexus module:list

# Instalar módulo
nexus module:install <module-name>

# Atualizar módulo
nexus module:update <module-name>

# Remover módulo
nexus module:remove <module-name>

# Sincronizar registry
nexus module:sync
```

### Desenvolvimento
```bash
# Iniciar desenvolvimento
nexus dev

# Executar testes
nexus test
nexus test:unit
nexus test:integration
nexus test:e2e
nexus test:performance
nexus test:security

# Build do projeto
nexus build

# Deploy
nexus deploy
nexus deploy:staging
nexus deploy:production
```

### Automação IA
```bash
# Gerar documentação
nexus ai:docs

# Gerar testes
nexus ai:tests <file-path>

# Refatorar código
nexus ai:refactor <file-path>

# Análise de segurança
nexus ai:security
```

### Monitoramento
```bash
# Health check completo
nexus health

# Verificar logs
nexus logs
nexus logs:errors
nexus logs:performance

# Métricas
nexus metrics

# Backup
nexus backup
```

### Integrações
```bash
# Configurar Trello
nexus integration:trello:setup

# Configurar Slack
nexus integration:slack:setup

# Configurar GitHub
nexus integration:github:setup

# Listar integrações
nexus integration:list

# Status das integrações
nexus integration:status
```

### Configuração
```bash
# Configuração inicial
nexus init

# Configurar ambiente
nexus config:env

# Verificar configuração
nexus config:check

# Reset de configuração
nexus config:reset
```

## Exemplos de Uso

### Criando um novo projeto
```bash
# Projeto fullstack completo
npx @oryum/nexus create my-app --template=fullstack

# Microserviço para pagamentos
npx @oryum/nexus create payment-service --template=microservice

# API backend simples
npx @oryum/nexus create api-server --template=backend
```

### Adicionando módulos
```bash
# Instalar módulo de pagamentos
nexus module:install payments

# Instalar múltiplos módulos
nexus module:install auth database ui notifications

# Atualizar todos os módulos
nexus module:update:all
```

### Desenvolvimento com IA
```bash
# Gerar testes para arquivo específico
nexus ai:tests src/modules/auth/index.js

# Documentar módulo completo
nexus ai:docs modules/payments/

# Refatorar com melhorias sugeridas
nexus ai:refactor src/components/UserForm.jsx
```

## Configuração Inicial

### 1. Instalação Global
```bash
npm install -g @oryum/nexus
```

### 2. Configuração do Ambiente
```bash
# Criar arquivo .env
nexus config:env

# Configurar integrações
nexus integration:setup
```

### 3. Primeiro Projeto
```bash
# Criar projeto
nexus create my-first-app

# Entrar no diretório
cd my-first-app

# Iniciar desenvolvimento
nexus dev
```

## Estrutura de Comandos

### nexus create [options]
- `--template`: Template a usar (fullstack, backend, frontend, microservice)
- `--modules`: Módulos a instalar automaticamente
- `--no-git`: Não inicializar git
- `--no-install`: Não instalar dependências

### nexus module [subcommand]
- `list`: Lista módulos disponíveis
- `install <name>`: Instala módulo
- `update <name>`: Atualiza módulo
- `remove <name>`: Remove módulo
- `info <name>`: Informações do módulo

### nexus test [type]
- `unit`: Testes unitários
- `integration`: Testes de integração
- `e2e`: Testes end-to-end
- `performance`: Testes de performance
- `security`: Testes de segurança
- `all`: Todos os tipos

### nexus ai [action]
- `docs [path]`: Gerar documentação
- `tests [file]`: Gerar testes
- `refactor [file]`: Refatorar código
- `security`: Análise de segurança

## Configuração Avançada

### nexus.config.js
```javascript
export default {
  project: {
    name: 'my-app',
    version: '1.0.0',
    description: 'Minha aplicação Nexus'
  },
  modules: {
    auth: { enabled: true, provider: 'jwt' },
    database: { enabled: true, provider: 'postgresql' },
    payments: { enabled: true, provider: 'stripe' },
    notifications: { enabled: true }
  },
  integrations: {
    trello: { enabled: true, boardId: 'xxx' },
    slack: { enabled: true, channel: '#dev' },
    github: { enabled: true, repo: 'owner/repo' }
  },
  deployment: {
    platform: 'vercel',
    environment: 'production'
  }
};
```

### Variáveis de Ambiente
```bash
# Framework
NEXUS_ENV=development
NEXUS_API_KEY=your_api_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Auth
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email
SMTP_PASS=your_password
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx

# Integrations
TRELLO_API_KEY=xxx
TRELLO_TOKEN=xxx
SLACK_BOT_TOKEN=xoxb-xxx
GITHUB_TOKEN=ghp_xxx

# AI
OPENAI_API_KEY=sk-xxx
```

## Troubleshooting

### Problemas Comuns

1. **Erro de permissão no CLI**
   ```bash
   sudo npm install -g @oryum/nexus
   ```

2. **Módulo não encontrado**
   ```bash
   nexus module:sync
   nexus module:list
   ```

3. **Falha na integração**
   ```bash
   nexus integration:status
   nexus config:check
   ```

4. **Erro de build**
   ```bash
   nexus health
   nexus logs:errors
   ```

### Logs e Debug
```bash
# Habilitar debug
DEBUG=nexus:* nexus <command>

# Logs detalhados
nexus logs --level=debug

# Health check completo
nexus health --detailed
```

## Suporte

- **Documentação**: https://docs.nexus.oryum.tech
- **Issues**: https://github.com/OryumTech/nexus/issues
- **Discord**: https://discord.gg/oryum
- **Email**: nexus@oryum.tech