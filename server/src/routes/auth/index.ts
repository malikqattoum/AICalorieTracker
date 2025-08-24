import { Router } from 'express';
import AuthController from '../../controllers/authController';
import ValidationService from '../../services/validation';
import AuthMiddleware from '../../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', 
  ValidationService.validate({
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 8 }
  }),
  AuthController.login
);

// POST /api/auth/register
router.post('/register',
  ValidationService.validate({
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 8 },
    username: { type: 'string', required: true, minLength: 3 }
  }),
  AuthController.register
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  ValidationService.validate({
    email: { type: 'email', required: true }
  }),
  AuthController.forgotPassword
);

// POST /api/auth/reset-password
router.post('/reset-password',
  ValidationService.validate({
    token: { type: 'string', required: true },
    newPassword: { type: 'string', required: true, minLength: 8 }
  }),
  AuthController.resetPassword
);

// POST /api/auth/refresh-token
router.post('/refresh-token',
  ValidationService.validate({
    refreshToken: { type: 'string', required: true }
  }),
  AuthController.refreshToken
);

// GET /api/auth/me
router.get('/me',
  AuthMiddleware.authenticate,
  AuthController.getCurrentUser
);

export default router;