import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, decimal, json, mysqlTable } from 'drizzle-orm/mysql-core';

// Nutrition Goals Table
export const nutritionGoals = mysqlTable('nutrition_goals', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  calories: int('calories').notNull(),
  protein: int('protein').notNull(),
  carbs: int('carbs').notNull(),
  fat: int('fat').notNull(),
  dailyCalories: int('daily_calories'),
  weeklyWorkouts: int('weekly_workouts'),
  waterIntake: int('water_intake'),
  weight: int('weight'),
  bodyFatPercentage: int('body_fat_percentage'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const nutritionGoalsIndexes = {
  nutritionGoals_userId: sql`CREATE INDEX IF NOT EXISTS nutrition_goals_user_id_idx ON nutrition_goals(user_id)`,
  nutritionGoals_calories: sql`CREATE INDEX IF NOT EXISTS nutrition_goals_calories_idx ON nutrition_goals(calories)`,
  nutritionGoals_protein: sql`CREATE INDEX IF NOT EXISTS nutrition_goals_protein_idx ON nutrition_goals(protein)`,
  nutritionGoals_carbs: sql`CREATE INDEX IF NOT EXISTS nutrition_goals_carbs_idx ON nutrition_goals(carbs)`,
  nutritionGoals_fat: sql`CREATE INDEX IF NOT EXISTS nutrition_goals_fat_idx ON nutrition_goals(fat)`,
};