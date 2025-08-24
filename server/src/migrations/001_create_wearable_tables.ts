import { sql } from 'drizzle-orm';
import { mysqlTable, varchar, int, boolean, timestamp, text, decimal, json, date } from 'drizzle-orm/mysql-core';
import { users } from '@shared/schema';

// Wearable Devices Table
export const wearableDevices = mysqlTable('wearable_devices', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_type: varchar('device_type', { length: 50 }).notNull().$type<
    'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'apple_watch'
  >(),
  device_name: varchar('device_name', { length: 100 }).notNull(),
  device_id: varchar('device_id', { length: 255 }).unique(),
  is_connected: boolean('is_connected').default(true).notNull(),
  last_sync_at: timestamp('last_sync_at'),
  sync_frequency_minutes: int('sync_frequency_minutes').default(60).notNull(),
  is_two_way_sync: boolean('is_two_way_sync').default(true).notNull(),
  auth_token_encrypted: text('auth_token_encrypted'),
  refresh_token_encrypted: text('refresh_token_encrypted'),
  settings: json('settings'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
});

// Health Metrics Table
export const healthMetrics = mysqlTable('health_metrics', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_id: int('device_id').references(() => wearableDevices.id, { onDelete: 'set null' }),
  metric_type: varchar('metric_type', { length: 50 }).notNull().$type<
    'steps' | 'distance' | 'calories_burned' | 'heart_rate' |
    'sleep_duration' | 'sleep_quality' | 'activity_minutes' |
    'resting_heart_rate' | 'blood_pressure' | 'weight' |
    'body_fat' | 'water_intake' | 'workout_duration'
  >(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  source_timestamp: timestamp('source_timestamp').notNull(),
  recorded_at: timestamp('recorded_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }),
  metadata: json('metadata'),
});

// Sync Logs Table
export const syncLogs = mysqlTable('sync_logs', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_id: int('device_id').references(() => wearableDevices.id, { onDelete: 'set null' }),
  sync_type: varchar('sync_type', { length: 20 }).notNull().$type<'pull' | 'push' | 'two_way'>(),
  status: varchar('status', { length: 20 }).notNull().$type<'success' | 'failed' | 'partial' | 'conflict'>(),
  records_processed: int('records_processed').default(0).notNull(),
  records_added: int('records_added').default(0).notNull(),
  records_updated: int('records_updated').default(0).notNull(),
  records_failed: int('records_failed').default(0).notNull(),
  error_message: text('error_message'),
  started_at: timestamp('started_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completed_at: timestamp('completed_at'),
  duration_seconds: int('duration_seconds'),
  metadata: json('metadata'),
});

// Correlation Analysis Table
export const correlationAnalysis = mysqlTable('correlation_analysis', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  correlation_type: varchar('correlation_type', { length: 50 }).notNull().$type<
    'sleep_nutrition' | 'heart_rate_nutrition' | 'activity_nutrition'
  >(),
  analysis_date: date('analysis_date').notNull(),
  correlation_score: decimal('correlation_score', { precision: 3, scale: 2 }).notNull(),
  confidence_level: decimal('confidence_level', { precision: 3, scale: 2 }).notNull(),
  insights: json('insights'),
  recommendations: json('recommendations'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});