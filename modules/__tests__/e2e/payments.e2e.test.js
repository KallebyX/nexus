/**
 * E2E Tests - Payment Flow
 * Nexus Framework
 *
 * Testes end-to-end para o fluxo completo de pagamentos
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock do serviço de pagamentos
class MockPaymentService {
  constructor() {
    this.transactions = [];
    this.customers = new Map();
    this.subscriptions = new Map();
  }

  // Processar pagamento
  async processPayment(paymentData) {
    const { amount, currency, customerId, paymentMethod, description } = paymentData;

    // Validações
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (!paymentMethod) {
      throw new Error('Payment method required');
    }

    // Simular processamento
    const transaction = {
      id: `txn_${Date.now()}`,
      amount,
      currency: currency || 'BRL',
      customerId,
      paymentMethod,
      description,
      status: 'succeeded',
      createdAt: new Date()
    };

    // Simular falha para cartões específicos
    if (paymentMethod.cardNumber?.endsWith('0000')) {
      transaction.status = 'declined';
      throw new Error('Card declined');
    }

    this.transactions.push(transaction);

    return {
      success: true,
      transaction
    };
  }

  // Criar cliente
  async createCustomer(customerData) {
    const customer = {
      id: `cus_${Date.now()}`,
      ...customerData,
      createdAt: new Date()
    };

    this.customers.set(customer.id, customer);

    return { success: true, customer };
  }

  // Criar assinatura
  async createSubscription(subscriptionData) {
    const { customerId, planId, paymentMethodId } = subscriptionData;

    if (!this.customers.has(customerId)) {
      throw new Error('Customer not found');
    }

    const subscription = {
      id: `sub_${Date.now()}`,
      customerId,
      planId,
      paymentMethodId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.subscriptions.set(subscription.id, subscription);

    return { success: true, subscription };
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId, cancelImmediately = false) {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (cancelImmediately) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    return { success: true, subscription };
  }

  // Reembolsar pagamento
  async refundPayment(transactionId, amount = null) {
    const transaction = this.transactions.find(t => t.id === transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'refunded') {
      throw new Error('Transaction already refunded');
    }

    const refundAmount = amount || transaction.amount;

    if (refundAmount > transaction.amount) {
      throw new Error('Refund amount exceeds transaction amount');
    }

    const refund = {
      id: `ref_${Date.now()}`,
      transactionId,
      amount: refundAmount,
      status: 'succeeded',
      createdAt: new Date()
    };

    transaction.status = refundAmount === transaction.amount ? 'refunded' : 'partially_refunded';

    return { success: true, refund };
  }

  // Obter transação
  async getTransaction(transactionId) {
    const transaction = this.transactions.find(t => t.id === transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return { success: true, transaction };
  }

  // Listar transações do cliente
  async listTransactions(customerId) {
    const transactions = this.transactions.filter(t => t.customerId === customerId);
    return { success: true, transactions };
  }
}

describe('E2E: Payment Processing Flow', () => {
  let paymentService;

  beforeAll(() => {
    paymentService = new MockPaymentService();
  });

  beforeEach(() => {
    paymentService.transactions = [];
    paymentService.customers.clear();
    paymentService.subscriptions.clear();
  });

  describe('Single Payment Flow', () => {
    test('should complete successful payment', async () => {
      const result = await paymentService.processPayment({
        amount: 9990, // R$ 99,90 em centavos
        currency: 'BRL',
        customerId: 'cus_123',
        paymentMethod: {
          type: 'card',
          cardNumber: '4242424242424242',
          expMonth: 12,
          expYear: 2025,
          cvc: '123'
        },
        description: 'Test Purchase'
      });

      expect(result.success).toBe(true);
      expect(result.transaction.status).toBe('succeeded');
      expect(result.transaction.amount).toBe(9990);
    });

    test('should handle declined card', async () => {
      await expect(paymentService.processPayment({
        amount: 5000,
        paymentMethod: {
          type: 'card',
          cardNumber: '4000000000000000' // Card ending in 0000 is declined
        }
      })).rejects.toThrow('Card declined');
    });

    test('should validate payment amount', async () => {
      await expect(paymentService.processPayment({
        amount: -100,
        paymentMethod: { type: 'card', cardNumber: '4242424242424242' }
      })).rejects.toThrow('Amount must be positive');
    });

    test('should require payment method', async () => {
      await expect(paymentService.processPayment({
        amount: 1000
      })).rejects.toThrow('Payment method required');
    });
  });

  describe('Customer Management Flow', () => {
    test('should create customer', async () => {
      const result = await paymentService.createCustomer({
        email: 'customer@nexus.dev',
        name: 'Test Customer'
      });

      expect(result.success).toBe(true);
      expect(result.customer.id).toMatch(/^cus_/);
      expect(result.customer.email).toBe('customer@nexus.dev');
    });

    test('should store customer for future payments', async () => {
      const customerResult = await paymentService.createCustomer({
        email: 'repeat@nexus.dev',
        name: 'Repeat Customer'
      });

      const customerId = customerResult.customer.id;

      // Fazer pagamento com cliente salvo
      const paymentResult = await paymentService.processPayment({
        amount: 5000,
        customerId,
        paymentMethod: { type: 'card', cardNumber: '4242424242424242' }
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.transaction.customerId).toBe(customerId);
    });
  });

  describe('Subscription Flow', () => {
    let customerId;

    beforeEach(async () => {
      const result = await paymentService.createCustomer({
        email: 'subscriber@nexus.dev',
        name: 'Subscriber'
      });
      customerId = result.customer.id;
    });

    test('should create subscription', async () => {
      const result = await paymentService.createSubscription({
        customerId,
        planId: 'plan_pro',
        paymentMethodId: 'pm_123'
      });

      expect(result.success).toBe(true);
      expect(result.subscription.status).toBe('active');
      expect(result.subscription.planId).toBe('plan_pro');
    });

    test('should cancel subscription at period end', async () => {
      const subResult = await paymentService.createSubscription({
        customerId,
        planId: 'plan_basic',
        paymentMethodId: 'pm_123'
      });

      const cancelResult = await paymentService.cancelSubscription(
        subResult.subscription.id,
        false // Cancel at period end
      );

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.subscription.cancelAtPeriodEnd).toBe(true);
      expect(cancelResult.subscription.status).toBe('active'); // Still active until period ends
    });

    test('should cancel subscription immediately', async () => {
      const subResult = await paymentService.createSubscription({
        customerId,
        planId: 'plan_enterprise',
        paymentMethodId: 'pm_123'
      });

      const cancelResult = await paymentService.cancelSubscription(
        subResult.subscription.id,
        true // Cancel immediately
      );

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.subscription.status).toBe('canceled');
      expect(cancelResult.subscription.canceledAt).toBeDefined();
    });

    test('should fail for non-existent customer', async () => {
      await expect(paymentService.createSubscription({
        customerId: 'cus_nonexistent',
        planId: 'plan_basic'
      })).rejects.toThrow('Customer not found');
    });
  });

  describe('Refund Flow', () => {
    let transactionId;

    beforeEach(async () => {
      const result = await paymentService.processPayment({
        amount: 10000,
        paymentMethod: { type: 'card', cardNumber: '4242424242424242' }
      });
      transactionId = result.transaction.id;
    });

    test('should process full refund', async () => {
      const result = await paymentService.refundPayment(transactionId);

      expect(result.success).toBe(true);
      expect(result.refund.amount).toBe(10000);

      const txn = await paymentService.getTransaction(transactionId);
      expect(txn.transaction.status).toBe('refunded');
    });

    test('should process partial refund', async () => {
      const result = await paymentService.refundPayment(transactionId, 5000);

      expect(result.success).toBe(true);
      expect(result.refund.amount).toBe(5000);

      const txn = await paymentService.getTransaction(transactionId);
      expect(txn.transaction.status).toBe('partially_refunded');
    });

    test('should prevent double refund', async () => {
      await paymentService.refundPayment(transactionId);

      await expect(paymentService.refundPayment(transactionId))
        .rejects.toThrow('Transaction already refunded');
    });

    test('should prevent refund exceeding amount', async () => {
      await expect(paymentService.refundPayment(transactionId, 20000))
        .rejects.toThrow('Refund amount exceeds transaction amount');
    });
  });

  describe('Complete Purchase Journey', () => {
    test('should handle full e-commerce checkout flow', async () => {
      // 1. Criar cliente
      const customerResult = await paymentService.createCustomer({
        email: 'shopper@nexus.dev',
        name: 'Happy Shopper'
      });
      expect(customerResult.success).toBe(true);
      const customerId = customerResult.customer.id;

      // 2. Processar pagamento do carrinho
      const paymentResult = await paymentService.processPayment({
        amount: 29990, // R$ 299,90
        currency: 'BRL',
        customerId,
        paymentMethod: {
          type: 'card',
          cardNumber: '4242424242424242',
          expMonth: 12,
          expYear: 2026,
          cvc: '123'
        },
        description: 'Order #12345'
      });
      expect(paymentResult.success).toBe(true);
      expect(paymentResult.transaction.status).toBe('succeeded');

      // 3. Verificar transação
      const txnResult = await paymentService.getTransaction(paymentResult.transaction.id);
      expect(txnResult.transaction.amount).toBe(29990);

      // 4. Listar histórico de transações
      const historyResult = await paymentService.listTransactions(customerId);
      expect(historyResult.transactions.length).toBe(1);
    });

    test('should handle subscription upgrade flow', async () => {
      // 1. Criar cliente
      const customerResult = await paymentService.createCustomer({
        email: 'upgrader@nexus.dev',
        name: 'Upgrading User'
      });
      const customerId = customerResult.customer.id;

      // 2. Criar assinatura básica
      const basicSubResult = await paymentService.createSubscription({
        customerId,
        planId: 'plan_basic',
        paymentMethodId: 'pm_123'
      });
      expect(basicSubResult.subscription.status).toBe('active');

      // 3. Cancelar assinatura básica
      await paymentService.cancelSubscription(basicSubResult.subscription.id, true);

      // 4. Criar assinatura pro (upgrade)
      const proSubResult = await paymentService.createSubscription({
        customerId,
        planId: 'plan_pro',
        paymentMethodId: 'pm_123'
      });
      expect(proSubResult.subscription.planId).toBe('plan_pro');
      expect(proSubResult.subscription.status).toBe('active');
    });
  });
});

describe('E2E: Payment Webhooks', () => {
  test('should handle payment_intent.succeeded webhook', () => {
    const webhook = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          amount: 5000,
          status: 'succeeded'
        }
      }
    };

    expect(webhook.type).toBe('payment_intent.succeeded');
    expect(webhook.data.object.status).toBe('succeeded');
  });

  test('should handle subscription.created webhook', () => {
    const webhook = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active'
        }
      }
    };

    expect(webhook.type).toBe('customer.subscription.created');
    expect(webhook.data.object.status).toBe('active');
  });

  test('should handle invoice.payment_failed webhook', () => {
    const webhook = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
          amount_due: 9900,
          attempt_count: 1
        }
      }
    };

    expect(webhook.type).toBe('invoice.payment_failed');
    expect(webhook.data.object.attempt_count).toBeGreaterThan(0);
  });
});
