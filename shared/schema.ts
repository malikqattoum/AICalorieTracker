import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  // Stripe related fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionType: text("subscription_type"),
  subscriptionStatus: text("subscription_status"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  isPremium: boolean("is_premium").default(false),
});

// Meal analysis schema
export const mealAnalyses = pgTable("meal_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
  fiber: integer("fiber").notNull(),
  imageData: text("image_data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Weekly stats schema
export const weeklyStats = pgTable("weekly_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  averageCalories: integer("average_calories").notNull(),
  mealsTracked: integer("meals_tracked").notNull(),
  averageProtein: integer("average_protein").notNull(),
  healthiestDay: text("healthiest_day").notNull(),
  weekStarting: timestamp("week_starting").notNull(),
  caloriesByDay: json("calories_by_day").notNull(),
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
export type WeeklyStats = typeof weeklyStats.$inferSelect;
export interface MealPlan {
  id: number;
  userId: number;
  goal: string;
  weeklyCalories: number;
  weeklyProtein: number;
  weeklyCarbs: number;
  weeklyFat: number;
  meals: DailyMeals[];
  createdAt: Date;
}

export interface DailyMeals {
  day: string;
  breakfast: MealInfo;
  lunch: MealInfo;
  dinner: MealInfo;
  snacks: MealInfo[];
}

export interface MealInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
}
