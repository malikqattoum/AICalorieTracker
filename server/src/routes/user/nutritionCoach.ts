import { Router } from 'express';
import NutritionCoachController from '../../controllers/nutritionCoachController';
import ValidationService from '../../services/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// POST /api/user/nutrition-coach/ask
router.post(
  '/ask',
  // Normalize incoming fields from various clients before validation
  (req, _res, next) => {
    const body: any = req.body || {};

    // Map alternate field names to expected schema
    const possibleQuestion = body.question ?? body.message ?? body.text ?? body.prompt ?? body.q;
    const possibleImage = body.imageData ?? body.image ?? body.photo ?? body.data ?? body.image_base64;

    if (possibleQuestion && !body.question) {
      body.question = typeof possibleQuestion === 'string' ? possibleQuestion : String(possibleQuestion);
    }

    if (possibleImage && !body.imageData) {
      const img = typeof possibleImage === 'string' ? possibleImage : String(possibleImage);
      // Strip data URL prefix if present
      body.imageData = img.includes('base64,') ? img.split('base64,')[1] : img;
    }

    req.body = body;
    next();
  },
  ValidationService.validate({
    question: { type: 'string', required: true, minLength: 3 },
    imageData: { type: 'string', required: false }
  }),
  NutritionCoachController.askQuestion
);

// GET /api/user/nutrition-coach/history
router.get('/history', NutritionCoachController.getHistory);

// POST /api/user/nutrition-coach/answers/:id/feedback
router.post(
  '/answers/:id/feedback',
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