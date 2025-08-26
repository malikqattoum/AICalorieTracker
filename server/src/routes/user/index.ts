import { Router } from 'express';
import userReferralsRouter from './referrals';
import userMealsRouter from './meals';
import userNutritionCoachRouter from './nutritionCoach';
import userProfileRouter from './profile';
import enhancedFoodRecognitionRouter from './enhanced-food-recognition';

const userRouter = Router();

// Root handler for /api/user route
userRouter.get('/', (req, res) => {
  res.json({
    message: 'User API endpoint',
    version: '1.0.0',
    endpoints: {
      profile: '/api/user/profile',
      meals: '/api/user/meals',
      'nutrition-coach': '/api/user/nutrition-coach',
      referrals: '/api/user/referrals',
      'enhanced-food-recognition': '/api/user/enhanced-food-recognition'
    }
  });
});

userRouter.use('/referrals', userReferralsRouter);
userRouter.use('/meals', userMealsRouter);
userRouter.use('/nutrition-coach', userNutritionCoachRouter);
userRouter.use('/profile', userProfileRouter);
userRouter.use('/enhanced-food-recognition', enhancedFoodRecognitionRouter);

export default userRouter;