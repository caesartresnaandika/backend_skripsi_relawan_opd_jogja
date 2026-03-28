import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireRelawanContext } from '../middleware/relawanMiddleware';
import { getRelawanDashboardStats } from '../controllers/relawanDashboardController';
import { getMyProfile, requestProfileUpdate } from '../controllers/relawanProfileController';
import { getMyHistory } from '../controllers/relawanHistoryController';

const router = Router();

router.use(verifyToken as any, authorizeRole('relawan') as any);
router.use(requireRelawanContext as any);

router.get('/dashboard', getRelawanDashboardStats as any);
router.get('/profile', getMyProfile as any);
router.post('/profile/update', requestProfileUpdate as any);
router.get('/history', getMyHistory as any);

export default router;