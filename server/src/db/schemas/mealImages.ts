import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, mysqlTable } from 'drizzle-orm/mysql-core';

// Meal Images Table
export const mealImages = mysqlTable('meal_images', {
  id: int('id').primaryKey().autoincrement(),
  mealAnalysisId: int('meal_analysis_id').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: int('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  width: int('width'),
  height: int('height'),
  imageHash: varchar('image_hash', { length: 64 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Meal Image Archive Table
export const mealImageArchive = mysqlTable('meal_image_archive', {
  id: int('id').primaryKey().autoincrement(),
  mealAnalysisId: int('meal_analysis_id').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: int('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  archivedAt: timestamp('archived_at').defaultNow(),
});

// Create indexes for better performance
export const mealImagesIndexes = {
  mealImages_mealAnalysisId: sql`CREATE INDEX IF NOT EXISTS meal_images_meal_analysis_id_idx ON meal_images(meal_analysis_id)`,
  mealImages_imageHash: sql`CREATE INDEX IF NOT EXISTS meal_images_image_hash_idx ON meal_images(image_hash)`,
  mealImages_createdAt: sql`CREATE INDEX IF NOT EXISTS meal_images_created_at_idx ON meal_images(created_at)`,
  mealImages_updatedAt: sql`CREATE INDEX IF NOT EXISTS meal_images_updated_at_idx ON meal_images(updated_at)`,
  mealImages_deletedAt: sql`CREATE INDEX IF NOT EXISTS meal_images_deleted_at_idx ON meal_images(deleted_at)`,
  mealImageArchive_mealAnalysisId: sql`CREATE INDEX IF NOT EXISTS meal_image_archive_meal_analysis_id_idx ON meal_image_archive(meal_analysis_id)`,
  mealImageArchive_archivedAt: sql`CREATE INDEX IF NOT EXISTS meal_image_archive_archived_at_idx ON meal_image_archive(archived_at)`,
};