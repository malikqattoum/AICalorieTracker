import { users, mealAnalyses, weeklyStats } from "@shared/schema";
import type { 
  User, InsertUser, 
  MealAnalysis, InsertMealAnalysis,
  WeeklyStats, InsertWeeklyStats
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { 
    stripeCustomerId?: string; 
    stripeSubscriptionId?: string;
    subscriptionType?: string;
    subscriptionStatus?: string;
    subscriptionEndDate?: Date;
    isPremium?: boolean;
  }): Promise<User>;
  
  // Meal analysis methods
  getMealAnalyses(userId: number): Promise<MealAnalysis[]>;
  getMealAnalysis(id: number): Promise<MealAnalysis | undefined>;
  createMealAnalysis(analysis: InsertMealAnalysis): Promise<MealAnalysis>;
  
  // Weekly stats methods
  getWeeklyStats(userId: number): Promise<WeeklyStats | undefined>;
  createOrUpdateWeeklyStats(stats: InsertWeeklyStats): Promise<WeeklyStats>;
  
<<<<<<< HEAD
  // Site content methods
  getSiteContent(key: string): Promise<string | null>;
  updateSiteContent(key: string, value: string): Promise<void>;
  
=======
>>>>>>> db9e70035f39db7b7eeaaabe359d725529551547
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mealAnalyses: Map<number, MealAnalysis>;
  private weeklyStats: Map<number, WeeklyStats>;
  private userIdCounter: number;
  private mealIdCounter: number;
  private statsIdCounter: number;
<<<<<<< HEAD
  private siteContent: Map<string, string>;
=======
>>>>>>> db9e70035f39db7b7eeaaabe359d725529551547
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.mealAnalyses = new Map();
    this.weeklyStats = new Map();
<<<<<<< HEAD
    this.siteContent = new Map();
=======
>>>>>>> db9e70035f39db7b7eeaaabe359d725529551547
    this.userIdCounter = 1;
    this.mealIdCounter = 1;
    this.statsIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Create user with default values for Stripe fields
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionType: null,
      subscriptionStatus: null,
      subscriptionEndDate: null,
      isPremium: false
    };
    this.users.set(id, user);
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
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      ...stripeInfo
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Meal analysis methods
  async getMealAnalyses(userId: number): Promise<MealAnalysis[]> {
    return Array.from(this.mealAnalyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getMealAnalysis(id: number): Promise<MealAnalysis | undefined> {
    return this.mealAnalyses.get(id);
  }

  async createMealAnalysis(insertAnalysis: InsertMealAnalysis): Promise<MealAnalysis> {
    const id = this.mealIdCounter++;
    const timestamp = new Date();
    const analysis: MealAnalysis = { ...insertAnalysis, id, timestamp };
    this.mealAnalyses.set(id, analysis);
    
    // Update weekly stats after adding a meal analysis
    await this.updateWeeklyStats(analysis.userId);
    
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
      new Date(meal.timestamp) >= startOfWeek
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
      const mealDay = dayNames[new Date(meal.timestamp).getDay()];
      caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + meal.calories;
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
    
    const stats: InsertWeeklyStats = {
      userId,
      averageCalories,
      mealsTracked: weekMeals.length,
      averageProtein,
      healthiestDay,
      weekStarting: startOfWeek,
      caloriesByDay
    };
    
    if (existingStats) {
      this.weeklyStats.set(existingStats.id, {
        ...stats,
        id: existingStats.id
      });
    } else {
      const id = this.statsIdCounter++;
      this.weeklyStats.set(id, {
        ...stats,
        id
      });
    }
  }

  // Weekly stats methods
  async getWeeklyStats(userId: number): Promise<WeeklyStats | undefined> {
    return Array.from(this.weeklyStats.values()).find(
      stats => stats.userId === userId
    );
  }

  async createOrUpdateWeeklyStats(insertStats: InsertWeeklyStats): Promise<WeeklyStats> {
    const existingStats = await this.getWeeklyStats(insertStats.userId);
    
    if (existingStats) {
      const updatedStats: WeeklyStats = { ...insertStats, id: existingStats.id };
      this.weeklyStats.set(existingStats.id, updatedStats);
      return updatedStats;
    } else {
      const id = this.statsIdCounter++;
      const stats: WeeklyStats = { ...insertStats, id };
      this.weeklyStats.set(id, stats);
      return stats;
    }
  }
<<<<<<< HEAD

  // Site content methods
  async getSiteContent(key: string): Promise<string | null> {
    return this.siteContent.get(key) || null;
  }

  async updateSiteContent(key: string, value: string): Promise<void> {
    this.siteContent.set(key, value);
  }
=======
>>>>>>> db9e70035f39db7b7eeaaabe359d725529551547
}

// Storage is now provided by storage-provider.ts
