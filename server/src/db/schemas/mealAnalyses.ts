import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, json, text, decimal, mysqlTable } from 'drizzle-orm/mysql-core';

// Meal Analyses Table
export const mealAnalyses = mysqlTable('meal_analyses', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  mealId: int('meal_id').notNull(),
  foodName: varchar('food_name', { length: 255 }).notNull(),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }),
  analysisDetails: json('analysis_details'),
  aiInsights: text('ai_insights'),
  suggestedPortionSize: varchar('suggested_portion_size', { length: 100 }),
  estimatedCalories: int('estimated_calories'),
  estimatedProtein: decimal('estimated_protein', { precision: 5, scale: 2 }),
  estimatedCarbs: decimal('estimated_carbs', { precision: 5, scale: 2 }),
  estimatedFat: decimal('estimated_fat', { precision: 5, scale: 2 }),
  imageUrl: varchar('image_url', { length: 500 }),
  imageHash: varchar('image_hash', { length: 64 }),
  analysisTimestamp: timestamp('analysis_timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Create indexes for better performance
export const mealAnalysesIndexes = {
  mealAnalyses_userId: sql`CREATE INDEX IF NOT EXISTS meal_analyses_user_id_idx ON meal_analyses(user_id)`,
  mealAnalyses_mealId: sql`CREATE INDEX IF NOT EXISTS meal_analyses_meal_id_idx ON meal_analyses(meal_id)`,
  mealAnalyses_analysisTimestamp: sql`CREATE INDEX IF NOT EXISTS meal_analyses_analysis_timestamp_idx ON meal_analyses(analysis_timestamp)`,
  mealAnalyses_imageHash: sql`CREATE INDEX IF NOT EXISTS meal_analyses_image_hash_idx ON meal_analyses(image_hash)`,
  mealAnalyses_confidenceScore: sql`CREATE INDEX IF NOT EXISTS meal_analyses_confidence_score_idx ON meal_analyses(confidence_score)`,
};