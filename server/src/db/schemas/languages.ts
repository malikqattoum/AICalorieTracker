import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, text, mysqlTable } from 'drizzle-orm/mysql-core';
import { z } from 'zod';

// Languages Table
export const languages = mysqlTable('languages', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Translations Table
export const translations = mysqlTable('translations', {
  id: int('id').primaryKey().autoincrement(),
  languageId: int('language_id').notNull(),
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  isAutoTranslated: boolean('is_auto_translated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertLanguageSchema = z.object({
  code: z.string().min(1, "Language code is required").max(10, "Code must be less than 10 characters"),
  name: z.string().min(1, "Language name is required").max(100, "Name must be less than 100 characters"),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const insertTranslationSchema = z.object({
  languageId: z.number().min(1, "Language ID is required"),
  key: z.string().min(1, "Translation key is required").max(255, "Key must be less than 255 characters"),
  value: z.string().min(1, "Translation value is required"),
  isAutoTranslated: z.boolean().default(false),
});

// Create indexes for better performance
export const languagesIndexes = {
  languages_code: sql`CREATE INDEX IF NOT EXISTS languages_code_idx ON languages(code)`,
  languages_isActive: sql`CREATE INDEX IF NOT EXISTS languages_is_active_idx ON languages(is_active)`,
  languages_isDefault: sql`CREATE INDEX IF NOT EXISTS languages_is_default_idx ON languages(is_default)`,
};

export const translationsIndexes = {
  translations_languageId: sql`CREATE INDEX IF NOT EXISTS translations_language_id_idx ON translations(language_id)`,
  translations_key: sql`CREATE INDEX IF NOT EXISTS translations_key_idx ON translations(key)`,
  translations_createdAt: sql`CREATE INDEX IF NOT EXISTS translations_created_at_idx ON translations(created_at)`,
  translations_updatedAt: sql`CREATE INDEX IF NOT EXISTS translations_updated_at_idx ON translations(updated_at)`,
};