import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, decimal, boolean, mysqlTable } from 'drizzle-orm/mysql-core';

// Referral Settings Table
export const referralSettings = mysqlTable('referral_settings', {
  id: int('id').primaryKey().autoincrement(),
  commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }).notNull().default(sql`10.00`),
  isRecurring: boolean('is_recurring').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const referralSettingsIndexes = {
  referralSettings_id: sql`CREATE INDEX IF NOT EXISTS referral_settings_id_idx ON referral_settings(id)`,
  referralSettings_commissionPercent: sql`CREATE INDEX IF NOT EXISTS referral_settings_commission_percent_idx ON referral_settings(commission_percent)`,
  referralSettings_isRecurring: sql`CREATE INDEX IF NOT EXISTS referral_settings_is_recurring_idx ON referral_settings(is_recurring)`,
};