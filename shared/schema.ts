import { mysqlTable, varchar, int, boolean, datetime, text, json, decimal } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface MealAnalysisInput {
  userId: number;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  imageData: string;
  metadata?: string;
}


// Users table schema
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  referredBy: int("referred_by"),
  referralCode: varchar("referral_code", { length: 255 }).unique(),
  // Stripe related fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionType: varchar("subscription_type", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 255 }),
  subscriptionEndDate: datetime("subscription_end_date"),
  isPremium: boolean("is_premium").default(false),
  nutritionGoals: json("nutrition_goals"),
  role: text("role").notNull().default('user'), // Add role field
  // Onboarding fields
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  height: int("height"), // in cm
  weight: int("weight"), // in kg
  activityLevel: varchar("activity_level", { length: 50 }),
  primaryGoal: varchar("primary_goal", { length: 100 }),
  targetWeight: int("target_weight"), // in kg
  timeline: varchar("timeline", { length: 50 }),
  dietaryPreferences: json("dietary_preferences"),
  allergies: json("allergies"),
  aiMealSuggestions: boolean("ai_meal_suggestions").default(true),
  aiChatAssistantName: varchar("ai_chat_assistant_name", { length: 100 }),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingCompletedAt: datetime("onboarding_completed_at"),
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
  metadata: text("metadata"),
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
  caloriesBurned: int("calories_burned").default(0), // Add calories burned field
});

// Site content table for editable homepage, try-it, pricing content
export const siteContent = mysqlTable("site_content", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});

// App config table schema
export const appConfig = mysqlTable("app_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull().default('string'),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Planned meals schema
export const plannedMeals = mysqlTable("planned_meals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  date: datetime("date").notNull(),
  mealType: varchar("meal_type", { length: 50 }).notNull(),
  mealName: varchar("meal_name", { length: 255 }).notNull(),
  calories: int("calories").notNull().default(0),
  protein: int("protein").notNull().default(0),
  carbs: int("carbs").notNull().default(0),
  fat: int("fat").notNull().default(0),
  recipe: text("recipe"),
  notes: text("notes"),
});

// Additional tables that are referenced in server routes
export const nutritionGoals = mysqlTable("nutrition_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  calories: int("calories").notNull(),
  protein: int("protein").notNull(),
  carbs: int("carbs").notNull(),
  fat: int("fat").notNull(),
  dailyCalories: int("daily_calories"), // Add missing field
  weeklyWorkouts: int("weekly_workouts"),
  waterIntake: int("water_intake"),
  weight: int("weight"),
  bodyFatPercentage: int("body_fat_percentage"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const favoriteMeals = mysqlTable("favorite_meals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  mealName: varchar("meal_name", { length: 255 }).notNull(),
  mealId: int("meal_id"), // Add missing field
  mealType: varchar("meal_type", { length: 50 }), // Add missing field
  ingredients: json("ingredients"),
  nutrition: json("nutrition"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importedRecipes = mysqlTable("imported_recipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // Add missing userId field
  recipeName: varchar("recipe_name", { length: 255 }).notNull(),
  ingredients: json("ingredients"),
  instructions: text("instructions"),
  parsedNutrition: json("parsed_nutrition"),
  notes: text("notes"),
  sourceUrl: varchar("source_url", { length: 500 }),
  sourceImageUrl: varchar("source_image_url", { length: 500 }),
  rawImageData: text("raw_image_data"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const referralSettings = mysqlTable("referral_settings", {
  id: int("id").autoincrement().primaryKey(),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull().default(sql`10.00`),
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const referralCommissions = mysqlTable("referral_commissions", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrer_id").notNull().references(() => users.id),
  refereeId: int("referee_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default(sql`0.00`),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  isRecurring: boolean("is_recurring").notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  paidAt: datetime("paid_at"),
});

export const languages = mysqlTable("languages", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const translations = mysqlTable("translations", {
  id: int("id").autoincrement().primaryKey(),
  languageId: int("language_id").notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  isAutoTranslated: boolean("is_auto_translated").default(false), // Add missing field
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workouts = mysqlTable("workouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  duration: int("duration").notNull(), // in minutes
  caloriesBurned: int("calories_burned").notNull(),
  date: datetime("date").notNull(),
  notes: text("notes"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const wearableData = mysqlTable("wearable_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  deviceType: varchar("device_type", { length: 50 }).notNull(),
  steps: int("steps"),
  heartRate: int("heart_rate"),
  caloriesBurned: int("calories_burned"),
  sleepHours: int("sleep_hours"),
  date: datetime("date").notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiConfig = mysqlTable("ai_config", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull().default('openai'),
  apiKeyEncrypted: text("api_key_encrypted"),
  modelName: varchar("model_name", { length: 100 }).default('gpt-4-vision-preview'),
  temperature: int("temperature").default(70), // stored as int (70 = 0.7)
  maxTokens: int("max_tokens").default(1000),
  promptTemplate: text("prompt_template"),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
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

export const insertAppConfigSchema = createInsertSchema(appConfig).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPlannedMealSchema = createInsertSchema(plannedMeals).omit({ id: true, userId: true });

// Insert schemas for new tables
export const insertNutritionGoalsSchema = createInsertSchema(nutritionGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertImportedRecipeSchema = createInsertSchema(importedRecipes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLanguageSchema = createInsertSchema(languages).omit({ id: true, createdAt: true });
export const insertTranslationSchema = createInsertSchema(translations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMealAnalysis = z.infer<typeof insertMealAnalysisSchema>;
export type InsertWeeklyStats = z.infer<typeof insertWeeklyStatsSchema>;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type User = typeof users.$inferSelect & { role?: string };
export type MealAnalysis = typeof mealAnalyses.$inferSelect;
export type WeeklyStats = typeof weeklyStats.$inferSelect & {
  macrosByDay?: Record<string, { protein: number; carbs: number; fat: number }>;
};
export type AppConfig = typeof appConfig.$inferSelect;
export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type InsertPlannedMeal = z.infer<typeof insertPlannedMealSchema>;

// Types for new tables
export type NutritionGoals = typeof nutritionGoals.$inferSelect;
export type FavoriteMeal = typeof favoriteMeals.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type Translation = typeof translations.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WearableData = typeof wearableData.$inferSelect;
export type AIConfig = typeof aiConfig.$inferSelect;

// Nutrition Analysis Types
export interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  portionSize?: {
    estimatedWeight: number;
    referenceObject: string;
  };
  densityScore?: number;
}

export interface MultiFoodAnalysis {
  foods: NutritionData[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  densityAnalysis?: {
    caloriesPerGram: number;
    nutrientDensityScore: number;
  };
}

// Meal Plan types for AI meal planning
export interface ImportedRecipe {
  id: number;
  userId: number;
  recipeName: string;
  ingredients: any;
  instructions: string;
  parsedNutrition: any;
  notes?: string;
  sourceUrl?: string;
  sourceImageUrl?: string;
  rawImageData?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertImportedRecipe {
  userId: number;
  recipeName: string;
  ingredients: any;
  instructions: string;
  parsedNutrition: any;
  notes?: string;
  sourceUrl?: string;
  sourceImageUrl?: string;
  rawImageData?: string;
}