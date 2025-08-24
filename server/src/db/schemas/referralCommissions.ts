import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, decimal, boolean, mysqlTable } from 'drizzle-orm/mysql-core';

// Referral Commissions Table
export const referralCommissions = mysqlTable('referral_commissions', {
  id: int('id').primaryKey().autoincrement(),
  referrerId: int('referrer_id').notNull(),
  refereeId: int('referee_id').notNull(),
  subscriptionId: varchar('subscription_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default(sql`0.00`),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  isRecurring: boolean('is_recurring').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  paidAt: timestamp('paid_at'),
});

// Create indexes for better performance
export const referralCommissionsIndexes = {
  referralCommissions_referrerId: sql`CREATE INDEX IF NOT EXISTS referral_commissions_referrer_id_idx ON referral_commissions(referrer_id)`,
  referralCommissions_refereeId: sql`CREATE INDEX IF NOT EXISTS referral_commissions_referee_id_idx ON referral_commissions(referee_id)`,
  referralCommissions_subscriptionId: sql`CREATE INDEX IF NOT EXISTS referral_commissions_subscription_id_idx ON referral_commissions(subscription_id)`,
  referralCommissions_status: sql`CREATE INDEX IF NOT EXISTS referral_commissions_status_idx ON referral_commissions(status)`,
  referralCommissions_isRecurring: sql`CREATE INDEX IF NOT EXISTS referral_commissions_is_recurring_idx ON referral_commissions(is_recurring)`,
  referralCommissions_createdAt: sql`CREATE INDEX IF NOT EXISTS referral_commissions_created_at_idx ON referral_commissions(created_at)`,
};