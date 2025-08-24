import { Router } from 'express';
import MealController from '../../controllers/mealController';
import ValidationService from '../../services/validation';
import AuthMiddleware from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all meal routes
router.use(AuthMiddleware.authenticate);

// GET /api/user/meals - Get meals with optional filters
router.get('/', 
  ValidationService.validate({
    date: { type: 'string', required: false },
    type: { type: 'string', required: false }
  }),
  MealController.getMeals
);

// POST /api/user/meals - Create new meal
router.post('/',
  ValidationService.validate({
    name: { type: 'string', required: true, minLength: 2 },
    calories: { type: 'number', required: true },
    protein: { type: 'number', required: true },
    carbs: { type: 'number', required: true },
    fat: { type: 'number', required: true },
    date: { type: 'string', required: true }
  }),
  MealController.createMeal
);

// PUT /api/user/meals/:id - Update meal
router.put('/:id',
  ValidationService.validate({
    name: { type: 'string', required: false },
    calories: { type: 'number', required: false },
    protein: { type: 'number', required: false },
    carbs: { type: 'number', required: false },
    fat: { type: 'number', required: false }
  }),
  MealController.updateMeal
);

// DELETE /api/user/meals/:id - Delete meal
router.delete('/:id', MealController.deleteMeal);

// POST /api/user/meals/analyze - Analyze meal image
router.post('/analyze',
  MealController.analyzeMealImage
);

// GET /api/user/meals/daily-summary - Get daily nutrition summary
router.get('/daily-summary',
  ValidationService.validate({
    date: { type: 'string', required: true }
  }),
  MealController.getDailySummary
);

export default router;