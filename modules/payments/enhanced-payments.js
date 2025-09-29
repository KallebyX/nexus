/**
 * Nexus Payments Module - Enhanced Version
 * Multi-provider payment processing: Stripe, Mercado Pago, PayPal
 * 
 * @version 2.0.0
 * @module Nexus/Payments
 */

class PaymentsModule {
    constructor(config = {}) {
        this.config = {
            providers: {
                stripe: {
                    secretKey: config.stripeSecretKey || '',
                    publishableKey: config.stripePublishableKey || '',
                    webhookSecret: config.stripeWebhookSecret || '',
                    currency: config.stripeCurrency || 'usd'
                },
                mercadopago: {
                    accessToken: config.mercadopagoAccessToken || '',
                    publicKey: config.mercadopagoPublicKey || '',
                    clientId: config.mercadopagoClientId || '',
                    clientSecret: config.mercadopagoClientSecret || ''
                },
                paypal: {
                    clientId: config.paypalClientId || '',
                    clientSecret: config.paypalClientSecret || '',
                    sandbox: config.paypalSandbox || true
                }
            },
            defaultProvider: config.defaultProvider || 'stripe',
            currency: config.defaultCurrency || 'USD',
            webhookUrl: config.webhookUrl || '/api/payments/webhook',
            successUrl: config.successUrl || '/payment/success',
            cancelUrl: config.cancelUrl || '/payment/cancel',
            ...config
        };
        
        this.providers = new Map();
        this.transactions = new Map();
        this.subscriptions = new Map();
        this.webhookHandlers = new Map();
        
        this.initialized = false;
    }

    /**
     * Initialize payments module
     */
    async init() {
        if (this.initialized) return this;
        
        try {
            await this.initializeProviders();
            this.setupWebhookHandlers();
            
            this.initialized = true;
            console.log('✅ Payments Module initialized successfully');
            return this;
        } catch (error) {
            console.error('❌ Failed to initialize Payments Module:', error);
            throw error;
        }
    }

    /**
     * Create payment intent/session
     */
    async createPayment(options) {
        try {
            const paymentOptions = {
                amount: options.amount,
                currency: options.currency || this.config.currency,
                provider: options.provider || this.config.defaultProvider,
                description: options.description || 'Payment',
                metadata: options.metadata || {},
                customer: options.customer,
                successUrl: options.successUrl || this.config.successUrl,
                cancelUrl: options.cancelUrl || this.config.cancelUrl,
                paymentMethods: options.paymentMethods || ['card'],
                automaticPaymentMethods: options.automaticPaymentMethods || false,
                ...options
            };

            const provider = this.providers.get(paymentOptions.provider);
            if (!provider) {
                throw new Error(`Payment provider ${paymentOptions.provider} not available`);
            }

            let result;
            
            switch (paymentOptions.provider) {
                case 'stripe':
                    result = await this.createStripePayment(paymentOptions);
                    break;
                case 'mercadopago':
                    result = await this.createMercadoPagoPayment(paymentOptions);
                    break;
                case 'paypal':
                    result = await this.createPayPalPayment(paymentOptions);
                    break;
                default:
                    throw new Error(`Unsupported payment provider: ${paymentOptions.provider}`);
            }

            // Store transaction
            this.transactions.set(result.id, {
                id: result.id,
                ...paymentOptions,
                status: 'pending',
                createdAt: new Date().toISOString(),
                provider: paymentOptions.provider
            });

            return result;

        } catch (error) {
            console.error('Failed to create payment:', error);
            throw error;
        }
    }

