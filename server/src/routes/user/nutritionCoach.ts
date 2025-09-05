import { Router } from 'express';
import NutritionCoachController from '../../controllers/nutritionCoachController';
import ValidationService from '../../services/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// POST /api/user/nutrition-coach/ask
router.post('/ask',
  ValidationService.validate({
    question: { type: 'string', required: true, minLength: 10 },
    imageData: { type: 'string', required: false }
  }),
  NutritionCoachController.askQuestion
);

// GET /api/user/nutrition-coach/history
router.get('/history', NutritionCoachController.getHistory);

// POST /api/user/nutrition-coach/answers/:id/feedback
router.post('/answers/:id/feedback',
  ValidationService.validate({
    rating: { type: 'number', required: true, min: 1, max: 5 },
    comment: { type: 'string', required: false }
  }),
  NutritionCoachController.submitFeedback
);

// GET /api/user/nutrition-coach/recommendations
router.get('/recommendations', NutritionCoachController.getRecommendations);

// GET /api/user/nutrition-coach/tips
router.get('/tips', NutritionCoachController.getTips);

export default router;