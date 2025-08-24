import { Request, Response } from 'express';
import MealService from '../services/mealService';

export default {
  async getMeals(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { date, type } = req.query;
      const meals = await MealService.getUserMeals(userId, date as string, type as string);
      res.json(meals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get meals' });
    }
  },

  async createMeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const mealData = req.body;
      const meal = await MealService.createMeal(userId, mealData);
      res.status(201).json(meal);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create meal' });
    }
  },

  async updateMeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const mealId = parseInt(req.params.id);
      const updates = req.body;
      const updatedMeal = await MealService.updateMeal(userId, mealId, updates);
      res.json(updatedMeal);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update meal' });
    }
  },

  async deleteMeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const mealId = parseInt(req.params.id);
      await MealService.deleteMeal(userId, mealId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete meal' });
    }
  },

  async analyzeMealImage(req: Request, res: Response) {
    try {
      // Placeholder for image analysis integration
      res.json({
        name: 'Analyzed Meal',
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20
      });
    } catch (error) {
      res.status(400).json({ error: 'Meal analysis failed' });
    }
  },

  async getDailySummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { date } = req.query;
      const summary = await MealService.getDailySummary(userId, date as string);
      res.json(summary);
    } catch (error) {
      res.status(400).json({ error: 'Failed to get daily summary' });
    }
  }
};