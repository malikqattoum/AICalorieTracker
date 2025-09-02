import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, longtext, decimal, mysqlTable } from 'drizzle-orm/mysql-core';

// Users Table
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  referredBy: int('referred_by'),
  referralCode: varchar('referral_code', { length: 255 }).unique(),
  // Stripe related fields
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionType: varchar('subscription_type', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 255 }),
  subscriptionEndDate: timestamp('subscription_end_date'),
  isPremium: boolean('is_premium').default(false),
  nutritionGoals: longtext('nutrition_goals'),
  role: varchar('role', { length: 50 }).default('user'),
  // Onboarding fields
  age: int('age'),
  gender: varchar('gender', { length: 20 }),
  height: int('height'), // in cm
  weight: int('weight'), // in kg
  activityLevel: varchar('activity_level', { length: 50 }),
  primaryGoal: varchar('primary_goal', { length: 100 }),
  targetWeight: int('target_weight'), // in kg
  timeline: varchar('timeline', { length: 50 }),
  dietaryPreferences: longtext('dietary_preferences'),
  allergies: longtext('allergies'),
  aiMealSuggestions: boolean('ai_meal_suggestions').default(true),
  aiChatAssistantName: varchar('ai_chat_assistant_name', { length: 100 }),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  // Core user fields
  dailyCalorieTarget: int('daily_calorie_target').default(2000),
  proteinTarget: decimal('protein_target', { precision: 5, scale: 2 }).default(sql`150.00`),
  carbsTarget: decimal('carbs_target', { precision: 5, scale: 2 }).default(sql`250.00`),
  fatTarget: decimal('fat_target', { precision: 5, scale: 2 }).default(sql`67.00`),
  measurementSystem: varchar('measurement_system', { length: 10 }).default('metric'),
  profileImageUrl: varchar('profile_image_url', { length: 500 }),
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordExpiresAt: timestamp('reset_password_expires_at'),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Preferences Table
export const userPreferences = mysqlTable('user_preferences', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  theme: varchar('theme', { length: 20 }).default('light'),
  language: varchar('language', { length: 10 }).default('en'),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  emailNotifications: boolean('email_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(true),
  measurementSystem: varchar('measurement_system', { length: 10 }).default('metric'),
  dietaryRestrictions: longtext('dietary_restrictions'),
  allergies: longtext('allergies'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const usersIndexes = {
  users_username: sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username)`,
  users_email: sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`,
  users_stripeCustomerId: sql`CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id)`,
  users_isPremium: sql`CREATE INDEX IF NOT EXISTS users_is_premium_idx ON users(is_premium)`,
  users_role: sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role)`,
  users_isActive: sql`CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active)`,
  userPreferences_userId: sql`CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id)`,
};