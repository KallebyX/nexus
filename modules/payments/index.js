/**
 * Módulo de Pagamentos - Oryum Nexus
 * Sistema completo de pagamentos com Stripe, Mercado Pago e PIX
 */

import Stripe from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

export class PaymentsModule {
  constructor(config = {}) {
    this.config = {
      stripe: {
        enabled: true,
        publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      },
      mercadoPago: {
        enabled: true,
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        publicKey: process.env.MERCADOPAGO_PUBLIC_KEY
      },
      pix: {
        enabled: true,
        recipientKey: process.env.PIX_KEY,
        recipientName: process.env.PIX_RECIPIENT_NAME
      },
      ...config
    };

    this.initializeProviders();
  }

  initializeProviders() {
    // Inicializar Stripe
    if (this.config.stripe.enabled && this.config.stripe.secretKey) {
      this.stripe = new Stripe(this.config.stripe.secretKey, {
        apiVersion: '2023-10-16'
      });
    }

    // Inicializar Mercado Pago
    if (this.config.mercadoPago.enabled && this.config.mercadoPago.accessToken) {
      this.mercadoPago = new MercadoPagoConfig({
        accessToken: this.config.mercadoPago.accessToken
      });
      this.mpPayment = new Payment(this.mercadoPago);
    }
  }

