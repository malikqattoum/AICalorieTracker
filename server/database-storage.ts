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
    console.log('=== [DATABASE STORAGE] INITIALIZING ===');
    console.log('[DATABASE STORAGE] DB_HOST:', process.env.DB_HOST || 'localhost');
    console.log('[DATABASE STORAGE] DB_USER:', process.env.DB_USER || 'root');
    console.log('[DATABASE STORAGE] DB_NAME:', process.env.DB_NAME || 'calorie_tracker');
    console.log('[DATABASE STORAGE] DB_PORT:', process.env.DB_PORT || '3306');
    
    this.db = db; // Expose db instance for admin routes
    
    // Test database connection
    this.testConnection().catch(err => {
      console.error('[DATABASE STORAGE] Connection test failed:', err);
    });
    
    // Use express-mysql-session for MySQL/MariaDB
    const options = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'calorie_tracker',
    };
    console.log('[DATABASE STORAGE] Session store options:', { host: options.host, database: options.database });
    
    // For ESM: MySQLStore is a function, not a class, so call it with session to get the constructor
    const MySQLStore = (MySQLStoreImport as any).default ? (MySQLStoreImport as any).default : MySQLStoreImport;
    const MySQLStoreConstructor = MySQLStore(session);
    this.sessionStore = new MySQLStoreConstructor(options);
    
    console.log('=== [DATABASE STORAGE] INITIALIZATION COMPLETE ===');
  }

  async testConnection(): Promise<void> {
    try {
      console.log('[DATABASE STORAGE] Testing connection...');
      const [result] = await db.select().from(users).limit(1);
      console.log('[DATABASE STORAGE] Connection test successful');
    } catch (error) {
      console.error('[DATABASE STORAGE] Connection test failed:', error);
      throw error;
    }
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log('=== [DATABASE STORAGE] CREATE USER ===');
    console.log('[DATABASE STORAGE] Input data:', {
      username: insertUser.username,
      email: insertUser.email,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      password: '***'
    });
    
    try {
      // Insert user and get the insert id
      const userData = {
        ...insertUser,
        email: insertUser.email || null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionType: null,
        subscriptionStatus: null,
        subscriptionEndDate: null,
        isPremium: false,
        nutritionGoals: null // Ensure JSON column is set to null if not provided
      };
      
      console.log('[DATABASE STORAGE] Inserting user with data:', userData);
      
      const result = await db.insert(users).values(userData);
      console.log('[DATABASE STORAGE] Insert result:', result);
      
      // @ts-ignore drizzle-orm/mysql2 returns insertId
      const insertId = result.insertId || result[0]?.insertId;
      console.log('[DATABASE STORAGE] Insert ID:', insertId);
      
      if (!insertId) {
        console.error('[DATABASE STORAGE] Failed to get inserted user id');
        throw new Error('Failed to get inserted user id');
      }
      
      console.log('[DATABASE STORAGE] Fetching created user...');
      const [user] = await db.select().from(users).where(eq(users.id, insertId));
      if (!user) {
        console.error('[DATABASE STORAGE] Failed to fetch inserted user');
        throw new Error('Failed to fetch inserted user');
      }
      
      console.log('[DATABASE STORAGE] User created successfully:', { id: user.id, username: user.username });
      return user;
    } catch (error) {
      console.error('[DATABASE STORAGE] Error creating user:', error);
      console.error('[DATABASE STORAGE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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
      .orderBy(mealAnalyses.analysisTimestamp);
    
    return analyses;
  }


  async createMealAnalysis(insertAnalysis: InsertMealAnalysis & { analysisDetails?: unknown }): Promise<MealAnalysis> {
    // Convert numeric fields to strings for decimal columns
    const dbReadyAnalysis = {
      ...insertAnalysis,
      estimatedProtein: insertAnalysis.estimatedProtein?.toString(),
      estimatedCarbs: insertAnalysis.estimatedCarbs?.toString(),
      estimatedFat: insertAnalysis.estimatedFat?.toString()
    };

    // Encrypt PHI fields if HIPAA compliance is enabled
    const encryptedAnalysis = HIPAA_COMPLIANCE_ENABLED ? {
      ...dbReadyAnalysis,
      foodName: encryptPHI(dbReadyAnalysis.foodName),
      imageUrl: dbReadyAnalysis.imageUrl ? encryptPHI(dbReadyAnalysis.imageUrl) : null,
      analysisDetails: dbReadyAnalysis.analysisDetails ? encryptPHI(JSON.stringify(dbReadyAnalysis.analysisDetails)) : null
    } : dbReadyAnalysis;

    // Ensure timestamp is provided for MySQL (MariaDB) compatibility
    const now = new Date();
    const result = await db.insert(mealAnalyses)
      .values({ ...encryptedAnalysis, analysisTimestamp: now });
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
      imageUrl: analysis.imageUrl ? decryptPHI(analysis.imageUrl) : null,
      analysisDetails: analysis.analysisDetails ? decryptPHI(typeof analysis.analysisDetails === 'string' ? analysis.analysisDetails : JSON.stringify(analysis.analysisDetails)) : undefined
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
      meal.analysisTimestamp && new Date(meal.analysisTimestamp) >= startOfWeek
    );
    
    if (weekMeals.length === 0) return;
    
    // Calculate stats
    const totalCalories = weekMeals.reduce((sum, meal) => {
      return sum + (meal.estimatedCalories ? meal.estimatedCalories : 0);
    }, 0);
    
    const totalProtein = weekMeals.reduce((sum, meal) => {
      return sum + (meal.estimatedProtein ? parseFloat(meal.estimatedProtein) : 0);
    }, 0);
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
      if (meal.analysisTimestamp) {
        const mealDay = dayNames[new Date(meal.analysisTimestamp).getDay()];
        const calories = meal.estimatedCalories ? meal.estimatedCalories : 0;
        const protein = meal.estimatedProtein ? parseFloat(meal.estimatedProtein) : 0;
        const carbs = meal.estimatedCarbs ? parseFloat(meal.estimatedCarbs) : 0;
        const fat = meal.estimatedFat ? parseFloat(meal.estimatedFat) : 0;
        
        caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + calories;
        macrosByDay[mealDay].protein += protein;
        macrosByDay[mealDay].carbs += carbs;
        macrosByDay[mealDay].fat += fat;
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

  // Helper method to create default weekly stats for new users
  private async createDefaultWeeklyStats(userId: number): Promise<any> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const defaultStats = {
      userId,
      averageCalories: 0,
      mealsTracked: 0,
      averageProtein: 0,
      healthiestDay: 'Sunday',
      weekStarting: startOfWeek,
      caloriesByDay: {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0
      },
      macrosByDay: {
        Sunday: { protein: 0, carbs: 0, fat: 0 },
        Monday: { protein: 0, carbs: 0, fat: 0 },
        Tuesday: { protein: 0, carbs: 0, fat: 0 },
        Wednesday: { protein: 0, carbs: 0, fat: 0 },
        Thursday: { protein: 0, carbs: 0, fat: 0 },
        Friday: { protein: 0, carbs: 0, fat: 0 },
        Saturday: { protein: 0, carbs: 0, fat: 0 }
      }
    };

    const result = await db.insert(weeklyStats).values(defaultStats);
    // @ts-ignore drizzle-orm/mysql2 returns insertId
    const insertId = result.insertId || result[0]?.insertId;
    if (!insertId) throw new Error('Failed to get inserted weekly stats id');

    const [stats] = await db.select().from(weeklyStats).where(eq(weeklyStats.id, insertId));
    return stats;
  }

  // Weekly stats methods
  async getWeeklyStats(userId: number, medicalCondition?: string): Promise<WeeklyStats | undefined> {
    let [stats] = await db.select()
      .from(weeklyStats)
      .where(eq(weeklyStats.userId, userId));

    // If no stats exist, create default stats
    if (!stats) {
      console.log(`[DATABASE STORAGE] No weekly stats found for user ${userId}, creating default stats`);
      const defaultStats = await this.createDefaultWeeklyStats(userId);
      stats = defaultStats;
    }

    // Parse JSON fields to correct types
    const parsedStats = {
      ...stats,
      caloriesByDay: typeof stats.caloriesByDay === 'string' ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
      macrosByDay: stats.macrosByDay ? (typeof stats.macrosByDay === 'string' ? JSON.parse(stats.macrosByDay) : stats.macrosByDay) : undefined
    };

    // If medicalCondition is set, adjust stats here
    if (medicalCondition && medicalCondition !== 'none') {
      // Apply medical condition adjustments
      const adjustedStats = this.applyMedicalConditionAdjustments(parsedStats, medicalCondition);
      return adjustedStats;
    }

    // Ensure macrosByDay is always present and correct type
    return {
      ...parsedStats,
      macrosByDay: parsedStats.macrosByDay || {
        Sunday: { protein: 0, carbs: 0, fat: 0 },
        Monday: { protein: 0, carbs: 0, fat: 0 },
        Tuesday: { protein: 0, carbs: 0, fat: 0 },
        Wednesday: { protein: 0, carbs: 0, fat: 0 },
        Thursday: { protein: 0, carbs: 0, fat: 0 },
        Friday: { protein: 0, carbs: 0, fat: 0 },
        Saturday: { protein: 0, carbs: 0, fat: 0 }
      }
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
    try {
      console.log(`[DB STORAGE] Attempting to get site content for key: ${key}`);
      console.log(`[DB STORAGE] Database connection status:`, this.db ? 'connected' : 'not connected');
      
      const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key));
      console.log(`[DB STORAGE] Query result for key ${key}:`, row ? 'found' : 'not found');
      
      return row ? row.value : null;
    } catch (error) {
      console.error(`[DB STORAGE] Error getting site content for key ${key}:`, error);
      console.error(`[DB STORAGE] Error stack:`, error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
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

  /**
   * Apply medical condition adjustments to stats
   */
  private applyMedicalConditionAdjustments(stats: WeeklyStats, medicalCondition: string): WeeklyStats {
    const adjustedStats = { ...stats };

    switch (medicalCondition.toLowerCase()) {
      case 'diabetes':
        // Adjust for diabetic needs - lower carbs, higher protein
        adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.9);
        adjustedStats.averageProtein = Math.round(stats.averageProtein * 1.2);
        break;

      case 'hypertension':
        // Adjust for hypertension - lower sodium, heart-healthy fats
        adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.85);
        break;

      case 'heart_disease':
        // Adjust for heart disease - very low sodium, healthy fats
        adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.8);
        break;

      case 'obesity':
        // Adjust for weight loss - lower calories
        adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.8);
        break;

      default:
        // Default adjustments for general health
        break;
    }

    return adjustedStats;
  }
}