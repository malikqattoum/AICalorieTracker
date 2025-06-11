import { Router } from 'express';
import workoutsRouter from './workouts';
import nutritionGoalsRouter from './nutrition-goals';
import todayStatsRouter from './today-stats';
import mealRecommendationsRouter from './meal-recommendations';
import importedRecipesRouter from './imported-recipes';
import aiChefRouter from './ai-chef';
import adminRouter from './admin'; // Import the new admin router

const router = Router();

// Register all route modules
router.use('/workouts', workoutsRouter);
router.use('/nutrition-goals', nutritionGoalsRouter);
router.use('/today-stats', todayStatsRouter);
router.use('/meal-recommendations', mealRecommendationsRouter);
router.use('/imported-recipes', importedRecipesRouter);
router.use('/ai-chef', aiChefRouter);
router.use('/admin', adminRouter); // Register the admin router

export default router;