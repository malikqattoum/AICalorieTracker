import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// AI service endpoints (some may not require authentication for public testing)
router.get('/status', AIController.getServiceStatus);
router.get('/health', AIController.getServiceHealth);

// AI analysis endpoints (require authentication)
router.post('/analyze', authenticate, AIController.analyzeFoodImage);
router.post('/multi-analyze', authenticate, AIController.analyzeMultiFoodImage);

// AI provider management endpoints (admin only)
router.get('/providers', authenticate, AIController.getProviders);
router.put('/providers/:id', authenticate, AIController.updateProvider);
router.post('/providers/:id/set-active', authenticate, AIController.setActiveProvider);
router.post('/providers/:id/test', authenticate, AIController.testProvider);

// AI usage and analytics endpoints
router.get('/usage/stats', authenticate, AIController.getUsageStats);

// AI-powered features
router.post('/suggestions', authenticate, AIController.generateMealSuggestions);
router.get('/tips', authenticate, AIController.getNutritionTips);
router.post('/meal-plan', authenticate, AIController.generateMealPlan);

export default router;