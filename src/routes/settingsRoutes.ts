import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getHotlineSettings, updateHotlineSettings } from '../controllers/settingsController';

const router = Router();

// Endpoint publik (bisa diakses siapa saja yang butuh info kontak)
router.get('/hotline', getHotlineSettings);

// Endpoint khusus Super Admin untuk update hotline
router.put('/hotline', verifyToken, authorizeRole('super_admin'), updateHotlineSettings);

export default router;
