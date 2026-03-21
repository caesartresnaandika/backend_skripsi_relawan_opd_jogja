import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware';
import { changePassword } from '../controllers/profileController';

const router = Router();

// Semua role yang sudah login bisa akses
router.use(verifyToken);

// PATCH /api/profile/change-password
router.patch('/change-password', changePassword);

export default router;