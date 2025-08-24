import { Request, Response } from 'express';
import { EnhancedMealService } from '../services/enhancedMealService';
import { log } from '../../vite';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export class EnhancedMealController {
  /**
   * Get meals with advanced filtering and pagination
   */
  static async getMealsAdvanced(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        page = 1,
        limit = 20,
        date,
        type,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        startDate,
        endDate,
        minCalories,
        maxCalories,
        tags
      } = req.query;

      const filters = {
        userId,
        page: Number(page),
        limit: Number(limit),
        date: date as string,
        type: type as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        startDate: startDate as string,
        endDate: endDate as string,
        minCalories: minCalories ? Number(minCalories) : undefined,
        maxCalories: maxCalories ? Number(maxCalories) : undefined,
        tags: tags ? (tags as string).split(',') : undefined
      };

      const result = await EnhancedMealService.getMealsAdvanced(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getMealsAdvanced:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meals'
      });
    }
  }

  /**
   * Create multiple meals in bulk
   */
  static async createMealsBulk(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { meals } = req.body;

      if (!Array.isArray(meals) || meals.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid meals data'
        });
      }

      const result = await EnhancedMealService.createMealsBulk(userId, meals);

      res.json({
        success: true,
        data: {
          createdMeals: result,
          count: result.length
        },
        message: `Successfully created ${result.length} meals`
      });
    } catch (error) {
      console.error('Error in createMealsBulk:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create meals'
      });
    }
  }

  /**
   * Get detailed nutritional breakdown for a meal
   */
  static async getNutritionalBreakdown(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mealId } = req.params;

      if (!mealId || isNaN(Number(mealId))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid meal ID'
        });
      }

      const result = await EnhancedMealService.getNutritionalBreakdown(userId, Number(mealId));

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Meal not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getNutritionalBreakdown:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nutritional breakdown'
      });
    }
  }

  /**
   * AI-powered meal categorization
   */
  static async categorizeMeal(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mealId } = req.params;

      if (!mealId || isNaN(Number(mealId))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid meal ID'
        });
      }

      const result = await EnhancedMealService.categorizeMeal(userId, Number(mealId));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in categorizeMeal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to categorize meal'
      });
    }
  }

  /**
   * Get user's favorite meals
   */
  static async getFavoriteMeals(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { page = 1, limit = 20 } = req.query;

      const result = await EnhancedMealService.getFavoriteMeals(
        userId,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getFavoriteMeals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get favorite meals'
      });
    }
  }

  /**
   * Add meal to favorites
   */
  static async addToFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mealId } = req.params;

      if (!mealId || isNaN(Number(mealId))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid meal ID'
        });
      }

      const result = await EnhancedMealService.addToFavorites(userId, Number(mealId));

      res.json({
        success: result.success,
        message: result.message,
        data: result.success ? { mealId: Number(mealId) } : null
      });
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add meal to favorites'
      });
    }
  }

  /**
   * Remove meal from favorites
   */
  static async removeFromFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mealId } = req.params;

      if (!mealId || isNaN(Number(mealId))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid meal ID'
        });
      }

      const result = await EnhancedMealService.removeFromFavorites(userId, Number(mealId));

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('Error in removeFromFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove meal from favorites'
      });
    }
  }

  /**
   * Search meals by various criteria
   */
  static async searchMeals(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { query, page = 1, limit = 20, ...filters } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const result = await EnhancedMealService.searchMeals(
        userId,
        query,
        Number(page),
        Number(limit),
        filters
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in searchMeals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search meals'
      });
    }
  }

  /**
   * Share meal with other users
   */
  static async shareMeal(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mealId } = req.params;
      const { shareWith, message } = req.body;

      if (!mealId || isNaN(Number(mealId))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid meal ID'
        });
      }

      if (!Array.isArray(shareWith) || shareWith.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Share with list is required'
        });
      }

      const result = await EnhancedMealService.shareMeal(
        userId,
        Number(mealId),
        shareWith,
        message
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in shareMeal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to share meal'
      });
    }
  }

  /**
   * Get meal analytics and insights
   */
  static async getMealAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { startDate, endDate, granularity = 'daily' } = req.query;

      const result = await EnhancedMealService.getMealAnalytics(
        userId,
        startDate as string,
        endDate as string,
        granularity as 'daily' | 'weekly' | 'monthly'
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getMealAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meal analytics'
      });
    }
  }

  /**
   * Get meal templates for quick meal creation
   */
  static async getMealTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const { category, limit = 20 } = req.query;

      const result = await EnhancedMealService.getMealTemplates(
        category as string,
        Number(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getMealTemplates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meal templates'
      });
    }
  }

  /**
   * Create meal from template
   */
  static async createMealFromTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { templateId, customizations } = req.body;

      if (!templateId || isNaN(Number(templateId))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template ID'
        });
      }

      const result = await EnhancedMealService.createMealFromTemplate(
        userId,
        Number(templateId),
        customizations
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in createMealFromTemplate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create meal from template'
      });
    }
  }

  /**
   * Import meal from recipe URL
   */
  static async importMealFromUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { url, servings = 1 } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'URL is required'
        });
      }

      const result = await EnhancedMealService.importMealFromUrl(
        userId,
        url,
        Number(servings)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in importMealFromUrl:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import meal from URL'
      });
    }
  }

  /**
   * Get meal suggestions based on user preferences and goals
   */
  static async getMealSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        mealType,
        dietaryRestrictions = [],
        maxPrepTime,
        cuisine,
        limit = 10
      } = req.body;

      const result = await EnhancedMealService.getMealSuggestions(
        userId,
        mealType,
        Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
        maxPrepTime,
        cuisine,
        Number(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getMealSuggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meal suggestions'
      });
    }
  }

  /**
   * Log water intake
   */
  static async logWaterIntake(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { amount, unit = 'ml', timestamp } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
      }

      const result = await EnhancedMealService.logWaterIntake(
        userId,
        amount,
        unit,
        timestamp ? new Date(timestamp) : undefined
      );

      res.json({
        success: true,
        data: result,
        message: 'Water intake logged successfully'
      });
    } catch (error) {
      console.error('Error in logWaterIntake:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log water intake'
      });
    }
  }

  /**
   * Get water intake history
   */
  static async getWaterIntakeHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { date, startDate, endDate } = req.query;

      const result = await EnhancedMealService.getWaterIntakeHistory(
        userId,
        date as string,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getWaterIntakeHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get water intake history'
      });
    }
  }

  /**
   * Log exercise
   */
  static async logExercise(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { exerciseType, duration, caloriesBurned, intensity = 'moderate', notes, timestamp } = req.body;

      if (!exerciseType || typeof exerciseType !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Exercise type is required'
        });
      }

      if (!duration || typeof duration !== 'number' || duration <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid duration is required'
        });
      }

      if (!caloriesBurned || typeof caloriesBurned !== 'number' || caloriesBurned < 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid calories burned is required'
        });
      }

      const result = await EnhancedMealService.logExercise(
        userId,
        exerciseType,
        duration,
        caloriesBurned,
        intensity,
        notes,
        timestamp ? new Date(timestamp) : undefined
      );

      res.json({
        success: true,
        data: result,
        message: 'Exercise logged successfully'
      });
    } catch (error) {
      console.error('Error in logExercise:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log exercise'
      });
    }
  }

  /**
   * Get exercise history
   */
  static async getExerciseHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { exerciseType, startDate, endDate, limit = 50 } = req.query;

      const result = await EnhancedMealService.getExerciseHistory(
        userId,
        exerciseType as string,
        startDate as string,
        endDate as string,
        Number(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getExerciseHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get exercise history'
      });
    }
  }
}