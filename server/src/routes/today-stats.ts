import { Router } from 'express';
import { db } from '../../db';
import { mealAnalyses } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get today's nutrition stats for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Query meal analyses for today
    const todayMeals = await db.query.mealAnalyses.findMany({
      where: and(
        eq(mealAnalyses.userId, userId),
        gte(mealAnalyses.createdAt, startOfDay),
        lte(mealAnalyses.createdAt, endOfDay)
      ),
    });

    // Calculate totals
    const totals = todayMeals.reduce(
      (acc: {calories: number; protein: number; carbs: number; fat: number; water: number}, meal: any) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fat += meal.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 } // Water is tracked separately
    );

    // Get water intake from user's tracking (if implemented)
    // This is a placeholder - in a real implementation, you would query a water tracking table
    // For now, we'll return 0 for water intake
    
    res.json(totals);
  } catch (error) {
    console.error('Error fetching today\'s stats:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s stats' });
  }
});

// Update water intake for today
router.post('/water', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { amount } = req.body;
    if (!amount || typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'Invalid water amount' });
    }

    // This is a placeholder for updating water intake
    // In a real implementation, you would update a water tracking table
    // For now, we'll just return success
    
    res.json({ success: true, message: 'Water intake updated' });
  } catch (error) {
    console.error('Error updating water intake:', error);
    res.status(500).json({ error: 'Failed to update water intake' });
  }
});

export default router;