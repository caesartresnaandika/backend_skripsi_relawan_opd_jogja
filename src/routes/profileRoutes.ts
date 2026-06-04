/*
 * PROFILE ROUTES — Manajemen Profil (Semua Role)
 * Base URL: /api/profile
 * Semua role yang sudah login bisa mengakses (hanya verifyToken, tanpa authorizeRole).
 */
import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware';
import { getMyProfile, updateMyProfile, changePassword } from '../controllers/profileController';

const router = Router();

// Semua route dilindungi — hanya user yang login bisa akses
router.use(verifyToken);

// GET    /api/profile/me — Ambil data profil user yang login
router.get('/me', getMyProfile);

// PUT    /api/profile/update — Update nama & no_hp
router.put('/update', updateMyProfile);

// PATCH  /api/profile/change-password — Ganti password
router.patch('/change-password', changePassword);

export default router;