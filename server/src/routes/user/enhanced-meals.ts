import { Router } from 'express';
import { EnhancedMealController } from '../../controllers/enhancedMealController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Enhanced meal management routes
router.get('/advanced', EnhancedMealController.getMealsAdvanced);
router.post('/bulk', EnhancedMealController.createMealsBulk);
router.get('/nutritional-breakdown/:mealId', EnhancedMealController.getNutritionalBreakdown);
router.post('/categorize/:mealId', EnhancedMealController.categorizeMeal);

// Favorite meals routes
router.get('/favorites', EnhancedMealController.getFavoriteMeals);
router.post('/favorites/:mealId', EnhancedMealController.addToFavorites);
router.delete('/favorites/:mealId', EnhancedMealController.removeFromFavorites);

// Search and discovery routes
router.get('/search', EnhancedMealController.searchMeals);
router.post('/share/:mealId', EnhancedMealController.shareMeal);

// Analytics and insights routes
router.get('/analytics', EnhancedMealController.getMealAnalytics);

// Meal templates routes
router.get('/templates', EnhancedMealController.getMealTemplates);
router.post('/templates/:templateId/create', EnhancedMealController.createMealFromTemplate);

// Recipe import routes
router.post('/import', EnhancedMealController.importMealFromUrl);

// Meal suggestions routes
router.post('/suggestions', EnhancedMealController.getMealSuggestions);

// Water intake tracking routes
router.post('/water', EnhancedMealController.logWaterIntake);
router.get('/water/history', EnhancedMealController.getWaterIntakeHistory);

// Exercise tracking routes
router.post('/exercise', EnhancedMealController.logExercise);
router.get('/exercise/history', EnhancedMealController.getExerciseHistory);

export default router;