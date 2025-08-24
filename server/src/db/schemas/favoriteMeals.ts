import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, json, mysqlTable } from 'drizzle-orm/mysql-core';

// Favorite Meals Table
export const favoriteMeals = mysqlTable('favorite_meals', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  mealName: varchar('meal_name', { length: 255 }).notNull(),
  mealId: int('meal_id'),
  mealType: varchar('meal_type', { length: 50 }),
  ingredients: json('ingredients'),
  nutrition: json('nutrition'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const favoriteMealsIndexes = {
  favoriteMeals_userId: sql`CREATE INDEX IF NOT EXISTS favorite_meals_user_id_idx ON favorite_meals(user_id)`,
  favoriteMeals_mealId: sql`CREATE INDEX IF NOT EXISTS favorite_meals_meal_id_idx ON favorite_meals(meal_id)`,
  favoriteMeals_mealType: sql`CREATE INDEX IF NOT EXISTS favorite_meals_meal_type_idx ON favorite_meals(meal_type)`,
};