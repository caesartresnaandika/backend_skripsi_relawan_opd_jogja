import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAuditLogs } from '../controllers/logController';

const router = Router();

// Logs sangat sensitif, hanya super admin yang boleh melihat
router.use(verifyToken, authorizeRole('super_admin'));

// GET /api/admin/logs
// Mendukung query params: ?page=1&limit=10&action_type=INSERT&start_date=YYYY-MM-DD
router.get('/', getAuditLogs);

export default router;