  /**
   * Criar pagamento Stripe
   */
  async createStripePayment(paymentData) {
    try {
      const {
        amount,
        currency = 'usd',
        customer,
        description,
        metadata = {},
        paymentMethod
      } = paymentData;

      // Criar PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converter para centavos
        currency,
        customer: customer?.stripeId,
        description,
        metadata,
        payment_method: paymentMethod,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.APP_URL}/payments/success`
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: amount,
        currency,
        provider: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Criar assinatura recorrente Stripe
   */
  async createStripeSubscription(subscriptionData) {
    try {
      const {
        customer,
        priceId,
        trialDays = 0,
        metadata = {}
      } = subscriptionData;

      const subscription = await this.stripe.subscriptions.create({
        customer: customer.stripeId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        metadata,
        expand: ['latest_invoice.payment_intent']
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        provider: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Criar pagamento Mercado Pago
   */
  async createMercadoPagoPayment(paymentData) {
    try {
      const {
        amount,
        description,
        payerEmail,
        paymentMethodId = 'pix',
        installments = 1
      } = paymentData;

      const payment = await this.mpPayment.create({
        body: {
          transaction_amount: amount,
          description,
          payment_method_id: paymentMethodId,
          installments,
          payer: {
            email: payerEmail
          }
        }
      });

      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
        amount,
        qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        provider: 'mercadopago'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar PIX manual
   */
  generatePixPayment(paymentData) {
    const {
      amount,
      description,
      orderId
    } = paymentData;

    // Gerar código PIX manual (EMV)
    const pixCode = this.generatePixEMVCode({
      key: this.config.pix.recipientKey,
      name: this.config.pix.recipientName,
      amount,
      description,
      transactionId: orderId
    });

    return {
      success: true,
      pixCode,
      qrCode: pixCode, // Mesmo código para QR
      amount,
      recipient: this.config.pix.recipientName,
      description,
      provider: 'pix'
    };
  }

  /**
   * Gerar código EMV para PIX
   */
  generatePixEMVCode(data) {
    const { key, name, amount, description, transactionId } = data;
    
    // Estrutura básica do EMV Code para PIX
    let emv = '';
    
    // Payload Format Indicator
    emv += '000201';
    
    // Merchant Account Information
    emv += '26' + this.formatEMVLength(key.length + 22) + '0014br.gov.bcb.pix01' + this.formatEMVLength(key.length) + key;
    
    // Merchant Category Code
    emv += '52040000';
    
    // Transaction Currency (BRL)
    emv += '5303986';
    
    // Transaction Amount
    if (amount) {
      const amountStr = amount.toFixed(2);
      emv += '54' + this.formatEMVLength(amountStr.length) + amountStr;
    }
    
    // Country Code
    emv += '5802BR';
    
    // Merchant Name
    emv += '59' + this.formatEMVLength(name.length) + name;
    
    // Additional Data Field
    if (description || transactionId) {
      let additionalData = '';
      if (transactionId) {
        additionalData += '05' + this.formatEMVLength(transactionId.length) + transactionId;
      }
      emv += '62' + this.formatEMVLength(additionalData.length) + additionalData;
    }
    
    // CRC16
    emv += '6304';
    const crc = this.calculateCRC16(emv);
    emv += crc.toString(16).toUpperCase().padStart(4, '0');
    
    return emv;
  }

  formatEMVLength(length) {
    return length.toString().padStart(2, '0');
  }

  calculateCRC16(str) {
    // Implementação simplificada do CRC16-CCITT
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
      }
    }
    return crc & 0xFFFF;
  }

  /**
   * Webhook handler para Stripe
   */
  async handleStripeWebhook(rawBody, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.stripe.webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSuccess(event.data.object, 'stripe');
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object, 'stripe');
        
        case 'invoice.payment_succeeded':
          return await this.handleSubscriptionPayment(event.data.object, 'stripe');
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionCanceled(event.data.object, 'stripe');
        
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }

  /**
   * Webhook handler para Mercado Pago
   */
  async handleMercadoPagoWebhook(body) {
    try {
      const { type, action, data } = body;
      
      if (type === 'payment') {
        const payment = await this.mpPayment.get({ id: data.id });
        
        switch (payment.status) {
          case 'approved':
            return await this.handlePaymentSuccess(payment, 'mercadopago');
          
          case 'rejected':
            return await this.handlePaymentFailed(payment, 'mercadopago');
          
          default:
            console.log(`Unhandled MercadoPago status: ${payment.status}`);
        }
      }

      return { received: true };
    } catch (error) {
      console.error('MercadoPago webhook error:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento aprovado
   */
  async handlePaymentSuccess(paymentData, provider) {
    const paymentInfo = {
      id: paymentData.id,
      amount: provider === 'stripe' ? paymentData.amount / 100 : paymentData.transaction_amount,
      currency: paymentData.currency || 'BRL',
      status: 'success',
      provider,
      metadata: paymentData.metadata || {},
      timestamp: new Date()
    };

    // Aqui você integraria com seu sistema de pedidos
    console.log('Payment successful:', paymentInfo);
    
    // Enviar notificação
    await this.sendPaymentNotification(paymentInfo, 'success');
    
    return paymentInfo;
  }

  /**
   * Processar pagamento falhado
   */
  async handlePaymentFailed(paymentData, provider) {
    const paymentInfo = {
      id: paymentData.id,
      amount: provider === 'stripe' ? paymentData.amount / 100 : paymentData.transaction_amount,
      status: 'failed',
      provider,
      error: paymentData.last_payment_error?.message || 'Payment failed',
      timestamp: new Date()
    };

    console.log('Payment failed:', paymentInfo);
    
    // Enviar notificação
    await this.sendPaymentNotification(paymentInfo, 'failed');
    
    return paymentInfo;
  }

  /**
   * Processar pagamento de assinatura
   */
  async handleSubscriptionPayment(invoiceData, provider) {
    const subscriptionInfo = {
      subscriptionId: invoiceData.subscription,
      amount: invoiceData.amount_paid / 100,
      period: {
        start: new Date(invoiceData.period_start * 1000),
        end: new Date(invoiceData.period_end * 1000)
      },
      status: 'active',
      provider
    };

    console.log('Subscription payment successful:', subscriptionInfo);
    
    return subscriptionInfo;
  }

  /**
   * Processar cancelamento de assinatura
   */
  async handleSubscriptionCanceled(subscriptionData, provider) {
    const subscriptionInfo = {
      subscriptionId: subscriptionData.id,
      status: 'canceled',
      canceledAt: new Date(subscriptionData.canceled_at * 1000),
      provider
    };

    console.log('Subscription canceled:', subscriptionInfo);
    
    return subscriptionInfo;
  }

  /**
   * Enviar notificação de pagamento
   */
  async sendPaymentNotification(paymentInfo, type) {
    // Integração com módulo de notificações
    // Por enquanto apenas log
    console.log(`Payment notification [${type}]:`, paymentInfo);
  }

  /**
   * Criar cliente Stripe
   */
  async createStripeCustomer(customerData) {
    try {
      const { email, name, phone, address } = customerData;
      
      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        address,
        metadata: customerData.metadata || {}
      });

      return {
        success: true,
        stripeId: customer.id,
        customer
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Listar métodos de pagamento
   */
  getPaymentMethods() {
    const methods = [];

    if (this.config.stripe.enabled) {
      methods.push({
        provider: 'stripe',
        methods: ['card', 'ideal', 'sepa_debit', 'sofort', 'bancontact']
      });
    }

    if (this.config.mercadoPago.enabled) {
      methods.push({
        provider: 'mercadopago',
        methods: ['pix', 'credit_card', 'debit_card', 'ticket']
      });
    }

    if (this.config.pix.enabled) {
      methods.push({
        provider: 'pix',
        methods: ['pix']
      });
    }

    return methods;
  }

  /**
   * Middleware para Express
   */
  middleware() {
    return {
      // Middleware para webhook Stripe
      stripeWebhook: (req, res, next) => {
        if (req.path === '/webhooks/stripe') {
          req.rawBody = '';
          req.on('data', chunk => {
            req.rawBody += chunk;
          });
          req.on('end', () => {
            next();
          });
        } else {
          next();
        }
      },

      // Handler de webhook
      handleWebhook: async (req, res) => {
        try {
          if (req.path === '/webhooks/stripe') {
            const signature = req.headers['stripe-signature'];
            await this.handleStripeWebhook(req.rawBody, signature);
          } else if (req.path === '/webhooks/mercadopago') {
            await this.handleMercadoPagoWebhook(req.body);
          }
          
          res.status(200).json({ received: true });
        } catch (error) {
          console.error('Webhook error:', error);
          res.status(400).json({ error: error.message });
        }
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

    // Verificar Stripe
    if (this.config.stripe.enabled) {
      try {
        await this.stripe.balance.retrieve();
        health.providers.stripe = { status: 'connected' };
      } catch (error) {
        health.providers.stripe = { status: 'error', error: error.message };
        health.status = 'unhealthy';
      }
    }

    // Verificar Mercado Pago
    if (this.config.mercadoPago.enabled) {
      health.providers.mercadopago = { status: 'configured' };
    }

    // Verificar PIX
    if (this.config.pix.enabled) {
      health.providers.pix = { status: 'configured' };
    }

    return health;
  }
}

export default PaymentsModule;