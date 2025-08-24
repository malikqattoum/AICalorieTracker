import { Router } from 'express';
import workoutsRouter from './workouts';
import nutritionGoalsRouter from './nutrition-goals';
import todayStatsRouter from './today-stats';
import mealRecommendationsRouter from './meal-recommendations';
import importedRecipesRouter from './imported-recipes';
import aiChefRouter from './ai-chef';
import adminRouter from './admin'; // Import the new admin router
import wearableRouter from './wearables'; // Import wearable router
import analyticsRouter from './analytics'; // Import analytics router
import premiumAnalyticsRouter from './premium-analytics'; // Import premium analytics router
import authRouter from './auth'; // Import auth router
import userRouter from './user'; // Import user router

const router = Router();

// Register all route modules
router.use('/auth', authRouter); // Register auth router
router.use('/user', userRouter); // Register user router
router.use('/analytics', analyticsRouter); // Register analytics router
router.use('/premium-analytics', premiumAnalyticsRouter); // Register premium analytics router
router.use('/workouts', workoutsRouter);
router.use('/nutrition-goals', nutritionGoalsRouter);
router.use('/today-stats', todayStatsRouter);
router.use('/meal-recommendations', mealRecommendationsRouter);
router.use('/imported-recipes', importedRecipesRouter);
router.use('/ai-chef', aiChefRouter);
router.use('/admin', adminRouter); // Register the admin router
router.use('/wearable', wearableRouter); // Register wearable router

export default router;