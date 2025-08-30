import { z } from 'zod';
import { importedRecipes } from '../server/src/db/schemas/importedRecipes';

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  password?: string; // Optional for responses but required for creation
  referredBy: number | null;
  referralCode: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionType: string | null;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | null;
  isPremium: boolean | null;
  nutritionGoals: NutritionGoals | null;
  role: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  activityLevel: string | null;
  primaryGoal: string | null;
  targetWeight: number | null;
  timeline: string | null;
  dietaryPreferences: any | null;
  allergies: any | null;
  aiMealSuggestions: boolean | null;
  aiChatAssistantName: string | null;
  notificationsEnabled: boolean | null;
  onboardingCompleted: boolean | null;
  onboardingCompletedAt: Date | null;
  dailyCalorieTarget: number | null;
  proteinTarget: string | null;
  carbsTarget: string | null;
  fatTarget: string | null;
  measurementSystem: string | null;
  profileImageUrl: string | null;
  emailVerified: boolean | null;
  emailVerificationToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
  lastLoginAt: Date | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface InsertUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface MealAnalysis {
  id: number;
  userId: number;
  mealId: number;
  foodName: string;
  confidenceScore: string | null;
  analysisDetails: unknown;
  aiInsights: string | null;
  suggestedPortionSize: string | null;
  estimatedCalories: number | null;
  estimatedProtein: string | null;
  estimatedCarbs: string | null;
  estimatedFat: string | null;
  imageUrl: string | null;
  imageHash: string | null;
  analysisTimestamp: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface InsertMealAnalysis {
  userId: number;
  mealId: number;
  foodName: string;
  confidenceScore?: string;
  analysisDetails?: unknown;
  aiInsights?: string;
  suggestedPortionSize?: string;
  estimatedCalories?: number;
  estimatedProtein?: string;
  estimatedCarbs?: string;
  estimatedFat?: string;
  imageUrl?: string;
  imageHash?: string;
  analysisTimestamp?: Date;
}

export interface WeeklyStats {
  id: number;
  userId: number;
  averageCalories: number;
  mealsTracked: number;
  averageProtein: number;
  healthiestDay: string;
  weekStarting: Date;
  caloriesByDay: Record<string, number>;
  macrosByDay?: Record<string, { protein: number; carbs: number; fat: number }>;
}

export interface InsertWeeklyStats {
  userId: number;
  averageCalories: number;
  mealsTracked: number;
  averageProtein: number;
  healthiestDay: string;
  weekStarting: Date;
  caloriesByDay: Record<string, number>;
  macrosByDay?: Record<string, { protein: number; carbs: number; fat: number }>;
}


export interface SiteContent {
  id: number;
  key: string;
  value: string;
}

export interface AIConfig {
  id: number;
  provider: string;
  apiKeyEncrypted: string | null;
  modelName: string | null;
  promptTemplate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export database table schemas from server-specific files
// Note: This is a workaround for the schema organization issue
export * from '../server/src/db/schemas/users';
export * from '../server/src/db/schemas/mealAnalyses';
export * from '../server/src/db/schemas/weeklyStats';
export * from '../server/src/db/schemas/siteContent';
export * from '../server/src/db/schemas/nutritionGoals';
export * from '../server/src/db/schemas/aiConfig';
export * from '../server/src/db/schemas/appConfig';
export * from '../server/src/db/schemas/languages';
export * from '../server/src/db/schemas/plannedMeals';
export * from '../server/src/db/schemas/importedRecipes';
export * from '../server/src/db/schemas/referralSettings';
export * from '../server/src/db/schemas/referralCommissions';

// Type definitions for imported recipes
export type ImportedRecipe = typeof importedRecipes.$inferSelect;
export type InsertImportedRecipe = typeof importedRecipes.$inferInsert;

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const insertMealAnalysisSchema = z.object({
  userId: z.number(),
  foodName: z.string().min(1, "Food name is required"),
  estimatedCalories: z.number().min(0, "Calories must be positive"),
  estimatedProtein: z.string().min(0, "Protein must be positive"),
  estimatedCarbs: z.string().min(0, "Carbs must be positive"),
  estimatedFat: z.string().min(0, "Fat must be positive"),
  fiber: z.number().min(0, "Fiber must be positive").optional(),
  imageData: z.string().optional(),
  metadata: z.string().optional(),
});