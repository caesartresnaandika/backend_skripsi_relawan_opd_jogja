import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

// Endpoint dilindungi, khusus Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// GET /api/admin/dashboard
router.get('/', getDashboardStats);

export default router;
