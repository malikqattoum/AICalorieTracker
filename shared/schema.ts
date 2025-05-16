import { mysqlTable, varchar, int, boolean, datetime, text, json } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  // Stripe related fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionType: varchar("subscription_type", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 255 }),
  subscriptionEndDate: datetime("subscription_end_date"),
  isPremium: boolean("is_premium").default(false),
  nutritionGoals: json("nutrition_goals"),
});

// Meal analysis schema
export const mealAnalyses = mysqlTable("meal_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  foodName: varchar("food_name", { length: 255 }).notNull(),
  calories: int("calories").notNull(),
  protein: int("protein").notNull(),
  carbs: int("carbs").notNull(),
  fat: int("fat").notNull(),
  fiber: int("fiber").notNull(),
  imageData: text("image_data").notNull(),
  timestamp: datetime("timestamp").notNull(),
});

// Weekly stats schema
export const weeklyStats = mysqlTable("weekly_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  averageCalories: int("average_calories").notNull(),
  mealsTracked: int("meals_tracked").notNull(),
  averageProtein: int("average_protein").notNull(),
  healthiestDay: varchar("healthiest_day", { length: 255 }).notNull(),
  weekStarting: datetime("week_starting").notNull(),
  caloriesByDay: json("calories_by_day").notNull(),
  macrosByDay: json("macros_by_day"), // NEW: per-day macro data
});

// Site content table for editable homepage, try-it, pricing content
export const siteContent = mysqlTable("site_content", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
});

export const insertMealAnalysisSchema = createInsertSchema(mealAnalyses).omit({
  id: true,
  timestamp: true,
});

export const insertWeeklyStatsSchema = createInsertSchema(weeklyStats).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMealAnalysis = z.infer<typeof insertMealAnalysisSchema>;
export type InsertWeeklyStats = z.infer<typeof insertWeeklyStatsSchema>;

export type User = typeof users.$inferSelect;
export type MealAnalysis = typeof mealAnalyses.$inferSelect;
export type WeeklyStats = typeof weeklyStats.$inferSelect & {
  macrosByDay?: Record<string, { protein: number; carbs: number; fat: number }>;
};
