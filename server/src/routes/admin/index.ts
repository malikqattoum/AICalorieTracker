import { Router } from 'express';
import adminUsersRouter from './users';
import adminDataRouter from './data';
import adminConfigRouter from './config';
import adminContentRouter from './content'; // For existing site content management
import adminLanguagesRouter from './languages';
import adminTranslationsRouter from './translations';
import adminReferralRouter from './referral';
import adminDashboardRouter from './dashboard';
import adminHealthcareRouter from './healthcare';
import adminAnalyticsRouter from './analytics';
import adminSystemRouter from './system';

const adminRouter = Router();

adminRouter.use('/users', adminUsersRouter);
adminRouter.use('/data', adminDataRouter);
adminRouter.use('/config', adminConfigRouter);
adminRouter.use('/content', adminContentRouter); // Using the new structure for content
adminRouter.use('/languages', adminLanguagesRouter);
adminRouter.use('/translations', adminTranslationsRouter);
adminRouter.use('/referral', adminReferralRouter);
adminRouter.use('/dashboard', adminDashboardRouter);
adminRouter.use('/healthcare', adminHealthcareRouter);
adminRouter.use('/analytics', adminAnalyticsRouter);
adminRouter.use('/system', adminSystemRouter);

export default adminRouter;