/*
 * LOG ROUTES — Audit Log (Super Admin only)
 * Base URL: /api/admin/logs
 * Log sangat sensitif — hanya Super Admin yang boleh mengakses.
 *
 * Query params: ?page=&limit=&action_type=&start_date=&end_date=&user_id=&q=
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAuditLogs, getAuditLogById } from '../controllers/logController';

const router = Router();

// Hanya Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// GET /api/admin/logs — Log aktivitas dengan filter & pagination (list view)
router.get('/', getAuditLogs);

// GET /api/admin/logs/:id — Detail log aktivitas (diff old/new values)
router.get('/:id', getAuditLogById);

export default router;

