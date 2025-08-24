import type { IStorage } from './storage';
import type {
  User, InsertUser,
  MealAnalysis, InsertMealAnalysis,
  WeeklyStats, InsertWeeklyStats,
  NutritionGoals
} from '@shared/schema';
import { users, mealAnalyses, weeklyStats, siteContent, nutritionGoals, aiConfig } from '@shared/schema';
import { db } from './db';
import { encryptPHI, decryptPHI } from './security';
import { eq, and } from 'drizzle-orm';
import session from 'express-session';
import { pool } from './db';
import MySQLStoreImport from 'express-mysql-session';
import { HIPAA_COMPLIANCE_ENABLED } from './config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create PostgreSQL session store
// const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  db: any;

  constructor() {
    this.db = db; // Expose db instance for admin routes
    
    // Use express-mysql-session for MySQL/MariaDB
    const options = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'calorie_tracker',
    };
    // For ESM: MySQLStore is a function, not a class, so call it with session to get the constructor
    const MySQLStore = (MySQLStoreImport as any).default ? (MySQLStoreImport as any).default : MySQLStoreImport;
    const MySQLStoreConstructor = MySQLStore(session);
    this.sessionStore = new MySQLStoreConstructor(options);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Insert user and get the insert id
    const result = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionType: null,
      subscriptionStatus: null,
      subscriptionEndDate: null,
      isPremium: false,
      nutritionGoals: null // Ensure JSON column is set to null if not provided
    });
    // @ts-ignore drizzle-orm/mysql2 returns insertId
    const insertId = result.insertId || result[0]?.insertId;
    if (!insertId) throw new Error('Failed to get inserted user id');
    const [user] = await db.select().from(users).where(eq(users.id, insertId));
    if (!user) throw new Error('Failed to fetch inserted user');
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { 
    stripeCustomerId?: string; 
    stripeSubscriptionId?: string;
    subscriptionType?: string;
    subscriptionStatus?: string;
    subscriptionEndDate?: Date;
    isPremium?: boolean;
  }): Promise<User> {
    await db.update(users)
      .set(stripeInfo)
      .where(eq(users.id, userId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getUserById(userId: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async updateUserNutritionGoals(userId: number, goals: { calories: number; protein: number; carbs: number; fat: number }): Promise<void> {
    await db.update(users)
      .set({ nutritionGoals: goals })
      .where(eq(users.id, userId));
  }

  async getNutritionGoals(userId: number): Promise<NutritionGoals | null> {
    const [user] = await db.select({ nutritionGoals: users.nutritionGoals })
      .from(users)
      .where(eq(users.id, userId));
    if (!user?.nutritionGoals) return null;
    return typeof user.nutritionGoals === 'string'
      ? JSON.parse(user.nutritionGoals) as NutritionGoals
      : user.nutritionGoals as NutritionGoals;
  }

  // Meal analysis methods
  async getMealAnalyses(userId: number): Promise<MealAnalysis[]> {
    const analyses = await db.select()
      .from(mealAnalyses)
      .where(eq(mealAnalyses.userId, userId))
      .orderBy(mealAnalyses.timestamp);
    
    return analyses;
  }


  async createMealAnalysis(insertAnalysis: InsertMealAnalysis & { metadata?: string }): Promise<MealAnalysis> {
    // Encrypt PHI fields if HIPAA compliance is enabled
    const encryptedAnalysis = HIPAA_COMPLIANCE_ENABLED ? {
      ...insertAnalysis,
      foodName: encryptPHI(insertAnalysis.foodName),
      imageData: insertAnalysis.imageData ? encryptPHI(insertAnalysis.imageData) : null,
      metadata: insertAnalysis.metadata ? encryptPHI(insertAnalysis.metadata) : undefined
    } : insertAnalysis;

    // Ensure timestamp is provided for MySQL (MariaDB) compatibility
    const now = new Date();
    const result = await db.insert(mealAnalyses)
      .values({ ...encryptedAnalysis, timestamp: now });
    // @ts-ignore drizzle-orm/mysql2 returns insertId
    const insertId = result.insertId || result[0]?.insertId;
    if (!insertId) throw new Error('Failed to get inserted meal analysis id');
    const [analysis] = await db.select().from(mealAnalyses).where(eq(mealAnalyses.id, insertId));
    // Update weekly stats after adding a meal analysis
    await this.updateWeeklyStats(insertAnalysis.userId);
    
    return analysis;
  }

  async getMealAnalysis(id: number): Promise<MealAnalysis | undefined> {
    const [analysis] = await db.select()
      .from(mealAnalyses)
      .where(eq(mealAnalyses.id, id));
    
    if (!analysis) return undefined;
    
    // Decrypt PHI fields if HIPAA compliance is enabled and they exist
    const decryptedAnalysis = HIPAA_COMPLIANCE_ENABLED ? {
      ...analysis,
      foodName: decryptPHI(analysis.foodName),
      imageData: analysis.imageData ? decryptPHI(analysis.imageData) : null,
      metadata: analysis.metadata ? decryptPHI(analysis.metadata) : undefined
    } : analysis;
    
    return decryptedAnalysis as MealAnalysis;
  }

  // Helper method to update weekly stats based on meal analyses
  private async updateWeeklyStats(userId: number): Promise<void> {
    const userMeals = await this.getMealAnalyses(userId);
    
    if (userMeals.length === 0) return;
    
    // Get meals from the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekMeals = userMeals.filter(meal => 
      meal.timestamp && new Date(meal.timestamp) >= startOfWeek
    );
    
    if (weekMeals.length === 0) return;
    
    // Calculate stats
    const totalCalories = weekMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = weekMeals.reduce((sum, meal) => sum + meal.protein, 0);
    const averageCalories = Math.round(totalCalories / weekMeals.length);
    const averageProtein = Math.round(totalProtein / weekMeals.length);
    
    // Calculate calories by day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const caloriesByDay: Record<string, number> = {};
    const macrosByDay: Record<string, { protein: number; carbs: number; fat: number }> = {};
    
    dayNames.forEach(day => {
      caloriesByDay[day] = 0;
      macrosByDay[day] = { protein: 0, carbs: 0, fat: 0 };
    });
    
    weekMeals.forEach(meal => {
      if (meal.timestamp) {
        const mealDay = dayNames[new Date(meal.timestamp).getDay()];
        caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + meal.calories;
        macrosByDay[mealDay].protein += meal.protein;
        macrosByDay[mealDay].carbs += meal.carbs;
        macrosByDay[mealDay].fat += meal.fat;
      }
    });
    
    // Determine healthiest day (lowest calories with at least one meal)
    let healthiestDay = dayNames[0];
    let lowestCalories = Number.MAX_VALUE;
    
    Object.entries(caloriesByDay).forEach(([day, calories]) => {
      if (calories > 0 && calories < lowestCalories) {
        healthiestDay = day;
        lowestCalories = calories;
      }
    });
    
    // Create or update weekly stats
    const existingStats = await this.getWeeklyStats(userId);
    
    if (existingStats) {
      await db.update(weeklyStats)
        .set({
          averageCalories,
          mealsTracked: weekMeals.length,
          averageProtein,
          healthiestDay,
          caloriesByDay,
          macrosByDay
        })
        .where(eq(weeklyStats.id, existingStats.id));
    } else {
      await db.insert(weeklyStats)
        .values({
          userId,
          averageCalories,
          mealsTracked: weekMeals.length,
          averageProtein,
          healthiestDay,
          weekStarting: startOfWeek,
          caloriesByDay,
          macrosByDay
        });
    }
  }

  // Weekly stats methods
  async getWeeklyStats(userId: number): Promise<WeeklyStats | undefined> {
    const [stats] = await db.select()
      .from(weeklyStats)
      .where(eq(weeklyStats.userId, userId));
    if (!stats) return undefined;
    // Parse JSON fields to correct types
    return {
      ...stats,
      caloriesByDay: typeof stats.caloriesByDay === 'string' ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
      macrosByDay: stats.macrosByDay ? (typeof stats.macrosByDay === 'string' ? JSON.parse(stats.macrosByDay) : stats.macrosByDay) : undefined
    };
  }

  // Ensure createOrUpdateWeeklyStats always returns a value
  async createOrUpdateWeeklyStats(insertStats: InsertWeeklyStats): Promise<WeeklyStats> {
    const existingStats = await this.getWeeklyStats(insertStats.userId);
    if (existingStats) {
      await db.update(weeklyStats)
        .set(insertStats)
        .where(eq(weeklyStats.id, existingStats.id));
      const [updatedStats] = await db.select().from(weeklyStats).where(eq(weeklyStats.id, existingStats.id));
      return {
        ...updatedStats,
        caloriesByDay: typeof updatedStats.caloriesByDay === 'string' ? JSON.parse(updatedStats.caloriesByDay) : updatedStats.caloriesByDay,
        macrosByDay: updatedStats.macrosByDay ? (typeof updatedStats.macrosByDay === 'string' ? JSON.parse(updatedStats.macrosByDay) : updatedStats.macrosByDay) : undefined
      };
    } else {
      const result = await db.insert(weeklyStats)
        .values(insertStats);
      // @ts-ignore drizzle-orm/mysql2 returns insertId
      const insertId = result.insertId || result[0]?.insertId;
      if (!insertId) throw new Error('Failed to get inserted weekly stats id');
      const [stats] = await db.select().from(weeklyStats).where(eq(weeklyStats.id, insertId));
      return {
        ...stats,
        caloriesByDay: typeof stats.caloriesByDay === 'string' ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
        macrosByDay: stats.macrosByDay ? (typeof stats.macrosByDay === 'string' ? JSON.parse(stats.macrosByDay) : stats.macrosByDay) : undefined
      };
    }
  }

  // --- Site Content Methods ---
  async getSiteContent(key: string): Promise<string | null> {
    const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key));
    return row ? row.value : null;
  }

  async updateSiteContent(key: string, value: string): Promise<void> {
    const [existing] = await db.select().from(siteContent).where(eq(siteContent.key, key));
    if (existing) {
      await db.update(siteContent).set({ value }).where(eq(siteContent.key, key));
    } else {
      await db.insert(siteContent).values({ key, value });
    }
  }

  // --- Onboarding Methods ---
  async updateUserOnboarding(userId: number, onboardingData: any): Promise<User> {
    await db.update(users)
      .set(onboardingData)
      .where(eq(users.id, userId));
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async createNutritionGoals(userId: number, goals: any): Promise<void> {
    await db.insert(nutritionGoals).values({
      userId,
      ...goals,
    });
  }

  // --- AI Config Methods ---
  async getAIConfigs(): Promise<any[]> {
    return await db.select().from(aiConfig).orderBy(aiConfig.provider);
  }

  async updateAIConfig(id: number, config: any): Promise<void> {
    await db.update(aiConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(aiConfig.id, id));
  }

  async deactivateAllAIConfigs(): Promise<void> {
    await db.update(aiConfig)
      .set({ isActive: false, updatedAt: new Date() });
  }
}