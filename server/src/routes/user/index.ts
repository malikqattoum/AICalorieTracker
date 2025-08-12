import { Router } from 'express';
import userReferralsRouter from './referrals';

const userRouter = Router();

userRouter.use('/referrals', userReferralsRouter);

export default userRouter;