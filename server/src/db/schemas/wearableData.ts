import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, decimal, json, datetime, mysqlTable } from 'drizzle-orm/mysql-core';

// Wearable Data Table
export const wearableData = mysqlTable('wearable_data', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(),
  device_id: varchar('device_id', { length: 100 }),
  metricType: varchar('metric_type', { length: 50 }).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  source: varchar('source', { length: 20 }).default('automatic'),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }),
  metadata: json('metadata'),
  syncedAt: datetime('synced_at').default(null),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: datetime('deleted_at').default(null),
});

// Create indexes for better performance
export const wearableDataIndexes = {
  wearableData_userId: sql`CREATE INDEX IF NOT EXISTS wearable_data_user_id_idx ON wearable_data(user_id)`,
  wearableData_deviceType: sql`CREATE INDEX IF NOT EXISTS wearable_data_device_type_idx ON wearable_data(device_type)`,
  wearableData_metricType: sql`CREATE INDEX IF NOT EXISTS wearable_data_metric_type_idx ON wearable_data(metric_type)`,
  wearableData_timestamp: sql`CREATE INDEX IF NOT EXISTS wearable_data_timestamp_idx ON wearable_data(timestamp)`,
  wearableData_source: sql`CREATE INDEX IF NOT EXISTS wearable_data_source_idx ON wearable_data(source)`,
  wearableData_syncedAt: sql`CREATE INDEX IF NOT EXISTS wearable_data_synced_at_idx ON wearable_data(synced_at)`,
};