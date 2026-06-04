/*
 * LOG ROUTES — Audit Log (Super Admin only)
 * Base URL: /api/admin/logs
 * Log sangat sensitif — hanya Super Admin yang boleh mengakses.
 *
 * Query params: ?page=&limit=&action_type=&start_date=&end_date=&user_id=
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAuditLogs } from '../controllers/logController';

const router = Router();

// Hanya Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// GET /api/admin/logs — Log aktivitas dengan filter & pagination
router.get('/', getAuditLogs);

export default router;