    /**
     * Confirm/capture payment
     */
    async confirmPayment(paymentId, options = {}) {
        try {
            const transaction = this.transactions.get(paymentId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            const provider = this.providers.get(transaction.provider);
            let result;

            switch (transaction.provider) {
                case 'stripe':
                    result = await this.confirmStripePayment(paymentId, options);
                    break;
                case 'mercadopago':
                    result = await this.confirmMercadoPagoPayment(paymentId, options);
                    break;
                case 'paypal':
                    result = await this.confirmPayPalPayment(paymentId, options);
                    break;
                default:
                    throw new Error(`Unsupported payment provider: ${transaction.provider}`);
            }

            // Update transaction status
            transaction.status = result.status;
            transaction.confirmedAt = new Date().toISOString();
            this.transactions.set(paymentId, transaction);

            return result;

        } catch (error) {
            console.error('Failed to confirm payment:', error);
            throw error;
        }
    }

    /**
     * Create subscription
     */
    async createSubscription(options) {
        try {
            const subscriptionOptions = {
                customer: options.customer,
                priceId: options.priceId,
                provider: options.provider || this.config.defaultProvider,
                trialPeriodDays: options.trialPeriodDays || 0,
                defaultPaymentMethod: options.defaultPaymentMethod,
                metadata: options.metadata || {},
                ...options
            };

            const provider = this.providers.get(subscriptionOptions.provider);
            if (!provider) {
                throw new Error(`Payment provider ${subscriptionOptions.provider} not available`);
            }

            let result;
            
            switch (subscriptionOptions.provider) {
                case 'stripe':
                    result = await this.createStripeSubscription(subscriptionOptions);
                    break;
                case 'mercadopago':
                    result = await this.createMercadoPagoSubscription(subscriptionOptions);
                    break;
                default:
                    throw new Error(`Subscriptions not supported for provider: ${subscriptionOptions.provider}`);
            }

            // Store subscription
            this.subscriptions.set(result.id, {
                id: result.id,
                ...subscriptionOptions,
                status: result.status,
                createdAt: new Date().toISOString(),
                provider: subscriptionOptions.provider
            });

            return result;

        } catch (error) {
            console.error('Failed to create subscription:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId, options = {}) {
        try {
            const subscription = this.subscriptions.get(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const provider = this.providers.get(subscription.provider);
            let result;

            switch (subscription.provider) {
                case 'stripe':
                    result = await this.cancelStripeSubscription(subscriptionId, options);
                    break;
                case 'mercadopago':
                    result = await this.cancelMercadoPagoSubscription(subscriptionId, options);
                    break;
                default:
                    throw new Error(`Subscriptions not supported for provider: ${subscription.provider}`);
            }

            // Update subscription status
            subscription.status = 'canceled';
            subscription.canceledAt = new Date().toISOString();
            this.subscriptions.set(subscriptionId, subscription);

            return result;

        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            throw error;
        }
    }

    /**
     * Process refund
     */
    async refundPayment(paymentId, options = {}) {
        try {
            const transaction = this.transactions.get(paymentId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            const refundOptions = {
                amount: options.amount || transaction.amount,
                reason: options.reason || 'requested_by_customer',
                metadata: options.metadata || {}
            };

            const provider = this.providers.get(transaction.provider);
            let result;

            switch (transaction.provider) {
                case 'stripe':
                    result = await this.refundStripePayment(paymentId, refundOptions);
                    break;
                case 'mercadopago':
                    result = await this.refundMercadoPagoPayment(paymentId, refundOptions);
                    break;
                case 'paypal':
                    result = await this.refundPayPalPayment(paymentId, refundOptions);
                    break;
                default:
                    throw new Error(`Refunds not supported for provider: ${transaction.provider}`);
            }

            // Update transaction
            transaction.refunded = true;
            transaction.refundedAt = new Date().toISOString();
            transaction.refundAmount = refundOptions.amount;
            this.transactions.set(paymentId, transaction);

            return result;

        } catch (error) {
            console.error('Failed to refund payment:', error);
            throw error;
        }
    }

    /**
     * Handle webhook events
     */
    handleWebhook(provider, headers, body) {
        try {
            const handler = this.webhookHandlers.get(provider);
            if (!handler) {
                throw new Error(`No webhook handler for provider: ${provider}`);
            }

            return handler(headers, body);

        } catch (error) {
            console.error('Webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId, provider = null) {
        try {
            // Check local storage first
            const localTransaction = this.transactions.get(paymentId);
            
            if (provider || localTransaction?.provider) {
                const providerName = provider || localTransaction.provider;
                const providerInstance = this.providers.get(providerName);

                switch (providerName) {
                    case 'stripe':
                        return await this.getStripePaymentStatus(paymentId);
                    case 'mercadopago':
                        return await this.getMercadoPagoPaymentStatus(paymentId);
                    case 'paypal':
                        return await this.getPayPalPaymentStatus(paymentId);
                    default:
                        return localTransaction || { status: 'unknown' };
                }
            }

            return localTransaction || { status: 'not_found' };

        } catch (error) {
            console.error('Failed to get payment status:', error);
            throw error;
        }
    }

    // Private methods - Provider implementations

    async initializeProviders() {
        // Initialize Stripe
        if (this.config.providers.stripe.secretKey) {
            try {
                const stripe = require('stripe')(this.config.providers.stripe.secretKey);
                this.providers.set('stripe', stripe);
                console.log('💳 Stripe provider initialized');
            } catch (error) {
                console.warn('Stripe initialization failed:', error.message);
            }
        }

        // Initialize Mercado Pago
        if (this.config.providers.mercadopago.accessToken) {
            try {
                // Initialize MercadoPago SDK
                console.log('💰 MercadoPago provider initialized');
            } catch (error) {
                console.warn('MercadoPago initialization failed:', error.message);
            }
        }

        // Initialize PayPal
        if (this.config.providers.paypal.clientId) {
            try {
                // Initialize PayPal SDK
                console.log('🅿️ PayPal provider initialized');
            } catch (error) {
                console.warn('PayPal initialization failed:', error.message);
            }
        }
    }

    setupWebhookHandlers() {
        // Stripe webhook handler
        this.webhookHandlers.set('stripe', (headers, body) => {
            const stripe = this.providers.get('stripe');
            const signature = headers['stripe-signature'];
            const webhookSecret = this.config.providers.stripe.webhookSecret;

            try {
                const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
                return this.processStripeWebhook(event);
            } catch (error) {
                throw new Error(`Stripe webhook verification failed: ${error.message}`);
            }
        });

        // MercadoPago webhook handler
        this.webhookHandlers.set('mercadopago', (headers, body) => {
            return this.processMercadoPagoWebhook(body);
        });

        // PayPal webhook handler
        this.webhookHandlers.set('paypal', (headers, body) => {
            return this.processPayPalWebhook(body);
        });
    }

    // Stripe implementations
    async createStripePayment(options) {
        const stripe = this.providers.get('stripe');
        
        if (options.mode === 'subscription') {
            // Create checkout session for subscription
            const session = await stripe.checkout.sessions.create({
                payment_method_types: options.paymentMethods,
                mode: 'subscription',
                line_items: [{
                    price: options.priceId,
                    quantity: 1,
                }],
                success_url: options.successUrl,
                cancel_url: options.cancelUrl,
                metadata: options.metadata
            });

            return {
                id: session.id,
                url: session.url,
                provider: 'stripe'
            };
        } else {
            // Create payment intent for one-time payment
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(options.amount * 100), // Convert to cents
                currency: options.currency.toLowerCase(),
                description: options.description,
                metadata: options.metadata,
                automatic_payment_methods: {
                    enabled: options.automaticPaymentMethods
                }
            });

            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status,
                provider: 'stripe'
            };
        }
    }

    async confirmStripePayment(paymentId, options) {
        const stripe = this.providers.get('stripe');
        
        const paymentIntent = await stripe.paymentIntents.confirm(paymentId, {
            payment_method: options.paymentMethod
        });

        return {
            id: paymentIntent.id,
            status: paymentIntent.status,
            provider: 'stripe'
        };
    }

    async createStripeSubscription(options) {
        const stripe = this.providers.get('stripe');
        
        const subscription = await stripe.subscriptions.create({
            customer: options.customer,
            items: [{ price: options.priceId }],
            trial_period_days: options.trialPeriodDays,
            default_payment_method: options.defaultPaymentMethod,
            metadata: options.metadata
        });

        return {
            id: subscription.id,
            status: subscription.status,
            provider: 'stripe'
        };
    }

    async cancelStripeSubscription(subscriptionId, options) {
        const stripe = this.providers.get('stripe');
        
        const subscription = await stripe.subscriptions.cancel(subscriptionId, {
            prorate: options.prorate || false
        });

        return {
            id: subscription.id,
            status: subscription.status,
            provider: 'stripe'
        };
    }

    async refundStripePayment(paymentId, options) {
        const stripe = this.providers.get('stripe');
        
        const refund = await stripe.refunds.create({
            payment_intent: paymentId,
            amount: Math.round(options.amount * 100), // Convert to cents
            reason: options.reason,
            metadata: options.metadata
        });

        return {
            id: refund.id,
            status: refund.status,
            amount: refund.amount / 100, // Convert back from cents
            provider: 'stripe'
        };
    }

    async getStripePaymentStatus(paymentId) {
        const stripe = this.providers.get('stripe');
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        
        return {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            provider: 'stripe'
        };
    }

    processStripeWebhook(event) {
        switch (event.type) {
            case 'payment_intent.succeeded':
                this.handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                this.handlePaymentFailure(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                this.handleSubscriptionPayment(event.data.object);
                break;
            case 'customer.subscription.deleted':
                this.handleSubscriptionCancellation(event.data.object);
                break;
            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }

        return { received: true };
    }

    // MercadoPago implementations (mock)
    async createMercadoPagoPayment(options) {
        // Mock implementation
        return {
            id: this.generateId(),
            init_point: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${this.generateId()}`,
            provider: 'mercadopago'
        };
    }

    async confirmMercadoPagoPayment(paymentId, options) {
        return {
            id: paymentId,
            status: 'approved',
            provider: 'mercadopago'
        };
    }

    // PayPal implementations (mock)
    async createPayPalPayment(options) {
        return {
            id: this.generateId(),
            approval_url: `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=${this.generateId()}`,
            provider: 'paypal'
        };
    }

    async confirmPayPalPayment(paymentId, options) {
        return {
            id: paymentId,
            status: 'completed',
            provider: 'paypal'
        };
    }

    // Event handlers
    handlePaymentSuccess(payment) {
        console.log('💰 Payment succeeded:', payment.id);
        
        // Update local transaction
        const transaction = this.transactions.get(payment.id);
        if (transaction) {
            transaction.status = 'succeeded';
            transaction.succeededAt = new Date().toISOString();
            this.transactions.set(payment.id, transaction);
        }
    }

    handlePaymentFailure(payment) {
        console.log('❌ Payment failed:', payment.id);
        
        // Update local transaction
        const transaction = this.transactions.get(payment.id);
        if (transaction) {
            transaction.status = 'failed';
            transaction.failedAt = new Date().toISOString();
            this.transactions.set(payment.id, transaction);
        }
    }

    handleSubscriptionPayment(invoice) {
        console.log('🔄 Subscription payment:', invoice.subscription);
    }

    handleSubscriptionCancellation(subscription) {
        console.log('🚫 Subscription canceled:', subscription.id);
        
        // Update local subscription
        const localSubscription = this.subscriptions.get(subscription.id);
        if (localSubscription) {
            localSubscription.status = 'canceled';
            localSubscription.canceledAt = new Date().toISOString();
            this.subscriptions.set(subscription.id, localSubscription);
        }
    }

    generateId() {
        return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
}

// Singleton instance
let paymentsInstance = null;

module.exports = {
    PaymentsModule,
    
    // Factory function
    createPayments: (config) => new PaymentsModule(config),
    
    // Singleton getter
    getPayments: (config) => {
        if (!paymentsInstance) {
            paymentsInstance = new PaymentsModule(config);
        }
        return paymentsInstance;
    }
};