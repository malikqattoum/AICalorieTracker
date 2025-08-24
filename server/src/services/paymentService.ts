import { db } from '../db';
import { log, logError } from '../config';

// Payment configuration
const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    endpointSecret: process.env.STRIPE_ENDPOINT_SECRET || '',
  },
  plans: {
    free: {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      currency: 'usd',
      interval: 'month',
      features: {
        mealsPerDay: 3,
        aiAnalysis: false,
        wearableIntegration: false,
        healthcareIntegration: false,
        dataExport: false,
        support: 'community',
      }
    },
    premium: {
      id: 'premium',
      name: 'Premium Plan',
      price: 9.99,
      currency: 'usd',
      interval: 'month',
      features: {
        mealsPerDay: 10,
        aiAnalysis: true,
        wearableIntegration: true,
        healthcareIntegration: true,
        dataExport: true,
        support: 'email',
      }
    },
    professional: {
      id: 'professional',
      name: 'Professional Plan',
      price: 29.99,
      currency: 'usd',
      interval: 'month',
      features: {
        mealsPerDay: 50,
        aiAnalysis: true,
        wearableIntegration: true,
        healthcareIntegration: true,
        dataExport: true,
        support: 'priority',
        teamAccess: true,
        apiAccess: true,
      }
    }
  }
};

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  userId: number;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethodId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled' | 'requires_capture';
  clientSecret: string;
  paymentMethodId?: string;
  userId: number;
}

export interface Transaction {
  id: string;
  userId: number;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  paymentIntentId: string;
  subscriptionId?: string;
  description: string;
  createdAt: Date;
  refundedAt?: Date;
  refundId?: string;
}

class PaymentService {
  private initialized = false;

