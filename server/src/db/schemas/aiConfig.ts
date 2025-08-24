import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, text, mysqlTable } from 'drizzle-orm/mysql-core';

// AI Configuration Table
export const aiConfig = mysqlTable('ai_config', {
  id: int('id').primaryKey().autoincrement(),
  provider: varchar('provider', { length: 50 }).notNull().default('openai'),
  apiKeyEncrypted: text('api_key_encrypted'),
  modelName: varchar('model_name', { length: 100 }).default('gpt-4-vision-preview'),
  temperature: int('temperature').default(70), // stored as int (70 = 0.7)
  maxTokens: int('max_tokens').default(1000),
  promptTemplate: text('prompt_template'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const aiConfigIndexes = {
  aiConfig_id: sql`CREATE INDEX IF NOT EXISTS ai_config_id_idx ON ai_config(id)`,
  aiConfig_provider: sql`CREATE INDEX IF NOT EXISTS ai_config_provider_idx ON ai_config(provider)`,
  aiConfig_modelName: sql`CREATE INDEX IF NOT EXISTS ai_config_model_name_idx ON ai_config(model_name)`,
  aiConfig_isActive: sql`CREATE INDEX IF NOT EXISTS ai_config_is_active_idx ON ai_config(is_active)`,
};