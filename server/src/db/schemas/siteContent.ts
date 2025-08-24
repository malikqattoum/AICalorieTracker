import { sql } from 'drizzle-orm';
import { int, varchar, text, mysqlTable } from 'drizzle-orm/mysql-core';

// Site Content Table
export const siteContent = mysqlTable('site_content', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: text('value').notNull(),
});

// Create indexes for better performance
export const siteContentIndexes = {
  siteContent_key: sql`CREATE INDEX IF NOT EXISTS site_content_key_idx ON site_content(key)`,
};