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
  getUserById(userId: number): Promise<any>;
  updateUserNutritionGoals(userId: number, goals: { calories: number; protein: number; carbs: number; fat: number }): Promise<void>;
  updateUserOnboarding(userId: number, onboardingData: any): Promise<User>;
  createNutritionGoals(userId: number, goals: any): Promise<void>;
  
  // Meal analysis methods
  getMealAnalyses(userId: number): Promise<MealAnalysis[]>;
  getMealAnalysis(id: number): Promise<MealAnalysis | undefined>;
  createMealAnalysis(analysis: InsertMealAnalysis): Promise<MealAnalysis>;
  
  // Weekly stats methods
  getWeeklyStats(userId: number, medicalCondition?: string): Promise<WeeklyStats | undefined>;
  createOrUpdateWeeklyStats(stats: InsertWeeklyStats): Promise<WeeklyStats>;
  
  // Site content methods
  getSiteContent(key: string): Promise<string | null>;
  updateSiteContent(key: string, value: string): Promise<void>;
  
  // AI config methods
  getAIConfigs(): Promise<any[]>;
  updateAIConfig(id: number, config: any): Promise<void>;
  deactivateAllAIConfigs(): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
  
  // Database access (for admin routes)
  db?: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mealAnalyses: Map<number, MealAnalysis>;
  private weeklyStats: Map<number, WeeklyStats>;
  private userIdCounter: number;
  private mealIdCounter: number;
  private statsIdCounter: number;
  private siteContent: Map<string, string>;
  sessionStore: session.Store;
  db?: any;

  constructor() {
    this.users = new Map();
    this.mealAnalyses = new Map();
    this.weeklyStats = new Map();
    this.siteContent = new Map();
    this.userIdCounter = 1;
    this.mealIdCounter = 1;
    this.statsIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    this.db = undefined; // Memory storage doesn't have direct DB access
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
    // Create user with default values for all required fields
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionType: null,
      subscriptionStatus: null,
      subscriptionEndDate: null,
      isPremium: false,
      nutritionGoals: null,
      role: 'user',
      // Onboarding fields with defaults
      age: null,
      gender: null,
      height: null,
      weight: null,
      activityLevel: null,
      primaryGoal: null,
      targetWeight: null,
      timeline: null,
      dietaryPreferences: null,
      allergies: null,
      aiMealSuggestions: true,
      aiChatAssistantName: null,
      notificationsEnabled: true,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
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

  async getUserById(userId: number): Promise<any> {
    return this.users.get(userId);
  }

  async updateUserNutritionGoals(userId: number, goals: { calories: number; protein: number; carbs: number; fat: number }): Promise<void> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Update user's nutrition goals
    user.nutritionGoals = {
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat
    };
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
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const weekMeals = userMeals.filter(meal => new Date(meal.timestamp) >= startOfWeek);
    if (weekMeals.length === 0) return;
    const totalCalories = weekMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = weekMeals.reduce((sum, meal) => sum + meal.protein, 0);
    const averageCalories = Math.round(totalCalories / weekMeals.length);
    const averageProtein = Math.round(totalProtein / weekMeals.length);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const caloriesByDay: Record<string, number> = {};
    const macrosByDay: Record<string, { protein: number; carbs: number; fat: number }> = {};
    dayNames.forEach(day => {
      caloriesByDay[day] = 0;
      macrosByDay[day] = { protein: 0, carbs: 0, fat: 0 };
    });
    weekMeals.forEach(meal => {
      const mealDay = dayNames[new Date(meal.timestamp).getDay()];
      caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + meal.calories;
      macrosByDay[mealDay].protein += meal.protein;
      macrosByDay[mealDay].carbs += meal.carbs;
      macrosByDay[mealDay].fat += meal.fat;
    });
    let healthiestDay = dayNames[0];
    let lowestCalories = Number.MAX_VALUE;
    Object.entries(caloriesByDay).forEach(([day, calories]) => {
      if (calories > 0 && calories < lowestCalories) {
        healthiestDay = day;
        lowestCalories = calories;
      }
    });
    const existingStats = await this.getWeeklyStats(userId);
    const stats: WeeklyStats = {
      id: existingStats ? existingStats.id : this.statsIdCounter,
      userId,
      averageCalories,
      mealsTracked: weekMeals.length,
      averageProtein,
      healthiestDay,
      weekStarting: startOfWeek,
      caloriesByDay,
      macrosByDay,
      caloriesBurned: 0 // Add missing field
    };
    if (existingStats) {
      this.weeklyStats.set(existingStats.id, stats);
    } else {
      const id = this.statsIdCounter++;
      this.weeklyStats.set(id, { ...stats, id });
    }
  }

  // Weekly stats methods
  async getWeeklyStats(userId: number, medicalCondition?: string): Promise<WeeklyStats | undefined> {
    // TODO: Filter or adjust stats based on medicalCondition
    // For now, just return the stats as before
    const stats = Array.from(this.weeklyStats.values()).find(
      stats => stats.userId === userId
    );
    if (!stats) return undefined;
    // If medicalCondition is set, adjust stats here (placeholder)
    if (medicalCondition && medicalCondition !== 'none') {
      // Example: add a note for demo (do not add unknown properties to WeeklyStats)
      // You could adjust macros/calories here for real logic
      return {
        ...stats,
        macrosByDay: stats.macrosByDay,
        // NOTE: Do not add unknown properties to WeeklyStats type
      };
    }
    // Ensure macrosByDay is always present and correct type
    return {
      ...stats,
      macrosByDay: stats.macrosByDay || {
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

  async createOrUpdateWeeklyStats(insertStats: InsertWeeklyStats): Promise<WeeklyStats> {
    const existingStats = await this.getWeeklyStats(insertStats.userId);
    const id = existingStats ? existingStats.id : this.statsIdCounter++;
    // Ensure macrosByDay is always present
    const macrosByDay = (insertStats as any).macrosByDay || {
      Sunday: { protein: 0, carbs: 0, fat: 0 },
      Monday: { protein: 0, carbs: 0, fat: 0 },
      Tuesday: { protein: 0, carbs: 0, fat: 0 },
      Wednesday: { protein: 0, carbs: 0, fat: 0 },
      Thursday: { protein: 0, carbs: 0, fat: 0 },
      Friday: { protein: 0, carbs: 0, fat: 0 },
      Saturday: { protein: 0, carbs: 0, fat: 0 }
    };
    const stats: WeeklyStats = { 
      ...insertStats, 
      id, 
      macrosByDay,
      caloriesBurned: (insertStats as any).caloriesBurned || 0 // Add missing field
    };
    this.weeklyStats.set(id, stats);
    return stats;
  }

  // Site content methods
  async getSiteContent(key: string): Promise<string | null> {
    return this.siteContent.get(key) || null;
  }

  async updateSiteContent(key: string, value: string): Promise<void> {
    this.siteContent.set(key, value);
  }

  // AI config methods (mock implementation for memory storage)
  async getAIConfigs(): Promise<any[]> {
    return [
      {
        id: 1,
        provider: 'openai',
        modelName: 'gpt-4-vision-preview',
        temperature: 70,
        maxTokens: 1000,
        promptTemplate: 'Analyze this food image and provide detailed nutritional information including calories, protein, carbs, fat, and fiber. Also identify the food items present.',
        isActive: true,
        apiKeyEncrypted: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        provider: 'gemini',
        modelName: 'gemini-1.5-pro-vision-latest',
        temperature: 70,
        maxTokens: 1000,
        promptTemplate: 'Analyze this food image and provide detailed nutritional information including calories, protein, carbs, fat, and fiber. Also identify the food items present.',
        isActive: false,
        apiKeyEncrypted: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async updateAIConfig(id: number, config: any): Promise<void> {
    // Mock implementation - in real app this would update the config
    console.log(`Updated AI config ${id}:`, config);
  }

  async deactivateAllAIConfigs(): Promise<void> {
    // Mock implementation
    console.log('Deactivated all AI configs');
  }

  async updateUserOnboarding(userId: number, onboardingData: any): Promise<User> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      ...onboardingData
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createNutritionGoals(userId: number, goals: any): Promise<void> {
    // For memory storage, we'll store this in the user object
    const user = await this.getUser(userId);
    if (user) {
      user.nutritionGoals = goals;
    }
  }
}

// Storage is now provided by storage-provider.ts