  /**
   * Initialize the payment service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify Stripe configuration
      if (!PAYMENT_CONFIG.stripe.secretKey) {
        throw new Error('Stripe secret key not configured');
      }

      this.initialized = true;
      log('Payment service initialized successfully');
    } catch (error) {
      logError('Failed to initialize payment service:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe PaymentIntent
   */
  async createPaymentIntent(userId: number, amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
    try {
      await this.initialize();

      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          userId: userId.toString(),
        },
      });

      // Save payment intent to database
      await db.execute(
        `INSERT INTO payment_intents 
         (id, amount, currency, status, client_secret, user_id, created_at)
         VALUES ('${paymentIntent.id}', ${amount}, '${currency}', '${paymentIntent.status}', '${paymentIntent.client_secret}', ${userId}, '${new Date().toISOString()}')`
      );

      return {
        id: paymentIntent.id,
        amount,
        currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        userId,
      };
    } catch (error) {
      logError('Failed to create payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    try {
      await this.initialize();

      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      // Update payment intent in database
      await db.execute(
        `UPDATE payment_intents 
         SET status = '${paymentIntent.status}', payment_method_id = '${paymentMethodId}'
         WHERE id = '${paymentIntentId}'`
      );

      // Get user ID from database
      const [paymentIntentData] = await db.execute(
        `SELECT user_id FROM payment_intents WHERE id = '${paymentIntentId}'`
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentMethodId,
        userId: paymentIntentData[0]?.user_id || 0,
      };
    } catch (error) {
      logError('Failed to confirm payment intent:', error);
      throw new Error(`Failed to confirm payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(userId: number, planId: string, paymentMethodId: string): Promise<Subscription> {
    try {
      await this.initialize();

      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      const plan = PAYMENT_CONFIG.plans[planId as keyof typeof PAYMENT_CONFIG.plans];
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      // Create or retrieve customer
      const customer = await this.getOrCreateCustomer(userId);

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: this.getPriceId(planId), // This would map to actual Stripe price IDs
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await db.execute(
        `INSERT INTO subscriptions 
         (id, user_id, plan_id, status, current_period_start, current_period_end, trial_end, cancel_at_period_end, created_at)
         VALUES ('${subscription.id}', ${userId}, '${planId}', '${subscription.status}', '${new Date(subscription.current_period_start * 1000).toISOString()}', '${new Date(subscription.current_period_end * 1000).toISOString()}', '${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null}', ${subscription.cancel_at_period_end}, '${new Date().toISOString()}')`
      );

      return {
        id: subscription.id,
        userId,
        planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethodId,
      };
    } catch (error) {
      logError('Failed to create subscription:', error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<Subscription> {
    try {
      await this.initialize();

      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: atPeriodEnd,
      });

      // Update subscription in database
      await db.execute(
        `UPDATE subscriptions 
         SET cancel_at_period_end = ${atPeriodEnd}, canceled_at = '${new Date().toISOString()}'
         WHERE id = '${subscriptionId}'`
      );

      // Get user ID and plan ID from database
      const [subscriptionData] = await db.execute(
        `SELECT user_id, plan_id FROM subscriptions WHERE id = '${subscriptionId}'`
      );

      return {
        id: subscription.id,
        userId: subscriptionData[0]?.user_id || 0,
        planId: subscriptionData[0]?.plan_id || '',
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethodId: subscription.default_payment_method as string,
      };
    } catch (error) {
      logError('Failed to cancel subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    try {
      const [subscriptions] = await db.execute(
        `SELECT * FROM subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC`
      );

      return subscriptions.map((sub: any) => ({
        id: sub.id,
        userId: sub.user_id,
        planId: sub.plan_id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start),
        currentPeriodEnd: new Date(sub.current_period_end),
        trialEnd: sub.trial_end ? new Date(sub.trial_end) : undefined,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at) : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        paymentMethodId: sub.payment_method_id,
      }));
    } catch (error) {
      logError('Failed to get user subscriptions:', error);
      throw new Error(`Failed to get user subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's payment methods
   */
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    try {
      const [paymentMethods] = await db.execute(
        `SELECT * FROM payment_methods WHERE user_id = ${userId} ORDER BY is_default DESC`
      );

      return paymentMethods.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.last4,
        brand: pm.brand,
        expMonth: pm.exp_month,
        expYear: pm.exp_year,
        isDefault: pm.is_default,
      }));
    } catch (error) {
      logError('Failed to get user payment methods:', error);
      throw new Error(`Failed to get user payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(userId: number, paymentMethodId: string): Promise<PaymentMethod> {
    try {
      await this.initialize();

      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      // Attach payment method to customer
      const customer = await this.getOrCreateCustomer(userId);
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Save payment method to database
      await db.execute(
        `INSERT INTO payment_methods 
         (id, user_id, type, last4, brand, exp_month, exp_year, is_default, created_at)
         VALUES ('${paymentMethod.id}', ${userId}, '${paymentMethod.type}', '${paymentMethod.card?.last4}', '${paymentMethod.card?.brand}', ${paymentMethod.card?.exp_month}, ${paymentMethod.card?.exp_year}, false, '${new Date().toISOString()}')`
      );

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as 'card' | 'paypal' | 'apple_pay' | 'google_pay',
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
        isDefault: false,
      };
    } catch (error) {
      logError('Failed to add payment method:', error);
      throw new Error(`Failed to add payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: number, paymentMethodId: string): Promise<void> {
    try {
      // Update all payment methods to not be default
      await db.execute(
        `UPDATE payment_methods SET is_default = false WHERE user_id = ${userId}`
      );

      // Set the new default
      await db.execute(
        `UPDATE payment_methods SET is_default = true WHERE id = '${paymentMethodId}' AND user_id = ${userId}`
      );
    } catch (error) {
      logError('Failed to set default payment method:', error);
      throw new Error(`Failed to set default payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(payload: string, signature: string): Promise<void> {
    try {
      await this.initialize();

      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      const event = stripe.webhooks.constructEvent(payload, signature, PAYMENT_CONFIG.stripe.webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logError('Failed to process webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle payment intent succeeded
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    try {
      // Update payment intent status
      await db.execute(
        `UPDATE payment_intents SET status = 'succeeded' WHERE id = '${paymentIntent.id}'`
      );

      // Create transaction record
      await db.execute(
        `INSERT INTO transactions 
         (id, user_id, amount, currency, status, payment_intent_id, description, created_at)
         VALUES ('txn_${Date.now()}', ${paymentIntent.metadata.userId}, ${paymentIntent.amount / 100}, '${paymentIntent.currency}', 'succeeded', '${paymentIntent.id}', 'Payment succeeded', '${new Date().toISOString()}')`
      );
    } catch (error) {
      logError('Failed to handle payment intent succeeded:', error);
    }
  }

  /**
   * Handle payment intent failed
   */
  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    try {
      await db.execute(
        `UPDATE payment_intents SET status = 'failed' WHERE id = '${paymentIntent.id}'`
      );
    } catch (error) {
      logError('Failed to handle payment intent failed:', error);
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    try {
      await db.execute(
        `UPDATE subscriptions SET status = 'active' WHERE id = '${subscription.id}'`
      );
    } catch (error) {
      logError('Failed to handle subscription created:', error);
    }
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      await db.execute(
        `UPDATE subscriptions 
         SET status = '${subscription.status}', 
             current_period_start = '${new Date(subscription.current_period_start * 1000).toISOString()}',
             current_period_end = '${new Date(subscription.current_period_end * 1000).toISOString()}'
         WHERE id = '${subscription.id}'`
      );
    } catch (error) {
      logError('Failed to handle subscription updated:', error);
    }
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      await db.execute(
        `UPDATE subscriptions SET status = 'canceled' WHERE id = '${subscription.id}'`
      );
    } catch (error) {
      logError('Failed to handle subscription deleted:', error);
    }
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateCustomer(userId: number): Promise<any> {
    try {
      // Check if customer already exists
      const [customers] = await db.execute(
        `SELECT stripe_customer_id FROM customers WHERE user_id = ${userId}`
      );

      if (customers.length && customers[0].stripe_customer_id) {
        const Stripe = require('stripe');
        const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);
        return await stripe.customers.retrieve(customers[0].stripe_customer_id);
      }

      // Create new customer
      const Stripe = require('stripe');
      const stripe = Stripe(PAYMENT_CONFIG.stripe.secretKey);

      const customer = await stripe.customers.create({
        metadata: {
          userId: userId.toString(),
        },
      });

      // Save customer ID to database
      await db.execute(
        `INSERT INTO customers (user_id, stripe_customer_id, created_at) VALUES (${userId}, '${customer.id}', '${new Date().toISOString()}')`
      );

      return customer;
    } catch (error) {
      logError('Failed to get or create customer:', error);
      throw error;
    }
  }

  /**
   * Get Stripe price ID for plan
   */
  private getPriceId(planId: string): string {
    // This would map to actual Stripe price IDs
    const priceMap: Record<string, string> = {
      'premium': 'price_1PQqRZ2KzZKYlo2C3Xo8j9QJ',
      'professional': 'price_1PQqRZ2KzZKYlo2C3Y8j9QKJ',
    };
    return priceMap[planId] || 'price_1PQqRZ2KzZKYlo2C3Zo8j9QL';
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;