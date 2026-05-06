import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireRelawanContext } from '../middleware/relawanMiddleware';
import { getRelawanDashboardStats } from '../controllers/relawanDashboardController';
import { getMyProfile, requestProfileUpdate, getMyPenugasan, changePassword } from '../controllers/relawanProfileController';
import { getMyHistory } from '../controllers/relawanHistoryController';

const router = Router();

// Middleware Lapis 1: Cek Token JWT dan pastikan role-nya adalah 'relawan'
router.use(verifyToken, authorizeRole('relawan'));

// Middleware Lapis 2: Ekstrak relawan_id secara otomatis ke dalam req object
router.use(requireRelawanContext);

// ==========================================
// Kumpulan Endpoint API Khusus Relawan
// ==========================================

// 1. Dashboard Relawan
router.get('/dashboard', getRelawanDashboardStats);

// 2. Profil Biodata
router.get('/profile', getMyProfile);
router.post('/profile/update', requestProfileUpdate);

// 3. Riwayat / History
router.get('/history', getMyHistory);

// 4. Penugasan
router.get('/penugasan', getMyPenugasan);

// 5. Ubah Password
router.post('/change-password', changePassword);

export default router;