import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, text, mysqlTable } from 'drizzle-orm/mysql-core';

// App Config Table
export const appConfig = mysqlTable('app_config', {
  id: int('id').primaryKey().autoincrement(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('string'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const appConfigIndexes = {
  appConfig_id: sql`CREATE INDEX IF NOT EXISTS app_config_id_idx ON app_config(id)`,
  appConfig_key: sql`CREATE INDEX IF NOT EXISTS app_config_key_idx ON app_config(key)`,
  appConfig_type: sql`CREATE INDEX IF NOT EXISTS app_config_type_idx ON app_config(type)`,
};