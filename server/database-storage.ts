import type { IStorage } from './storage';
import type { 
  User, InsertUser, 
  MealAnalysis, InsertMealAnalysis,
  WeeklyStats, InsertWeeklyStats
} from '@shared/schema';
import { users, mealAnalyses, weeklyStats } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { pool } from './db';

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
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
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionType: null,
      subscriptionStatus: null,
      subscriptionEndDate: null,
      isPremium: false
    }).returning();
    
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
    const [user] = await db.update(users)
      .set(stripeInfo)
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }

  // Meal analysis methods
  async getMealAnalyses(userId: number): Promise<MealAnalysis[]> {
    const analyses = await db.select()
      .from(mealAnalyses)
      .where(eq(mealAnalyses.userId, userId))
      .orderBy(mealAnalyses.timestamp);
    
    return analyses;
  }

  async getMealAnalysis(id: number): Promise<MealAnalysis | undefined> {
    const [analysis] = await db.select()
      .from(mealAnalyses)
      .where(eq(mealAnalyses.id, id));
    
    return analysis;
  }

  async createMealAnalysis(insertAnalysis: InsertMealAnalysis): Promise<MealAnalysis> {
    const [analysis] = await db.insert(mealAnalyses)
      .values(insertAnalysis)
      .returning();
    
    // Update weekly stats after adding a meal analysis
    await this.updateWeeklyStats(insertAnalysis.userId);
    
    return analysis;
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
    
    dayNames.forEach(day => {
      caloriesByDay[day] = 0;
    });
    
    weekMeals.forEach(meal => {
      if (meal.timestamp) {
        const mealDay = dayNames[new Date(meal.timestamp).getDay()];
        caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + meal.calories;
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
        });
    }
  }

  // Weekly stats methods
  async getWeeklyStats(userId: number): Promise<WeeklyStats | undefined> {
    const [stats] = await db.select()
      .from(weeklyStats)
      .where(eq(weeklyStats.userId, userId));
    
    return stats;
  }

  async createOrUpdateWeeklyStats(insertStats: InsertWeeklyStats): Promise<WeeklyStats> {
    const existingStats = await this.getWeeklyStats(insertStats.userId);
    
    if (existingStats) {
      const [updatedStats] = await db.update(weeklyStats)
        .set(insertStats)
        .where(eq(weeklyStats.id, existingStats.id))
        .returning();
      
      return updatedStats;
    } else {
      const [stats] = await db.insert(weeklyStats)
        .values(insertStats)
        .returning();
      
      return stats;
    }
  }
}