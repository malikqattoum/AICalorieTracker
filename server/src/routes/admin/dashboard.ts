import { Router } from 'express';
import AdminController from '../../controllers/adminController';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

// GET /api/admin/analytics
router.get('/analytics', AdminController.getAnalytics);

// GET /api/admin/users
router.get('/users', AdminController.listUsers);

// PUT /api/admin/users/:id
router.put('/users/:id', AdminController.updateUser);

// POST /api/admin/content
router.post('/content', AdminController.updateContent);

// GET /api/admin/backups
router.get('/backups', AdminController.listBackups);

// POST /api/admin/backups
router.post('/backups', AdminController.createBackup);

export default router;