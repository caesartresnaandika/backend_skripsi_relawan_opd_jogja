import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAuditLogs } from '../controllers/logController';

const router = Router();

router.use(verifyToken as any, authorizeRole('super_admin') as any);
router.get('/', getAuditLogs as any);

export default router;