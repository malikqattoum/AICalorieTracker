import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, decimal, text, mysqlTable } from 'drizzle-orm/mysql-core';

// Payment Intents Table
export const paymentIntents = mysqlTable('payment_intents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('usd'),
  status: varchar('status', { length: 50 }).default('requires_payment_method'),
  clientSecret: varchar('client_secret', { length: 255 }).notNull(),
  paymentMethodId: varchar('payment_method_id', { length: 255 }),
  userId: int('user_id').notNull(),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Methods Table
export const paymentMethods = mysqlTable('payment_methods', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'card', 'paypal', 'apple_pay', 'google_pay'
  last4: varchar('last4', { length: 4 }),
  brand: varchar('brand', { length: 50 }), // 'visa', 'mastercard', 'amex', etc.
  expMonth: int('exp_month'),
  expYear: int('exp_year'),
  isDefault: boolean('is_default').default(false),
  providerId: varchar('provider_id', { length: 255 }), // External provider's payment method ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subscriptions Table
export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  planId: varchar('plan_id', { length: 50 }).notNull(), // 'free', 'premium', 'professional'
  status: varchar('status', { length: 50 }).default('incomplete'), // 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  trialEnd: timestamp('trial_end'),
  canceledAt: timestamp('canceled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  paymentMethodId: varchar('payment_method_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Transactions Table
export const transactions = mysqlTable('transactions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('usd'),
  status: varchar('status', { length: 50 }).notNull(), // 'succeeded', 'failed', 'pending', 'refunded'
  paymentIntentId: varchar('payment_intent_id', { length: 255 }).notNull(),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  description: varchar('description', { length: 500 }).notNull(),
  metadata: text('metadata'), // JSON string for additional data
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  refundedAt: timestamp('refunded_at'),
  refundId: varchar('refund_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Customers Table (for Stripe integration)
export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').unique().notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Refunds Table
export const refunds = mysqlTable('refunds', {
  id: varchar('id', { length: 255 }).primaryKey(),
  transactionId: varchar('transaction_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('usd'),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'succeeded', 'failed', 'canceled'
  reason: varchar('reason', { length: 100 }), // 'duplicate', 'fraudulent', 'requested_by_customer', etc.
  description: text('description'),
  stripeRefundId: varchar('stripe_refund_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subscription Items Table (for multiple products per subscription)
export const subscriptionItems = mysqlTable('subscription_items', {
  id: varchar('id', { length: 255 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 255 }).notNull().references(() => subscriptions.id),
  priceId: varchar('price_id', { length: 255 }).notNull(), // Stripe price ID
  quantity: int('quantity').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Invoices Table
export const invoices = mysqlTable('invoices', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('usd'),
  status: varchar('status', { length: 50 }).default('open'), // 'open', 'paid', 'void', 'uncollectible'
  hostedInvoiceUrl: varchar('hosted_invoice_url', { length: 500 }),
  invoicePdf: varchar('invoice_pdf', { length: 500 }),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Webhooks Table
export const paymentWebhooks = mysqlTable('payment_webhooks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: text('event_data').notNull(), // JSON string of the webhook payload
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Create indexes for better performance
export const paymentIndexes = {
  paymentIntents_userId: sql`CREATE INDEX IF NOT EXISTS payment_intents_user_id_idx ON payment_intents(user_id)`,
  paymentIntents_status: sql`CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON payment_intents(status)`,
  paymentMethods_userId: sql`CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id)`,
  paymentMethods_isDefault: sql`CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON payment_methods(is_default)`,
  subscriptions_userId: sql`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id)`,
  subscriptions_status: sql`CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)`,
  subscriptions_planId: sql`CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON subscriptions(plan_id)`,
  transactions_userId: sql`CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id)`,
  transactions_status: sql`CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status)`,
  transactions_paymentIntentId: sql`CREATE INDEX IF NOT EXISTS transactions_payment_intent_id_idx ON transactions(payment_intent_id)`,
  customers_userId: sql`CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id)`,
  customers_stripeCustomerId: sql`CREATE INDEX IF NOT EXISTS customers_stripe_customer_id_idx ON customers(stripe_customer_id)`,
  refunds_transactionId: sql`CREATE INDEX IF NOT EXISTS refunds_transaction_id_idx ON refunds(transaction_id)`,
  subscriptionItems_subscriptionId: sql`CREATE INDEX IF NOT EXISTS subscription_items_subscription_id_idx ON subscription_items(subscription_id)`,
  invoices_userId: sql`CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id)`,
  invoices_subscriptionId: sql`CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON invoices(subscription_id)`,
  invoices_status: sql`CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status)`,
  paymentWebhooks_eventType: sql`CREATE INDEX IF NOT EXISTS payment_webhooks_event_type_idx ON payment_webhooks(event_type)`,
  paymentWebhooks_processed: sql`CREATE INDEX IF NOT EXISTS payment_webhooks_processed_idx ON payment_webhooks(processed)`,
};