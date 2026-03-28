import { Router } from 'express';
import { getAllOpd, getOpdById, createOpd, createBulkOpd, updateOpd, toggleOpdStatus } from '../controllers/opdController';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', verifyToken as any, authorizeRole('super_admin') as any, getAllOpd as any);
router.get('/:id', verifyToken as any, authorizeRole('super_admin') as any, getOpdById as any);
router.post('/bulk', verifyToken as any, authorizeRole('super_admin') as any, createBulkOpd as any);
router.post('/', verifyToken as any, authorizeRole('super_admin') as any, createOpd as any);
router.put('/:id', verifyToken as any, authorizeRole('super_admin') as any, updateOpd as any);
router.patch('/:id/status', verifyToken as any, authorizeRole('super_admin') as any, toggleOpdStatus as any);

export default router;