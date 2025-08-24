import { Router } from 'express';
import UserProfileController from '../../controllers/userProfileController';
import ValidationService from '../../services/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// PUT /api/user/profile
router.put('/',
  ValidationService.validate({
    username: { type: 'string', required: false, minLength: 3 },
    height: { type: 'number', required: false, min: 100 },
    weight: { type: 'number', required: false, min: 30 },
    birthdate: { type: 'string', required: false }
  }),
  UserProfileController.updateProfile
);

// GET /api/user/settings
router.get('/settings', UserProfileController.getSettings);

// PUT /api/user/settings
router.put('/settings',
  ValidationService.validate({
    notifications: { type: 'boolean', required: false },
    darkMode: { type: 'boolean', required: false },
    measurementSystem: { type: 'string', required: false }
  }),
  UserProfileController.updateSettings
);

// POST /api/user/onboarding-completed
router.post('/onboarding-completed', 
  UserProfileController.markOnboardingCompleted
);

export default router;