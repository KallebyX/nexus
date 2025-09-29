/**
 * Sistema de Integrações - Oryum Nexus
 * Conectores para APIs externas, Webhooks, Trello, Slack, etc.
 */

import axios from 'axios';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export class IntegrationsModule extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      trello: {
        enabled: true,
        apiKey: process.env.TRELLO_API_KEY,
        token: process.env.TRELLO_TOKEN,
        boardId: process.env.TRELLO_BOARD_ID,
        lists: {
          backlog: process.env.TRELLO_BACKLOG_LIST,
          development: process.env.TRELLO_DEV_LIST,
          testing: process.env.TRELLO_TEST_LIST,
          deployment: process.env.TRELLO_DEPLOY_LIST,
          done: process.env.TRELLO_DONE_LIST
        }
      },
      slack: {
        enabled: true,
        botToken: process.env.SLACK_BOT_TOKEN,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channels: {
          general: process.env.SLACK_GENERAL_CHANNEL || '#general',
          deployments: process.env.SLACK_DEPLOY_CHANNEL || '#deployments',
          alerts: process.env.SLACK_ALERTS_CHANNEL || '#alerts'
        }
      },
      github: {
        enabled: true,
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        webhookSecret: process.env.GITHUB_WEBHOOK_SECRET
      },
      discord: {
        enabled: false,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        botToken: process.env.DISCORD_BOT_TOKEN
      },
      teams: {
        enabled: false,
        webhookUrl: process.env.TEAMS_WEBHOOK_URL
      },
      jira: {
        enabled: false,
        url: process.env.JIRA_URL,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
        projectKey: process.env.JIRA_PROJECT_KEY
      },
      webhooks: {
        enabled: true,
        secret: process.env.WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex'),
        endpoints: new Map()
      },
      ...config
    };

    this.activeIntegrations = new Map();
    this.webhookHandlers = new Map();
    
    this.initializeIntegrations();
  }

  async initializeIntegrations() {
    console.log('🔗 Inicializando integrações...');

    // Inicializar cada integração habilitada
    if (this.config.trello.enabled) {
      await this.initializeTrello();
    }

    if (this.config.slack.enabled) {
      await this.initializeSlack();
    }

    if (this.config.github.enabled) {
      await this.initializeGitHub();
    }

    // Configurar handlers de webhook padrão
    this.setupDefaultWebhooks();
  }

  /**
   * Integração com Trello
   */
  async initializeTrello() {
    if (!this.config.trello.apiKey || !this.config.trello.token) {
      console.warn('⚠️ Trello: Credenciais não configuradas');
      return;
    }

    const trelloAPI = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: this.config.trello.apiKey,
        token: this.config.trello.token
      }
    });

    this.activeIntegrations.set('trello', {
      name: 'Trello',
      api: trelloAPI,
      methods: {
        createCard: async (listId, cardData) => {
          const response = await trelloAPI.post('/cards', {
            idList: listId,
            name: cardData.name,
            desc: cardData.description,
            due: cardData.dueDate,
            labels: cardData.labels?.join(','),
            members: cardData.members?.join(',')
          });
          return response.data;
        },

        moveCard: async (cardId, listId) => {
          const response = await trelloAPI.put(`/cards/${cardId}`, {
            idList: listId
          });
          return response.data;
        },

        addComment: async (cardId, comment) => {
          const response = await trelloAPI.post(`/cards/${cardId}/actions/comments`, {
            text: comment
          });
          return response.data;
        },

        updateCard: async (cardId, updates) => {
          const response = await trelloAPI.put(`/cards/${cardId}`, updates);
          return response.data;
        },

        getBoard: async () => {
          const response = await trelloAPI.get(`/boards/${this.config.trello.boardId}`, {
            params: { lists: 'open', cards: 'open' }
          });
          return response.data;
        },

        createDeploymentCard: async (deploymentInfo) => {
          return await this.createCard(this.config.trello.lists.deployment, {
            name: `Deploy: ${deploymentInfo.project} v${deploymentInfo.version}`,
            description: `
**Projeto:** ${deploymentInfo.project}
**Versão:** ${deploymentInfo.version}
**Ambiente:** ${deploymentInfo.environment}
**Autor:** ${deploymentInfo.author}
**Data:** ${new Date().toLocaleString('pt-BR')}

**Mudanças:**
${deploymentInfo.changes?.map(c => `- ${c}`).join('\n') || 'Não especificado'}

**Links:**
- [Repository](${deploymentInfo.repoUrl})
- [Deploy](${deploymentInfo.deployUrl})
            `,
            labels: ['deployment', deploymentInfo.environment]
          });
        }
      }
    });

    console.log('✅ Trello integração ativa');
  }

  /**
   * Integração com Slack
   */
  async initializeSlack() {
    if (!this.config.slack.botToken && !this.config.slack.webhookUrl) {
      console.warn('⚠️ Slack: Credenciais não configuradas');
      return;
    }

    const slackMethods = {
      sendMessage: async (channel, message, options = {}) => {
        if (this.config.slack.webhookUrl) {
          return await this.sendSlackWebhook(message, options);
        } else {
          return await this.sendSlackAPI(channel, message, options);
        }
      },

      sendDeploymentNotification: async (deploymentInfo) => {
        const color = deploymentInfo.status === 'success' ? 'good' : 'danger';
        const emoji = deploymentInfo.status === 'success' ? '🚀' : '❌';
        
        const message = {
          text: `${emoji} Deploy ${deploymentInfo.status}`,
          attachments: [{
            color,
            fields: [
              { title: 'Projeto', value: deploymentInfo.project, short: true },
              { title: 'Versão', value: deploymentInfo.version, short: true },
              { title: 'Ambiente', value: deploymentInfo.environment, short: true },
              { title: 'Autor', value: deploymentInfo.author, short: true }
            ],
            footer: 'Nexus Deploy',
            ts: Math.floor(Date.now() / 1000)
          }]
        };

        return await this.sendMessage(this.config.slack.channels.deployments, message);
      },

      sendAlert: async (alertInfo) => {
        const severityEmojis = {
          critical: '🔥',
          high: '⚠️',
          medium: '⚡',
          low: 'ℹ️'
        };

        const colors = {
          critical: 'danger',
          high: 'warning',
          medium: 'warning',
          low: 'good'
        };

        const message = {
          text: `${severityEmojis[alertInfo.severity]} Alerta ${alertInfo.severity.toUpperCase()}`,
          attachments: [{
            color: colors[alertInfo.severity],
            title: alertInfo.title,
            text: alertInfo.description,
            fields: [
              { title: 'Sistema', value: alertInfo.system, short: true },
              { title: 'Severidade', value: alertInfo.severity, short: true }
            ],
            footer: 'Nexus Monitoring',
            ts: Math.floor(Date.now() / 1000)
          }]
        };

        return await this.sendMessage(this.config.slack.channels.alerts, message);
      }
    };

    this.activeIntegrations.set('slack', {
      name: 'Slack',
      methods: slackMethods
    });

    console.log('✅ Slack integração ativa');
  }

  async sendSlackWebhook(message, options = {}) {
    const payload = {
      ...message,
      ...options
    };

    const response = await axios.post(this.config.slack.webhookUrl, payload);
    return response.data;
  }

  async sendSlackAPI(channel, message, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.config.slack.botToken}`,
      'Content-Type': 'application/json'
    };

    const payload = {
      channel,
      ...message,
      ...options
    };

    const response = await axios.post('https://slack.com/api/chat.postMessage', payload, { headers });
    return response.data;
  }

  /**
   * Integração com GitHub
   */
  async initializeGitHub() {
    if (!this.config.github.token) {
      console.warn('⚠️ GitHub: Token não configurado');
      return;
    }

    const githubAPI = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${this.config.github.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const githubMethods = {
      createIssue: async (issueData) => {
        const response = await githubAPI.post(`/repos/${this.config.github.owner}/${this.config.github.repo}/issues`, {
          title: issueData.title,
          body: issueData.body,
          labels: issueData.labels,
          assignees: issueData.assignees
        });
        return response.data;
      },

      createPullRequest: async (prData) => {
        const response = await githubAPI.post(`/repos/${this.config.github.owner}/${this.config.github.repo}/pulls`, {
          title: prData.title,
          body: prData.body,
          head: prData.head,
          base: prData.base || 'main'
        });
        return response.data;
      },

      createRelease: async (releaseData) => {
        const response = await githubAPI.post(`/repos/${this.config.github.owner}/${this.config.github.repo}/releases`, {
          tag_name: releaseData.tagName,
          name: releaseData.name,
          body: releaseData.body,
          draft: releaseData.draft || false,
          prerelease: releaseData.prerelease || false
        });
        return response.data;
      },

      getCommits: async (since) => {
        const response = await githubAPI.get(`/repos/${this.config.github.owner}/${this.config.github.repo}/commits`, {
          params: { since }
        });
        return response.data;
      }
    };

    this.activeIntegrations.set('github', {
      name: 'GitHub',
      api: githubAPI,
      methods: githubMethods
    });

    console.log('✅ GitHub integração ativa');
  }

  /**
   * Sistema de Webhooks
   */
  setupDefaultWebhooks() {
    // Webhook para deploy
    this.addWebhookHandler('deploy', async (payload) => {
      console.log('📨 Webhook deploy recebido:', payload);

      // Notificar Slack
      if (this.hasIntegration('slack')) {
        await this.slack.sendDeploymentNotification(payload);
      }

      // Criar card no Trello
      if (this.hasIntegration('trello')) {
        await this.trello.createDeploymentCard(payload);
      }

      this.emit('deploy', payload);
    });

    // Webhook para alertas
    this.addWebhookHandler('alert', async (payload) => {
      console.log('🚨 Webhook alerta recebido:', payload);

      // Notificar Slack
      if (this.hasIntegration('slack')) {
        await this.slack.sendAlert(payload);
      }

      this.emit('alert', payload);
    });

    // Webhook para GitHub
    this.addWebhookHandler('github', async (payload, headers) => {
      const event = headers['x-github-event'];
      console.log(`📨 GitHub webhook recebido: ${event}`);

      switch (event) {
        case 'push':
          await this.handleGitHubPush(payload);
          break;
        case 'pull_request':
          await this.handleGitHubPullRequest(payload);
          break;
        case 'release':
          await this.handleGitHubRelease(payload);
          break;
      }

      this.emit('github', { event, payload });
    });
  }

  addWebhookHandler(name, handler) {
    this.webhookHandlers.set(name, handler);
    console.log(`📨 Webhook handler adicionado: ${name}`);
  }

  async handleWebhook(name, payload, headers = {}) {
    const handler = this.webhookHandlers.get(name);
    
    if (!handler) {
      throw new Error(`Webhook handler não encontrado: ${name}`);
    }

    // Verificar assinatura se configurada
    if (this.config.webhooks.secret && headers['x-hub-signature-256']) {
      const isValid = this.verifyWebhookSignature(
        JSON.stringify(payload),
        headers['x-hub-signature-256'],
        this.config.webhooks.secret
      );

      if (!isValid) {
        throw new Error('Assinatura do webhook inválida');
      }
    }

    return await handler(payload, headers);
  }

  verifyWebhookSignature(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = 'sha256=' + hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async handleGitHubPush(payload) {
    const { repository, pusher, commits } = payload;
    
    // Notificar sobre commits
    if (this.hasIntegration('slack')) {
      const message = {
        text: `📝 ${commits.length} commit(s) em ${repository.name}`,
        attachments: [{
          color: 'good',
          author_name: pusher.name,
          title: `Branch: ${payload.ref.replace('refs/heads/', '')}`,
          text: commits.map(c => `• ${c.message}`).slice(0, 5).join('\n'),
          footer: 'GitHub',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await this.slack.sendMessage(this.config.slack.channels.general, message);
    }
  }

  async handleGitHubPullRequest(payload) {
    const { action, pull_request } = payload;

    if (action === 'opened') {
      // Notificar sobre novo PR
      if (this.hasIntegration('slack')) {
        const message = {
          text: `🔄 Novo Pull Request`,
          attachments: [{
            color: 'warning',
            title: pull_request.title,
            title_link: pull_request.html_url,
            author_name: pull_request.user.login,
            text: pull_request.body || 'Sem descrição',
            footer: 'GitHub PR',
            ts: Math.floor(Date.now() / 1000)
          }]
        };

        await this.slack.sendMessage(this.config.slack.channels.general, message);
      }
    }
  }

  async handleGitHubRelease(payload) {
    const { action, release } = payload;

    if (action === 'published') {
      // Notificar sobre nova release
      if (this.hasIntegration('slack')) {
        const message = {
          text: `🎉 Nova Release Publicada`,
          attachments: [{
            color: 'good',
            title: `${release.name} (${release.tag_name})`,
            title_link: release.html_url,
            text: release.body || 'Sem notas de release',
            footer: 'GitHub Release',
            ts: Math.floor(Date.now() / 1000)
          }]
        };

        await this.slack.sendMessage(this.config.slack.channels.general, message);
      }
    }
  }

  /**
   * Métodos de conveniência para acessar integrações
   */
  get trello() {
    return this.activeIntegrations.get('trello')?.methods;
  }

  get slack() {
    return this.activeIntegrations.get('slack')?.methods;
  }

  get github() {
    return this.activeIntegrations.get('github')?.methods;
  }

  hasIntegration(name) {
    return this.activeIntegrations.has(name);
  }

  /**
   * Middleware para Express
   */
  webhookMiddleware() {
    return async (req, res, next) => {
      if (req.path.startsWith('/webhooks/')) {
        const webhookName = req.path.replace('/webhooks/', '');
        
        try {
          const result = await this.handleWebhook(webhookName, req.body, req.headers);
          res.json({ success: true, result });
        } catch (error) {
          console.error(`Erro no webhook ${webhookName}:`, error);
          res.status(400).json({ success: false, error: error.message });
        }
        return;
      }
      
      next();
    };
  }

  /**
   * Sincronizar projeto com Trello
   */
  async syncProjectWithTrello(projectData) {
    if (!this.hasIntegration('trello')) {
      throw new Error('Integração Trello não ativa');
    }

    const { features, bugs, tasks } = projectData;
    const results = [];

    // Criar cards para features
    for (const feature of features || []) {
      const card = await this.trello.createCard(this.config.trello.lists.backlog, {
        name: `[FEATURE] ${feature.title}`,
        description: feature.description,
        labels: ['feature']
      });
      results.push({ type: 'feature', card });
    }

    // Criar cards para bugs
    for (const bug of bugs || []) {
      const card = await this.trello.createCard(this.config.trello.lists.backlog, {
        name: `[BUG] ${bug.title}`,
        description: bug.description,
        labels: ['bug']
      });
      results.push({ type: 'bug', card });
    }

    return results;
  }

  /**
   * Relatório de integrações
   */
  async getIntegrationsReport() {
    const report = {
      timestamp: new Date(),
      integrations: {},
      webhooks: Array.from(this.webhookHandlers.keys()),
      events: {
        processed: this.listenerCount('deploy') + this.listenerCount('alert') + this.listenerCount('github'),
        handlers: this.eventNames()
      }
    };

    // Status de cada integração
    for (const [name, integration] of this.activeIntegrations) {
      try {
        let status = 'active';
        let lastTest = null;

        // Teste básico de conectividade
        switch (name) {
          case 'trello':
            try {
              await integration.api.get('/members/me');
              lastTest = 'success';
            } catch (error) {
              status = 'error';
              lastTest = error.message;
            }
            break;

          case 'github':
            try {
              await integration.api.get('/user');
              lastTest = 'success';
            } catch (error) {
              status = 'error';
              lastTest = error.message;
            }
            break;

          case 'slack':
            // Slack webhook/API test seria implementado aqui
            lastTest = 'not_tested';
            break;
        }

        report.integrations[name] = {
          status,
          lastTest,
          methods: Object.keys(integration.methods || {})
        };
      } catch (error) {
        report.integrations[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    return report;
  }

  /**
   * Health check do módulo
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      integrations: this.activeIntegrations.size,
      webhooks: this.webhookHandlers.size,
      active: []
    };

    for (const name of this.activeIntegrations.keys()) {
      health.active.push(name);
    }

    return health;
  }
}

export default IntegrationsModule;