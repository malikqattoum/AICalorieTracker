import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, json, mysqlTable } from 'drizzle-orm/mysql-core';

// Weekly Stats Table
export const weeklyStats = mysqlTable('weekly_stats', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  averageCalories: int('average_calories').notNull(),
  mealsTracked: int('meals_tracked').notNull(),
  averageProtein: int('average_protein').notNull(),
  healthiestDay: varchar('healthiest_day', { length: 255 }).notNull(),
  weekStarting: timestamp('week_starting').notNull(),
  caloriesByDay: json('calories_by_day').notNull(),
  macrosByDay: json('macros_by_day'),
  caloriesBurned: int('calories_burned').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const weeklyStatsIndexes = {
  weeklyStats_userId: sql`CREATE INDEX IF NOT EXISTS weekly_stats_user_id_idx ON weekly_stats(user_id)`,
  weeklyStats_weekStarting: sql`CREATE INDEX IF NOT EXISTS weekly_stats_week_starting_idx ON weekly_stats(week_starting)`,
  weeklyStats_averageCalories: sql`CREATE INDEX IF NOT EXISTS weekly_stats_average_calories_idx ON weekly_stats(average_calories)`,
  weeklyStats_mealsTracked: sql`CREATE INDEX IF NOT EXISTS weekly_stats_meals_tracked_idx ON weekly_stats(meals_tracked)`,
};