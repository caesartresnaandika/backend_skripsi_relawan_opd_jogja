import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import {
    getAllKader,
    getKaderById,
    createKader,
    createBulkKader,
    updateKader,
    deleteKader,
    toggleKaderStatus
} from '../controllers/kaderController';

const router = Router();

// ✅ FIXED: Izinkan super_admin DAN opd
router.use(verifyToken as any, authorizeRole('super_admin', 'opd') as any);

router.get('/', getAllKader as any);
router.post('/bulk', createBulkKader as any);
router.get('/:id', getKaderById as any);
router.post('/', createKader as any);
router.put('/:id', updateKader as any);
router.delete('/:id', deleteKader as any);
router.patch('/:id/status', toggleKaderStatus as any);

export default router;