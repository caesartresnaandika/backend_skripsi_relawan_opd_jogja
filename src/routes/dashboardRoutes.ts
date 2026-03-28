import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.use(verifyToken as any, authorizeRole('super_admin', 'opd') as any);
router.get('/', getDashboardStats as any);

export default router;