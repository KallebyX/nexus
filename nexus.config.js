/**
 * Configuração padrão do Oryum Nexus
 * Este arquivo define as configurações básicas para o framework modular
 */

export default {
  // Configurações de projeto
  project: {
    name: 'nexus-project',
    version: '1.0.0',
    type: 'fullstack', // 'frontend', 'backend', 'fullstack', 'microservice'
  },

  // Módulos habilitados
  modules: {
    auth: {
      enabled: true,
      provider: 'supabase', // 'supabase', 'firebase', 'custom'
      socialLogin: ['google', 'github'],
      jwt: true,
      roles: ['admin', 'user']
    },
    database: {
      enabled: true,
      provider: 'supabase', // 'supabase', 'postgresql', 'mongodb'
      migrations: true,
      backups: {
        enabled: true,
        schedule: '0 2 * * *' // Daily at 2 AM
      }
    },
    ui: {
      enabled: true,
      framework: 'react', // 'react', 'vue', 'angular'
      library: 'tailwind', // 'tailwind', 'chakra', 'material-ui'
      storybook: true
    },
    ai: {
      enabled: true,
      provider: 'openai', // 'openai', 'openrouter', 'anthropic'
      features: ['docs', 'tests', 'refactor'],
      model: 'gpt-4'
    },
    payments: {
      enabled: false,
      providers: ['stripe'] // 'stripe', 'mercadopago'
    },
    notifications: {
      enabled: false,
      channels: ['email', 'push'] // 'email', 'push', 'whatsapp'
    },
    monitoring: {
      enabled: true,
      logging: true,
      metrics: true,
      alerts: true
    },
    testing: {
      enabled: true,
      coverage: 80,
      e2e: true,
      visual: false
    }
  },

  // Configurações de ambiente
  environments: {
    development: {
      port: 3000,
      debug: true,
      hotReload: true
    },
    staging: {
      port: 8080,
      debug: false,
      ssl: true
    },
    production: {
      port: 80,
      debug: false,
      ssl: true,
      caching: true
    }
  },

  // Deploy e CI/CD
  deploy: {
    provider: 'vercel', // 'vercel', 'render', 'vps'
    autoDeployment: true,
    branches: {
      main: 'production',
      develop: 'staging'
    }
  },

  // Integrações externas
  integrations: {
    trello: {
      enabled: false,
      boardId: '',
      apiKey: ''
    },
    sentry: {
      enabled: true,
      dsn: ''
    }
  }
};