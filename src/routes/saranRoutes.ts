import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAllSaran, createSaran, updateStatusBaca } from '../controllers/saranController';

const router = Router();

router.post('/', verifyToken as any, createSaran as any);
router.get('/admin', verifyToken as any, authorizeRole('super_admin') as any, getAllSaran as any);
router.patch('/admin/:id/baca', verifyToken as any, authorizeRole('super_admin') as any, updateStatusBaca as any);

export default router;