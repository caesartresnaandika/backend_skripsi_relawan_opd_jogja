import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireOpdContext } from '../middleware/opdMiddleware';
import { getOpdDashboardStats } from '../controllers/opdDashboardController';
import {
    getKaderByOpd,
    createKaderByOpd,
    updateKaderByOpd,
    deleteKaderByOpd,
    createBulkKaderByOpd
} from '../controllers/kaderController';
import { 
    getRelawanByOpd, 
    getSkByOpd,
    createRelawanByOpd,
    createBulkRelawanByOpd
} from '../controllers/opdRelawanController';

const router = Router();

router.use(verifyToken as any, authorizeRole('opd') as any);
router.use(requireOpdContext as any);

router.get('/dashboard', getOpdDashboardStats as any);
router.get('/kader', getKaderByOpd as any);
router.post('/kader', createKaderByOpd as any);
router.post('/kader/bulk', createBulkKaderByOpd as any);
router.patch('/kader/:id', updateKaderByOpd as any);
router.delete('/kader/:id', deleteKaderByOpd as any);
router.get('/relawan', getRelawanByOpd as any);
router.post('/relawan', createRelawanByOpd as any);
router.post('/relawan/bulk', createBulkRelawanByOpd as any);
router.get('/sk', getSkByOpd as any);

export default router;