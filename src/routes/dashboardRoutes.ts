/*
 * DASHBOARD ROUTES — Statistik Dashboard (Super Admin & OPD)
 * Base URL: /api/admin/dashboard
 * Middleware: verifyToken + authorizeRole('super_admin', 'opd')
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

// Semua route dilindungi
router.use(verifyToken, authorizeRole('super_admin', 'opd'));

// GET /api/admin/dashboard — Statistik dashboard
router.get('/', getDashboardStats);

export default router;
