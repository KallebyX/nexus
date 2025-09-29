/**
 * Módulo de Notificações - Oryum Nexus
 * Sistema completo de notificações: Email, SMS, WhatsApp, Push, Slack
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { WebClient } from '@slack/web-api';
import webpush from 'web-push';
import axios from 'axios';

export class NotificationsModule {
  constructor(config = {}) {
    this.config = {
      email: {
        enabled: true,
        provider: 'smtp', // smtp, sendgrid, ses
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: process.env.EMAIL_FROM || 'noreply@oryum.tech'
      },
      sms: {
        enabled: true,
        provider: 'twilio', // twilio, aws-sns
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          from: process.env.TWILIO_FROM_NUMBER
        }
      },
      whatsapp: {
        enabled: true,
        provider: 'twilio', // twilio, whatsapp-business
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          from: process.env.TWILIO_WHATSAPP_FROM
        }
      },
      push: {
        enabled: true,
        vapid: {
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY,
          subject: process.env.VAPID_SUBJECT || 'mailto:admin@oryum.tech'
        }
      },
      slack: {
        enabled: true,
        token: process.env.SLACK_BOT_TOKEN,
        channels: {
          general: process.env.SLACK_GENERAL_CHANNEL,
          alerts: process.env.SLACK_ALERTS_CHANNEL,
          deployments: process.env.SLACK_DEPLOYMENTS_CHANNEL
        }
      },
      discord: {
        enabled: false,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL
      },
      ...config
    };

    this.initializeProviders();
    this.templates = new Map();
    this.queue = [];
    this.setupTemplates();
  }

  initializeProviders() {
    // Email transporter
    if (this.config.email.enabled) {
      this.emailTransporter = nodemailer.createTransporter(this.config.email.smtp);
    }

    // Twilio client
    if (this.config.sms.enabled || this.config.whatsapp.enabled) {
      this.twilioClient = twilio(
        this.config.sms.twilio.accountSid,
        this.config.sms.twilio.authToken
      );
    }

    // Slack client
    if (this.config.slack.enabled) {
      this.slackClient = new WebClient(this.config.slack.token);
    }

    // Web Push
    if (this.config.push.enabled) {
      webpush.setVapidDetails(
        this.config.push.vapid.subject,
        this.config.push.vapid.publicKey,
        this.config.push.vapid.privateKey
      );
    }
  }

  setupTemplates() {
    // Templates de email
    this.addTemplate('welcome', 'email', {
      subject: 'Bem-vindo ao {{appName}}!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bem-vindo, {{userName}}!</h1>
          <p>Obrigado por se cadastrar no {{appName}}.</p>
          <p>Sua conta foi criada com sucesso.</p>
          <a href="{{loginUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Acessar Plataforma
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Se você não se cadastrou, ignore este email.
          </p>
        </div>
      `
    });

    this.addTemplate('password-reset', 'email', {
      subject: 'Redefinir sua senha - {{appName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Redefinir Senha</h1>
          <p>Olá, {{userName}}!</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Redefinir Senha
          </a>
          <p style="margin-top: 20px; color: #666;">
            Este link expira em 1 hora.
          </p>
          <p style="color: #666; font-size: 12px;">
            Se você não solicitou, ignore este email.
          </p>
        </div>
      `
    });

    this.addTemplate('order-confirmation', 'email', {
      subject: 'Pedido Confirmado #{{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">Pedido Confirmado!</h1>
          <p>Olá, {{customerName}}!</p>
          <p>Seu pedido <strong>#{{orderNumber}}</strong> foi confirmado.</p>
          <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Detalhes do Pedido:</h3>
            <p><strong>Total:</strong> {{orderTotal}}</p>
            <p><strong>Itens:</strong> {{itemCount}}</p>
            <p><strong>Entrega:</strong> {{deliveryDate}}</p>
          </div>
          <a href="{{trackingUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Acompanhar Pedido
          </a>
        </div>
      `
    });

    // Templates de SMS
    this.addTemplate('verification-code', 'sms', {
      text: 'Seu código de verificação é: {{code}}. Não compartilhe este código.'
    });

    this.addTemplate('order-shipped', 'sms', {
      text: 'Seu pedido #{{orderNumber}} foi enviado! Código de rastreamento: {{trackingCode}}'
    });

    // Templates de WhatsApp
    this.addTemplate('payment-received', 'whatsapp', {
      text: '✅ Pagamento recebido! Seu pedido #{{orderNumber}} está sendo processado. Total: {{amount}}'
    });

    // Templates de Slack
    this.addTemplate('deployment-success', 'slack', {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':rocket: *Deploy realizado com sucesso!*\n*Projeto:* {{project}}\n*Ambiente:* {{environment}}\n*Versão:* {{version}}'
          }
        }
      ]
    });

    this.addTemplate('alert-critical', 'slack', {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':rotating_light: *ALERTA CRÍTICO*\n*Sistema:* {{system}}\n*Erro:* {{error}}\n*Severidade:* {{severity}}'
          }
        }
      ]
    });
  }

  /**
   * Adicionar template de notificação
   */
  addTemplate(name, type, template) {
    this.templates.set(`${type}:${name}`, template);
  }

  /**
   * Renderizar template com dados
   */
  renderTemplate(templateKey, data) {
    const template = this.templates.get(templateKey);
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const rendered = { ...template };

    // Renderizar todas as propriedades do template
    Object.keys(rendered).forEach(key => {
      if (typeof rendered[key] === 'string') {
        rendered[key] = this.interpolateString(rendered[key], data);
      } else if (Array.isArray(rendered[key])) {
        rendered[key] = this.interpolateArray(rendered[key], data);
      }
    });

    return rendered;
  }

  /**
   * Interpolação de strings
   */
  interpolateString(str, data) {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Interpolação de arrays (para Slack blocks)
   */
  interpolateArray(arr, data) {
    return JSON.parse(this.interpolateString(JSON.stringify(arr), data));
  }

  /**
   * Enviar email
   */
  async sendEmail(emailData) {
    if (!this.config.email.enabled) {
      throw new Error('Email provider not configured');
    }

    try {
      const {
        to,
        subject,
        html,
        text,
        attachments,
        template,
        templateData
      } = emailData;

      let finalSubject = subject;
      let finalHtml = html;
      let finalText = text;

      // Usar template se especificado
      if (template) {
        const rendered = this.renderTemplate(`email:${template}`, templateData || {});
        finalSubject = rendered.subject;
        finalHtml = rendered.html;
        finalText = rendered.text;
      }

      const mailOptions = {
        from: this.config.email.from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
        attachments
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        provider: 'email'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'email'
      };
    }
  }

  /**
   * Enviar SMS
   */
  async sendSMS(smsData) {
    if (!this.config.sms.enabled) {
      throw new Error('SMS provider not configured');
    }

    try {
      const {
        to,
        message,
        template,
        templateData
      } = smsData;

      let finalMessage = message;

      // Usar template se especificado
      if (template) {
        const rendered = this.renderTemplate(`sms:${template}`, templateData || {});
        finalMessage = rendered.text;
      }

      const result = await this.twilioClient.messages.create({
        body: finalMessage,
        from: this.config.sms.twilio.from,
        to
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'sms'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'sms'
      };
    }
  }

  /**
   * Enviar WhatsApp
   */
  async sendWhatsApp(whatsappData) {
    if (!this.config.whatsapp.enabled) {
      throw new Error('WhatsApp provider not configured');
    }

    try {
      const {
        to,
        message,
        template,
        templateData
      } = whatsappData;

      let finalMessage = message;

      // Usar template se especificado
      if (template) {
        const rendered = this.renderTemplate(`whatsapp:${template}`, templateData || {});
        finalMessage = rendered.text;
      }

      const result = await this.twilioClient.messages.create({
        body: finalMessage,
        from: this.config.whatsapp.twilio.from,
        to: `whatsapp:${to}`
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'whatsapp'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'whatsapp'
      };
    }
  }

  /**
   * Enviar Push Notification
   */
  async sendPushNotification(pushData) {
    if (!this.config.push.enabled) {
      throw new Error('Push notifications not configured');
    }

    try {
      const {
        subscription,
        title,
        body,
        icon,
        badge,
        data,
        actions
      } = pushData;

      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icons/icon-192x192.png',
        badge: badge || '/icons/badge-72x72.png',
        data,
        actions
      });

      await webpush.sendNotification(subscription, payload);

      return {
        success: true,
        provider: 'push'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'push'
      };
    }
  }

  /**
   * Enviar mensagem Slack
   */
  async sendSlack(slackData) {
    if (!this.config.slack.enabled) {
      throw new Error('Slack not configured');
    }

    try {
      const {
        channel,
        text,
        blocks,
        template,
        templateData
      } = slackData;

      let finalText = text;
      let finalBlocks = blocks;

      // Usar template se especificado
      if (template) {
        const rendered = this.renderTemplate(`slack:${template}`, templateData || {});
        finalText = rendered.text;
        finalBlocks = rendered.blocks;
      }

      const result = await this.slackClient.chat.postMessage({
        channel: channel || this.config.slack.channels.general,
        text: finalText,
        blocks: finalBlocks
      });

      return {
        success: true,
        messageId: result.ts,
        provider: 'slack'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'slack'
      };
    }
  }

  /**
   * Enviar mensagem Discord
   */
  async sendDiscord(discordData) {
    if (!this.config.discord.enabled) {
      throw new Error('Discord not configured');
    }

    try {
      const {
        content,
        embeds,
        username,
        avatar_url
      } = discordData;

      const result = await axios.post(this.config.discord.webhookUrl, {
        content,
        embeds,
        username: username || 'Nexus Bot',
        avatar_url
      });

      return {
        success: true,
        provider: 'discord'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'discord'
      };
    }
  }

  /**
   * Enviar notificação para múltiplos canais
   */
  async sendMultiChannel(notificationData) {
    const {
      channels = ['email'],
      recipients,
      message,
      template,
      templateData
    } = notificationData;

    const results = [];

    for (const channel of channels) {
      try {
        let result;

        switch (channel) {
          case 'email':
            result = await this.sendEmail({
              to: recipients.email,
              template,
              templateData
            });
            break;

          case 'sms':
            result = await this.sendSMS({
              to: recipients.phone,
              template,
              templateData
            });
            break;

          case 'whatsapp':
            result = await this.sendWhatsApp({
              to: recipients.whatsapp,
              template,
              templateData
            });
            break;

          case 'slack':
            result = await this.sendSlack({
              channel: recipients.slackChannel,
              template,
              templateData
            });
            break;

          case 'push':
            if (recipients.pushSubscriptions) {
              for (const subscription of recipients.pushSubscriptions) {
                result = await this.sendPushNotification({
                  subscription,
                  title: templateData?.title || 'Notificação',
                  body: message
                });
              }
            }
            break;
        }

        results.push({
          channel,
          ...result
        });
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: results.some(r => r.success),
      results
    };
  }

  /**
   * Adicionar notificação à fila
   */
  async queueNotification(notificationData, delay = 0) {
    const notification = {
      id: crypto.randomUUID(),
      ...notificationData,
      scheduledFor: new Date(Date.now() + delay),
      status: 'queued'
    };

    this.queue.push(notification);

    // Processar fila se não há delay
    if (delay === 0) {
      setImmediate(() => this.processQueue());
    }

    return notification.id;
  }

  /**
   * Processar fila de notificações
   */
  async processQueue() {
    const now = new Date();
    const readyNotifications = this.queue.filter(n => 
      n.status === 'queued' && n.scheduledFor <= now
    );

    for (const notification of readyNotifications) {
      try {
        notification.status = 'processing';
        
        await this.sendMultiChannel(notification);
        
        notification.status = 'sent';
        notification.sentAt = new Date();
      } catch (error) {
        notification.status = 'failed';
        notification.error = error.message;
        console.error('Failed to send notification:', error);
      }
    }

    // Remover notificações processadas
    this.queue = this.queue.filter(n => n.status === 'queued');
  }

  /**
   * Configurar processamento automático da fila
   */
  startQueueProcessor(intervalMs = 30000) {
    setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  /**
   * Middleware para Express
   */
  middleware() {
    return {
      // Middleware para capturar eventos do sistema
      trackEvents: (req, res, next) => {
        // Interceptar respostas para enviar notificações automáticas
        const originalSend = res.send;
        res.send = function(data) {
          // Aqui você pode adicionar lógica para notificações automáticas
          // baseadas no status da resposta
          return originalSend.call(this, data);
        };
        next();
      }
    };
  }

  /**
   * Health check do módulo
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      providers: {}
    };

    // Verificar email
    if (this.config.email.enabled) {
      try {
        await this.emailTransporter.verify();
        health.providers.email = { status: 'connected' };
      } catch (error) {
        health.providers.email = { status: 'error', error: error.message };
        health.status = 'unhealthy';
      }
    }

    // Verificar Slack
    if (this.config.slack.enabled) {
      try {
        await this.slackClient.auth.test();
        health.providers.slack = { status: 'connected' };
      } catch (error) {
        health.providers.slack = { status: 'error', error: error.message };
        health.status = 'unhealthy';
      }
    }

    // Outros providers são verificados por configuração
    ['sms', 'whatsapp', 'push', 'discord'].forEach(provider => {
      if (this.config[provider].enabled) {
        health.providers[provider] = { status: 'configured' };
      }
    });

    health.queueSize = this.queue.length;

    return health;
  }
}

export default NotificationsModule;