import { Router } from 'express';
import userReferralsRouter from './referrals';
import userMealsRouter from './meals';
import userNutritionCoachRouter from './nutritionCoach';
import userProfileRouter from './profile';
import enhancedFoodRecognitionRouter from './enhanced-food-recognition';

const userRouter = Router();

userRouter.use('/referrals', userReferralsRouter);
userRouter.use('/meals', userMealsRouter);
userRouter.use('/nutrition-coach', userNutritionCoachRouter);
userRouter.use('/profile', userProfileRouter);
userRouter.use('/enhanced-food-recognition', enhancedFoodRecognitionRouter);

export default userRouter;