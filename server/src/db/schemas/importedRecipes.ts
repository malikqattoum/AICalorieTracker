import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, json, text, mysqlTable } from 'drizzle-orm/mysql-core';

// Imported Recipes Table
export const importedRecipes = mysqlTable('imported_recipes', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  recipeName: varchar('recipe_name', { length: 255 }).notNull(),
  ingredients: json('ingredients'),
  instructions: text('instructions'),
  parsedNutrition: json('parsed_nutrition'),
  notes: text('notes'),
  sourceUrl: varchar('source_url', { length: 500 }),
  sourceImageUrl: varchar('source_image_url', { length: 500 }),
  rawImageData: text('raw_image_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const importedRecipesIndexes = {
  importedRecipes_userId: sql`CREATE INDEX IF NOT EXISTS imported_recipes_user_id_idx ON imported_recipes(user_id)`,
  importedRecipes_recipeName: sql`CREATE INDEX IF NOT EXISTS imported_recipes_recipe_name_idx ON imported_recipes(recipe_name)`,
  importedRecipes_sourceUrl: sql`CREATE INDEX IF NOT EXISTS imported_recipes_source_url_idx ON imported_recipes(source_url)`,
  importedRecipes_createdAt: sql`CREATE INDEX IF NOT EXISTS imported_recipes_created_at_idx ON imported_recipes(created_at)`,
};