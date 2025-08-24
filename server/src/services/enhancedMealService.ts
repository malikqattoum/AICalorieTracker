import { log } from '../../vite';
import { db } from '../db';
import { eq, and, gte, lte, desc, asc, sql, or, ilike } from 'drizzle-orm';
import { meals, users, goals, progress, health_scores, mealAnalyses, favoriteMeals } from '@shared/schema';
import type { Meal, InsertMeal, Goal, Progress, HealthScore, MealAnalysis, FavoriteMeal } from '@shared/schema';

export interface MealFilters {
  userId: number;
  page: number;
  limit: number;
  date?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  startDate?: string;
  endDate?: string;
  minCalories?: number;
  maxCalories?: number;
  tags?: string[];
}

export interface NutritionalBreakdown {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealCount: number;
  averageCalories: number;
  breakdownByType: Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  }>;
}

export interface MealAnalytics {
  totalCalories: number;
  averageCalories: number;
  calorieDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  macronutrientBreakdown: {
    protein: number;
    carbs: number;
    fat: number;
  };
  mealTypeDistribution: Record<string, number>;
  weeklyTrends: {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

export interface MealTemplate {
  id: number;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  category: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  imageUrl?: string;
  isPublic: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class EnhancedMealService {
  /**
   * Get meals with advanced filtering and pagination
   */
  static async getMealsAdvanced(filters: MealFilters) {
    try {
      const { userId, page, limit, date, type, search, sortBy = 'created_at', sortOrder = 'desc', startDate, endDate, minCalories, maxCalories, tags } = filters;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      let whereConditions = [eq(meals.userId, userId)];
      
      if (date) {
        whereConditions.push(eq(meals.date, date));
      }
      
      if (type) {
        whereConditions.push(eq(meals.type, type));
      }
      
      if (search) {
        whereConditions.push(
          or(
            ilike(meals.name, `%${search}%`),
            ilike(meals.description, `%${search}%`)
          )
        );
      }
      
      if (startDate) {
        whereConditions.push(gte(meals.date, startDate));
      }
      
      if (endDate) {
        whereConditions.push(lte(meals.date, endDate));
      }
      
      if (minCalories !== undefined) {
        whereConditions.push(gte(meals.calories, minCalories));
      }
      
      if (maxCalories !== undefined) {
        whereConditions.push(lte(meals.calories, maxCalories));
      }
      
      if (tags && tags.length > 0) {
        whereConditions.push(
          sql`${meals.tags} && ${tags}`
        );
      }
      
      // Get total count
      const totalResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(meals)
        .where(and(...whereConditions));
      
      const total = Number(totalResult[0]?.count) || 0;
      
      // Get meals with sorting
      const mealsResult = await db
        .select({
          id: meals.id,
          name: meals.name,
          description: meals.description,
          calories: meals.calories,
          protein: meals.protein,
          carbs: meals.carbs,
          fat: meals.fat,
          fiber: meals.fiber,
          sugar: meals.sugar,
          sodium: meals.sodium,
          portionSize: meals.portionSize,
          estimatedWeight: meals.estimatedWeight,
          type: meals.type,
          date: meals.date,
          tags: meals.tags,
          imageUrl: meals.imageUrl,
          createdAt: meals.createdAt,
          updatedAt: meals.updatedAt
        })
        .from(meals)
        .where(and(...whereConditions))
        .orderBy(sortOrder === 'desc' ? desc(meals[sortBy as keyof typeof meals]) : asc(meals[sortBy as keyof typeof meals]))
        .limit(limit)
        .offset(offset);
      
      return {
        meals: mealsResult,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting advanced meals:', error);
      throw new Error('Failed to get meals');
    }
  }

  /**
   * Create multiple meals in bulk
   */
  static async createMealsBulk(userId: number, mealsData: InsertMeal[]) {
    try {
      const createdMeals = await db.transaction(async (tx) => {
        const results = [];
        
        for (const mealData of mealsData) {
          const [meal] = await tx.insert(meals).values({
            ...mealData,
            userId
          });
          
          results.push(meal);
        }
        
        return results;
      });
      
      log(`Created ${createdMeals.length} meals in bulk for user ${userId}`);
      return createdMeals;
    } catch (error) {
      console.error('Error creating bulk meals:', error);
      throw new Error('Failed to create meals in bulk');
    }
  }

  /**
   * Get detailed nutritional breakdown for a meal
   */
  static async getNutritionalBreakdown(userId: number, mealId: number) {
    try {
      const meal = await db
        .select()
        .from(meals)
        .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
        .limit(1);
      
      if (!meal.length) {
        return null;
      }
      
      const mealData = meal[0];
      
      // Get related meals for comparison
      const relatedMeals = await db
        .select({
          calories: meals.calories,
          protein: meals.protein,
          carbs: meals.carbs,
          fat: meals.fat
        })
        .from(meals)
        .where(and(
          eq(meals.userId, userId),
          eq(meals.type, mealData.type),
          sql`${meals.id} <> ${mealId}`
        ))
        .limit(10);
      
      const avgRelatedCalories = relatedMeals.length > 0 
        ? relatedMeals.reduce((sum, m) => sum + m.calories, 0) / relatedMeals.length 
        : 0;
      
      return {
        meal: mealData,
        comparison: {
          averageCalories: avgRelatedCalories,
          isAboveAverage: mealData.calories > avgRelatedCalories,
          difference: mealData.calories - avgRelatedCalories
        },
        nutritionalInfo: {
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
          fiber: mealData.fiber || 0,
          sugar: mealData.sugar || 0,
          sodium: mealData.sodium || 0
        }
      };
    } catch (error) {
      console.error('Error getting nutritional breakdown:', error);
      throw new Error('Failed to get nutritional breakdown');
    }
  }

  /**
   * AI-powered meal categorization
   */
  static async categorizeMeal(userId: number, mealId: number) {
    try {
      const meal = await db
        .select()
        .from(meals)
        .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
        .limit(1);
      
      if (!meal.length) {
        throw new Error('Meal not found');
      }
      
      const mealData = meal[0];
      
      // Mock AI categorization - in real implementation, this would call an AI service
      const categorization = {
        primaryCategory: this.determinePrimaryCategory(mealData.name, mealData.type),
        secondaryCategories: this.determineSecondaryCategories(mealData.name, mealData.tags || []),
        confidence: 0.85 + Math.random() * 0.15,
        suggestions: this.generateMealSuggestions(mealData),
        healthScore: this.calculateHealthScore(mealData),
        dietaryCompatibility: this.analyzeDietaryCompatibility(mealData)
      };
      
      // Update meal with categorization
      await db
        .update(meals)
        .set({
          tags: [...(mealData.tags || []), ...categorization.secondaryCategories],
          updatedAt: new Date()
        })
        .where(eq(meals.id, mealId));
      
      return categorization;
    } catch (error) {
      console.error('Error categorizing meal:', error);
      throw new Error('Failed to categorize meal');
    }
  }

  /**
   * Get user's favorite meals
   */
  static async getFavoriteMeals(userId: number, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const favorites = await db
        .select({
          id: favoriteMeals.id,
          mealId: favoriteMeals.mealId,
          createdAt: favoriteMeals.createdAt,
          meal: {
            id: meals.id,
            name: meals.name,
            calories: meals.calories,
            protein: meals.protein,
            carbs: meals.carbs,
            fat: meals.fat,
            type: meals.type,
            date: meals.date,
            imageUrl: meals.imageUrl
          }
        })
        .from(favoriteMeals)
        .leftJoin(meals, eq(favoriteMeals.mealId, meals.id))
        .where(eq(favoriteMeals.userId, userId))
        .orderBy(desc(favoriteMeals.createdAt))
        .limit(limit)
        .offset(offset);
      
      const totalResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(favoriteMeals)
        .where(eq(favoriteMeals.userId, userId));
      
      const total = Number(totalResult[0]?.count) || 0;
      
      return {
        favorites: favorites.map(f => ({
          ...f.meal,
          favoritedAt: f.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting favorite meals:', error);
      throw new Error('Failed to get favorite meals');
    }
  }

  /**
   * Add meal to favorites
   */
  static async addToFavorites(userId: number, mealId: number) {
    try {
      // Check if already favorited
      const existing = await db
        .select()
        .from(favoriteMeals)
        .where(and(eq(favoriteMeals.userId, userId), eq(favoriteMeals.mealId, mealId)))
        .limit(1);
      
      if (existing.length > 0) {
        return { success: false, message: 'Meal already in favorites' };
      }
      
      await db.insert(favoriteMeals).values({
        userId,
        mealName: 'Meal', // This would normally come from the meals table
        mealId,
        createdAt: new Date()
      });
      
      return { success: true, message: 'Meal added to favorites' };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add meal to favorites');
    }
  }

  /**
   * Remove meal from favorites
   */
  static async removeFromFavorites(userId: number, mealId: number) {
    try {
      const deleted = await db
        .delete(favoriteMeals)
        .where(and(eq(favoriteMeals.userId, userId), eq(favoriteMeals.mealId, mealId)));
      
      return { success: deleted.affectedRows > 0, message: deleted.affectedRows > 0 ? 'Meal removed from favorites' : 'Meal not found in favorites' };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove meal from favorites');
    }
  }

  /**
   * Search meals by various criteria
   */
  static async searchMeals(userId: number, query: string, page: number = 1, limit: number = 20, filters?: Record<string, any>) {
    try {
      const offset = (page - 1) * limit;
      
      let whereConditions = [eq(meals.userId, userId), or(
        ilike(meals.name, `%${query}%`),
        ilike(meals.description, `%${query}%`)
      )];
      
      if (filters?.type) {
        whereConditions.push(eq(meals.type, filters.type));
      }
      
      if (filters?.dateRange) {
        whereConditions.push(
          and(
            gte(meals.date, filters.dateRange.start),
            lte(meals.date, filters.dateRange.end)
          )
        );
      }
      
      const totalResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(meals)
        .where(and(...whereConditions));
      
      const total = Number(totalResult[0]?.count) || 0;
      
      const results = await db
        .select()
        .from(meals)
        .where(and(...whereConditions))
        .orderBy(desc(meals.createdAt))
        .limit(limit)
        .offset(offset);
      
      return {
        meals: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        query
      };
    } catch (error) {
      console.error('Error searching meals:', error);
      throw new Error('Failed to search meals');
    }
  }

  /**
   * Share meal with other users
   */
  static async shareMeal(userId: number, mealId: number, shareWith: number[], message?: string) {
    try {
      const meal = await db
        .select()
        .from(meals)
        .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
        .limit(1);
      
      if (!meal.length) {
        throw new Error('Meal not found');
      }
      
      // In a real implementation, this would create shared meal records
      // and send notifications to the shared users
      
      return {
        success: true,
        message: 'Meal shared successfully',
        sharedWith: shareWith.length,
        meal: meal[0]
      };
    } catch (error) {
      console.error('Error sharing meal:', error);
      throw new Error('Failed to share meal');
    }
  }

  /**
   * Get meal analytics and insights
   */
  static async getMealAnalytics(userId: number, startDate?: string, endDate?: string, granularity: 'daily' | 'weekly' | 'monthly' = 'daily') {
    try {
      const whereConditions = [eq(meals.userId, userId)];
      
      if (startDate) {
        whereConditions.push(gte(meals.date, startDate));
      }
      
      if (endDate) {
        whereConditions.push(lte(meals.date, endDate));
      }
      
      const mealsData = await db
        .select()
        .from(meals)
        .where(and(...whereConditions))
        .orderBy(meals.date);
      
      const totalCalories = mealsData.reduce((sum, meal) => sum + meal.calories, 0);
      const totalMeals = mealsData.length;
      const averageCalories = totalMeals > 0 ? totalCalories / totalMeals : 0;
      
      // Group by meal type
      const mealTypeDistribution: Record<string, number> = {};
      mealsData.forEach(meal => {
        mealTypeDistribution[meal.type] = (mealTypeDistribution[meal.type] || 0) + 1;
      });
      
      // Calculate macronutrient breakdown
      const macronutrientBreakdown = {
        protein: mealsData.reduce((sum, meal) => sum + (meal.protein || 0), 0),
        carbs: mealsData.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
        fat: mealsData.reduce((sum, meal) => sum + (meal.fat || 0), 0)
      };
      
      // Group by date for trends
      const dailyTrends: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
      mealsData.forEach(meal => {
        if (!dailyTrends[meal.date]) {
          dailyTrends[meal.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        dailyTrends[meal.date].calories += meal.calories;
        dailyTrends[meal.date].protein += meal.protein || 0;
        dailyTrends[meal.date].carbs += meal.carbs || 0;
        dailyTrends[meal.date].fat += meal.fat || 0;
      });
      
      const weeklyTrends = Object.entries(dailyTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7) // Last 7 days
        .map(([date, data]) => ({
          date,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat
        }));
      
      return {
        period: { startDate, endDate },
        summary: {
          totalCalories,
          totalMeals,
          averageCalories
        },
        macronutrientBreakdown,
        mealTypeDistribution,
        weeklyTrends,
        insights: this.generateMealInsights(mealsData, averageCalories)
      };
    } catch (error) {
      console.error('Error getting meal analytics:', error);
      throw new Error('Failed to get meal analytics');
    }
  }

  /**
   * Get meal templates for quick meal creation
   */
  static async getMealTemplates(category?: string, limit: number = 20) {
    try {
      // In a real implementation, this would query a meal_templates table
      // For now, return mock data
      const mockTemplates: MealTemplate[] = [
        {
          id: 1,
          name: 'Grilled Chicken Salad',
          description: 'Healthy grilled chicken with fresh vegetables',
          calories: 350,
          protein: 35,
          carbs: 15,
          fat: 18,
          fiber: 8,
          sugar: 6,
          sodium: 450,
          category: 'salad',
          ingredients: ['Chicken breast', 'Mixed greens', 'Tomatoes', 'Cucumber', 'Olive oil'],
          instructions: ['Grill chicken breast', 'Chop vegetables', 'Mix together', 'Drizzle with olive oil'],
          prepTime: 15,
          cookTime: 20,
          servings: 2,
          tags: ['healthy', 'high-protein', 'low-carb'],
          isPublic: true,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      return {
        templates: category 
          ? mockTemplates.filter(t => t.category === category)
          : mockTemplates,
        total: mockTemplates.length
      };
    } catch (error) {
      console.error('Error getting meal templates:', error);
      throw new Error('Failed to get meal templates');
    }
  }

  /**
   * Create meal from template
   */
  static async createMealFromTemplate(userId: number, templateId: number, customizations?: Record<string, any>) {
    try {
      // In a real implementation, this would fetch the template and apply customizations
      const mealData: InsertMeal = {
        name: `Custom Meal ${templateId}`,
        calories: 300,
        protein: 25,
        carbs: 20,
        fat: 15,
        type: 'lunch',
        date: new Date().toISOString().split('T')[0],
        tags: ['template-based']
      };
      
      const [meal] = await db.insert(meals).values(mealData);
      
      return {
        success: true,
        meal,
        message: 'Meal created from template'
      };
    } catch (error) {
      console.error('Error creating meal from template:', error);
      throw new Error('Failed to create meal from template');
    }
  }

  /**
   * Import meal from recipe URL
   */
  static async importMealFromUrl(userId: number, url: string, servings: number = 1) {
    try {
      // In a real implementation, this would call a recipe parsing service
      const importedMeal: InsertMeal = {
        name: 'Imported Recipe',
        calories: 400 * servings,
        protein: 20 * servings,
        carbs: 30 * servings,
        fat: 15 * servings,
        type: 'dinner',
        date: new Date().toISOString().split('T')[0],
        description: `Imported from: ${url}`,
        tags: ['imported', 'recipe']
      };
      
      const [meal] = await db.insert(meals).values(importedMeal);
      
      return {
        success: true,
        meal,
        message: 'Meal imported successfully'
      };
    } catch (error) {
      console.error('Error importing meal from URL:', error);
      throw new Error('Failed to import meal from URL');
    }
  }

  /**
   * Get meal suggestions based on user preferences and goals
   */
  static async getMealSuggestions(userId: number, mealType?: string, dietaryRestrictions: string[] = [], maxPrepTime?: number, cuisine?: string, limit: number = 10) {
    try {
      // Get user's goals for personalization
      const userGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .limit(1);
      
      const targetCalories = userGoals.length > 0 ? userGoals[0].targetCalories : 2000;
      
      // Mock meal suggestions based on criteria
      const suggestions = [
        {
          id: 1,
          name: 'Quinoa Buddha Bowl',
          calories: 450,
          protein: 18,
          carbs: 45,
          fat: 20,
          prepTime: 20,
          cuisine: 'Mediterranean',
          dietary: ['vegetarian', 'gluten-free'],
          imageUrl: '/images/quinoa-bowl.jpg',
          matchScore: 0.95
        },
        {
          id: 2,
          name: 'Grilled Salmon with Vegetables',
          calories: 380,
          protein: 32,
          carbs: 12,
          fat: 25,
          prepTime: 25,
          cuisine: 'American',
          dietary: ['keto-friendly'],
          imageUrl: '/images/salmon-veggies.jpg',
          matchScore: 0.88
        }
      ].filter(suggestion => {
        if (mealType && !suggestion.name.toLowerCase().includes(mealType)) return false;
        if (maxPrepTime && suggestion.prepTime > maxPrepTime) return false;
        if (cuisine && suggestion.cuisine !== cuisine) return false;
        if (dietaryRestrictions.length > 0) {
          const hasMatchingDiet = dietaryRestrictions.some(restriction => 
            suggestion.dietary.some(d => d.toLowerCase().includes(restriction.toLowerCase()))
          );
          if (!hasMatchingDiet) return false;
        }
        return true;
      });
      
      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      throw new Error('Failed to get meal suggestions');
    }
  }

  /**
   * Log water intake
   */
  static async logWaterIntake(userId: number, amount: number, unit: string = 'ml', timestamp?: Date) {
    try {
      const waterLog: any = {
        userId,
        amount,
        unit,
        timestamp: timestamp || new Date()
      };
      
      const [log] = await db.insert(waterIntake).values(waterLog);
      
      return log;
    } catch (error) {
      console.error('Error logging water intake:', error);
      throw new Error('Failed to log water intake');
    }
  }

  /**
   * Get water intake history
   */
  static async getWaterIntakeHistory(userId: number, date?: string, startDate?: string, endDate?: string) {
    try {
      let whereConditions = [eq(waterIntake.userId, userId)];
      
      if (date) {
        whereConditions.push(eq(waterIntake.date, date));
      }
      
      if (startDate) {
        whereConditions.push(gte(waterIntake.date, startDate));
      }
      
      if (endDate) {
        whereConditions.push(lte(waterIntake.date, endDate));
      }
      
      const history = await db
        .select()
        .from(waterIntake)
        .where(and(...whereConditions))
        .orderBy(desc(waterIntake.timestamp));
      
      return history;
    } catch (error) {
      console.error('Error getting water intake history:', error);
      throw new Error('Failed to get water intake history');
    }
  }

  /**
   * Log exercise
   */
  static async logExercise(userId: number, exerciseType: string, duration: number, caloriesBurned: number, intensity: string = 'moderate', notes?: string, timestamp?: Date) {
    try {
      const exerciseLog: any = {
        userId,
        exerciseType,
        duration,
        caloriesBurned,
        intensity,
        notes,
        timestamp: timestamp || new Date()
      };
      
      const [log] = await db.insert(exerciseLogs).values(exerciseLog);
      
      return log;
    } catch (error) {
      console.error('Error logging exercise:', error);
      throw new Error('Failed to log exercise');
    }
  }

  /**
   * Get exercise history
   */
  static async getExerciseHistory(userId: number, exerciseType?: string, startDate?: string, endDate?: string, limit: number = 50) {
    try {
      let whereConditions = [eq(exerciseLogs.userId, userId)];
      
      if (exerciseType) {
        whereConditions.push(eq(exerciseLogs.exerciseType, exerciseType));
      }
      
      if (startDate) {
        whereConditions.push(gte(exerciseLogs.date, startDate));
      }
      
      if (endDate) {
        whereConditions.push(lte(exerciseLogs.date, endDate));
      }
      
      const history = await db
        .select()
        .from(exerciseLogs)
        .where(and(...whereConditions))
        .orderBy(desc(exerciseLogs.timestamp))
        .limit(limit);
      
      return history;
    } catch (error) {
      console.error('Error getting exercise history:', error);
      throw new Error('Failed to get exercise history');
    }
  }

  // Helper methods
  private static determinePrimaryCategory(name: string, type: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('salad') || nameLower.includes('bowl')) return 'salad';
    if (nameLower.includes('soup') || nameLower.includes('stew')) return 'soup';
    if (nameLower.includes('pasta') || nameLower.includes('noodle')) return 'pasta';
    if (nameLower.includes('rice') || nameLower.includes('quinoa')) return 'grain';
    if (nameLower.includes('chicken') || nameLower.includes('beef') || nameLower.includes('fish')) return 'protein';
    return type;
  }

  private static determineSecondaryCategories(name: string, existingTags: string[] = []): string[] {
    const nameLower = name.toLowerCase();
    const categories: string[] = [];
    
    if (nameLower.includes('healthy') || nameLower.includes('light')) categories.push('healthy');
    if (nameLower.includes('spicy') || nameLower.includes('hot')) categories.push('spicy');
    if (nameLower.includes('vegetarian') || nameLower.includes('vegan')) categories.push('vegetarian');
    if (nameLower.includes('quick') || nameLower.includes('easy')) categories.push('quick');
    if (nameLower.includes('homemade') || nameLower.includes('home')) categories.push('homemade');
    
    return [...new Set([...categories, ...existingTags])];
  }

  private static generateMealSuggestions(meal: Meal): string[] {
    const suggestions: string[] = [];
    
    if (meal.calories > 500) {
      suggestions.push('Consider portion control for this meal');
    }
    
    if (meal.protein < 15) {
      suggestions.push('Add more protein to this meal');
    }
    
    if (meal.fat > 25) {
      suggestions.push('Reduce fat content for healthier options');
    }
    
    if (meal.carbs > 50) {
      suggestions.push('Consider reducing carbohydrates');
    }
    
    return suggestions;
  }

  private static calculateHealthScore(meal: Meal): number {
    let score = 50; // Base score
    
    // Protein bonus
    if (meal.protein > 20) score += 10;
    else if (meal.protein > 10) score += 5;
    
    // Fat penalty for high fat
    if (meal.fat > 30) score -= 15;
    else if (meal.fat > 20) score -= 5;
    
    // Fiber bonus
    if (meal.fiber && meal.fiber > 5) score += 10;
    else if (meal.fiber && meal.fiber > 2) score += 5;
    
    // Sugar penalty
    if (meal.sugar && meal.sugar > 20) score -= 10;
    else if (meal.sugar && meal.sugar > 10) score -= 5;
    
    // Sodium penalty
    if (meal.sodium && meal.sodium > 800) score -= 10;
    else if (meal.sodium && meal.sodium > 400) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private static analyzeDietaryCompatibility(meal: Meal): Record<string, boolean> {
    return {
      keto: meal.carbs < 10 && meal.fat > 20,
      lowCarb: meal.carbs < 25,
      highProtein: meal.protein > 20,
      lowFat: meal.fat < 15,
      vegetarian: !meal.name.toLowerCase().includes('chicken') && !meal.name.toLowerCase().includes('beef') && !meal.name.toLowerCase().includes('fish'),
      vegan: !meal.name.toLowerCase().includes('chicken') && !meal.name.toLowerCase().includes('beef') && !meal.name.toLowerCase().includes('fish') && !meal.name.toLowerCase().includes('dairy'),
      glutenFree: !meal.name.toLowerCase().includes('pasta') && !meal.name.toLowerCase().includes('bread') && !meal.name.toLowerCase().includes('wheat')
    };
  }

  private static generateMealInsights(meals: Meal[], averageCalories: number): string[] {
    const insights: string[] = [];
    
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const avgMealCalories = totalCalories / meals.length;
    
    if (avgMealCalories > averageCalories * 1.2) {
      insights.push('Your meals are higher in calories than your target. Consider portion control.');
    }
    
    if (avgMealCalories < averageCalories * 0.8) {
      insights.push('Your meals are lower in calories than your target. Consider adding more nutrient-dense foods.');
    }
    
    const highCalorieMeals = meals.filter(meal => meal.calories > 500).length;
    if (highCalorieMeals > meals.length * 0.3) {
      insights.push('30% or more of your meals are high in calories. Consider lighter options.');
    }
    
    const lowProteinMeals = meals.filter(meal => (meal.protein || 0) < 10).length;
    if (lowProteinMeals > meals.length * 0.5) {
      insights.push('More than half your meals are low in protein. Consider adding protein sources.');
    }
    
    return insights;
  }
}