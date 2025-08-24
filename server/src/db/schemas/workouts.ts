import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, decimal, text, mysqlTable } from 'drizzle-orm/mysql-core';

// Workouts Table
export const workouts = mysqlTable('workouts', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  duration: int('duration').notNull(),
  caloriesBurned: int('calories_burned').notNull(),
  date: timestamp('date').defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const workoutsIndexes = {
  workouts_userId: sql`CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id)`,
  workouts_date: sql`CREATE INDEX IF NOT EXISTS workouts_date_idx ON workouts(date)`,
  workouts_duration: sql`CREATE INDEX IF NOT EXISTS workouts_duration_idx ON workouts(duration)`,
  workouts_caloriesBurned: sql`CREATE INDEX IF NOT EXISTS workouts_calories_burned_idx ON workouts(calories_burned)`,
};