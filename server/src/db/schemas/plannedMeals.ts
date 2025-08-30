import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, json, text, mysqlTable } from 'drizzle-orm/mysql-core';
import { z } from 'zod';

// Planned Meals Table
export const plannedMeals = mysqlTable('planned_meals', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  date: timestamp('date').notNull(),
  mealType: varchar('meal_type', { length: 50 }).notNull(),
  mealName: varchar('meal_name', { length: 255 }).notNull(),
  calories: int('calories').default(0),
  protein: int('protein').default(0),
  carbs: int('carbs').default(0),
  fat: int('fat').default(0),
  recipe: text('recipe'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type definitions
export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type InsertPlannedMeal = typeof plannedMeals.$inferInsert;

// Zod schema for validation
export const insertPlannedMealSchema = z.object({
  date: z.date(),
  mealType: z.string().min(1, "Meal type is required"),
  mealName: z.string().min(1, "Meal name is required"),
  calories: z.number().min(0, "Calories must be positive").default(0),
  protein: z.number().min(0, "Protein must be positive").default(0),
  carbs: z.number().min(0, "Carbs must be positive").default(0),
  fat: z.number().min(0, "Fat must be positive").default(0),
  recipe: z.string().optional(),
  notes: z.string().optional(),
});

// Create indexes for better performance
export const plannedMealsIndexes = {
  plannedMeals_userId: sql`CREATE INDEX IF NOT EXISTS planned_meals_user_id_idx ON planned_meals(user_id)`,
  plannedMeals_date: sql`CREATE INDEX IF NOT EXISTS planned_meals_date_idx ON planned_meals(date)`,
  plannedMeals_mealType: sql`CREATE INDEX IF NOT EXISTS planned_meals_meal_type_idx ON planned_meals(meal_type)`,
  plannedMeals_userDate: sql`CREATE INDEX IF NOT EXISTS planned_meals_user_date_idx ON planned_meals(user_id, date)`,
};