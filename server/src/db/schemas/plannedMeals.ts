import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, json, text, mysqlTable } from 'drizzle-orm/mysql-core';

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

// Create indexes for better performance
export const plannedMealsIndexes = {
  plannedMeals_userId: sql`CREATE INDEX IF NOT EXISTS planned_meals_user_id_idx ON planned_meals(user_id)`,
  plannedMeals_date: sql`CREATE INDEX IF NOT EXISTS planned_meals_date_idx ON planned_meals(date)`,
  plannedMeals_mealType: sql`CREATE INDEX IF NOT EXISTS planned_meals_meal_type_idx ON planned_meals(meal_type)`,
  plannedMeals_userDate: sql`CREATE INDEX IF NOT EXISTS planned_meals_user_date_idx ON planned_meals(user_id, date)`,
};