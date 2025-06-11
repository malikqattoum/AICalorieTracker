import { Router } from 'express';
import adminUsersRouter from './users';
import adminDataRouter from './data';
import adminConfigRouter from './config';
import adminContentRouter from './content'; // For existing site content management
import adminLanguagesRouter from './languages';
import adminTranslationsRouter from './translations';

const adminRouter = Router();

adminRouter.use('/users', adminUsersRouter);
adminRouter.use('/data', adminDataRouter);
adminRouter.use('/config', adminConfigRouter);
adminRouter.use('/content', adminContentRouter); // Using the new structure for content
adminRouter.use('/languages', adminLanguagesRouter);
adminRouter.use('/translations', adminTranslationsRouter);

export default adminRouter;