import { Router } from 'express';
import { db } from '../../db';
import { nutritionGoals, insertNutritionGoalsSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Get nutrition goals for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userGoals = await db.query.nutritionGoals.findFirst({
      where: eq(nutritionGoals.userId, userId),
    });

    if (!userGoals) {
      // Return default goals if none exist
      return res.json({
        userId,
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 200,
        dailyFat: 65,
        weeklyWorkouts: 3,
        waterIntake: 2000,
      });
    }

    res.json(userGoals);
  } catch (error) {
    console.error('Error fetching nutrition goals:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition goals' });
  }
});

// Create or update nutrition goals
router.put('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, weeklyWorkouts, waterIntake, weight, bodyFatPercentage } = req.body;
    
    // Validate nutrition goals data
    if (!dailyCalories || !dailyProtein || !dailyCarbs || !dailyFat || !weight || !bodyFatPercentage) {
      return res.status(400).json({ error: 'Missing required nutrition goals information' });
    }

    // Check if goals already exist for this user
    const existingGoals = await db.query.nutritionGoals.findFirst({
      where: eq(nutritionGoals.userId, userId),
    });

    if (existingGoals) {
      // Update existing goals
      await db
        .update(nutritionGoals)
        .set({
          calories: dailyCalories,
          protein: dailyProtein,
          carbs: dailyCarbs,
          fat: dailyFat,
          weeklyWorkouts: weeklyWorkouts || existingGoals.weeklyWorkouts,
          waterIntake: waterIntake || existingGoals.waterIntake,
          weight: weight || existingGoals.weight,
           bodyFatPercentage: bodyFatPercentage || existingGoals.bodyFatPercentage,
           updatedAt: new Date(),
         })
         .where(eq(nutritionGoals.id, existingGoals.id));

      const [updatedGoals] = await db
        .select()
        .from(nutritionGoals)
        .where(eq(nutritionGoals.id, existingGoals.id))
        .limit(1);

      res.json(updatedGoals);
    } else {
      // Create new goals
      let newGoals;
      await db
        .insert(nutritionGoals)
        .values({
          userId,
          calories: dailyCalories,
          protein: dailyProtein,
          carbs: dailyCarbs,
          fat: dailyFat,
          weeklyWorkouts: weeklyWorkouts || 3,
          waterIntake: waterIntake || 2000,
          weight: weight || 70,
          bodyFatPercentage: bodyFatPercentage || 20,
        });

      [newGoals] = await db
        .select()
        .from(nutritionGoals)
        .where(eq(nutritionGoals.userId, userId))
        .limit(1);

      res.status(201).json(newGoals);
    }
  } catch (error) {
    console.error('Error updating nutrition goals:', error);
    res.status(500).json({ error: 'Failed to update nutrition goals' });
  }
});

export default router;