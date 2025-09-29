# Oryum Nexus - AI Coding Agent Instructions

## Visão Geral do Framework
O Oryum Nexus é um framework modular para reduzir tempo de desenvolvimento em 40%, padronizando arquitetura, UX/UI e operações DevOps. O objetivo é permitir criação de sistemas completos em horas, não semanas.

## Arquitetura Modular - Stack Principal
- **Frontend**: React + Next.js com TypeScript
- **Backend**: Node.js/Express ou Python/Flask para microsserviços
- **Database**: Supabase/PostgreSQL com esquemas padronizados
- **Deploy**: Vercel, Render, VPS com CI/CD GitHub Actions
- **AI Integration**: OpenAI/OpenRouter para automação

## Estrutura de Diretórios do Framework
```
nexus/
├── modules/              # Módulos reutilizáveis
│   ├── auth/            # Autenticação com JWT, OAuth, roles
│   ├── database/        # Modelos, migrações, backups
│   ├── ui/              # Biblioteca de componentes
│   ├── ai/              # Integração IA (docs, testes, refactor)
│   ├── payments/        # Stripe/Mercado Pago
│   ├── notifications/   # Email, push, WhatsApp
│   ├── monitoring/      # Logs, métricas, alertas
│   └── testing/         # Automação de testes
├── templates/           # Templates para novos projetos
├── scripts/             # Automação DevOps e IA
├── docs/               # Documentação auto-gerada
└── .github/            # CI/CD workflows
```

## Padrões de Desenvolvimento

### Modularização
- Cada módulo deve ser **plug & play** com zero configuração
- Interfaces padronizadas entre módulos usando TypeScript
- Configuração via arquivo `.nexus.config.js`

### Convenções de Código
- **Database**: Usar modelos base (User, Log, Metric, Audit)
- **API**: Padrão RESTful com middleware de auth/validation
- **Components**: Atomic Design com Storybook
- **Tests**: Jest/Vitest com coverage mínimo 80%

### Automação com IA
- Scripts geram documentação automaticamente
- Testes são criados via prompt engineering
- Refatoração sugerida por análise de código
- Deploy automatizado com rollback inteligente

## Workflows Críticos

### Inicialização de Projeto
```bash
npx @oryum/nexus create <project-name>
```

### Desenvolvimento Local
```bash
npm run dev:all     # Inicia todos os serviços
npm run test:watch  # Testes em watch mode
npm run ai:docs     # Gera documentação com IA
```

### Deploy
```bash
git push origin main  # Trigger CI/CD automático
npm run deploy:staging
npm run deploy:prod
```

## Integrações Externas

### Trello da Oryum
- Cards sincronizam com status de deploy
- Automação de movimento entre listas
- Logs de progresso em comentários

### Monitoramento SIEM
- Logs centralizados com alertas IA
- Métricas de performance em tempo real
- Backup automatizado de dados críticos

## Segurança por Padrão
- Rate limiting em todas as APIs
- Sanitização automática de inputs
- Logs de auditoria obrigatórios
- JWT com refresh tokens
- HTTPS e CORS configurados

## Comandos de Desenvolvimento

### Módulos
```bash
nexus module:create <name>    # Cria novo módulo
nexus module:install <name>   # Instala módulo existente
nexus module:update          # Atualiza dependências
```

### IA Automation
```bash
nexus ai:refactor <file>     # Refatora código
nexus ai:test <component>    # Gera testes
nexus ai:docs <module>       # Documenta módulo
```

## Roadmap de Versões
- **MVP**: Auth, Database, UI, IA básica, Deploy
- **v1.0**: DevOps completo, Pagamentos, Notificações
- **v2.0**: Marketplace interno de módulos

## Debugging e Troubleshooting
- Use `nexus health:check` para diagnóstico
- Logs em `./logs/` com rotação automática
- Métricas em tempo real no dashboard `/admin`
- Integração com Sentry para error tracking

## Quando Trabalhar neste Projeto
1. **Sempre** use os módulos existentes antes de criar novos
2. **Sempre** execute testes antes de commit
3. **Sempre** use os scripts de automação IA
4. **Consulte** a documentação auto-gerada em `/docs`
5. **Mantenha** compatibilidade com versões anteriores