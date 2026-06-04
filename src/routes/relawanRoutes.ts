/*
 * RELAWAN ROUTES — Khusus role relawan
 * Base URL: /api/relawan
 * Middleware: verifyToken + authorizeRole('relawan') + requireRelawanContext
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireRelawanContext } from '../middleware/relawanMiddleware';
import { getRelawanDashboardStats } from '../controllers/relawanDashboardController';
import { getMyProfile, requestProfileUpdate, getMyPenugasan, changePassword, verifyCurrentPassword } from '../controllers/relawanProfileController';
import { getMyHistory } from '../controllers/relawanHistoryController';

const router = Router();

// Lapis 1: Verifikasi token + pastikan role 'relawan'
router.use(verifyToken, authorizeRole('relawan'));

// Lapis 2: Ambil relawan_id dari database dan attach ke request
router.use(requireRelawanContext);

// GET  /api/relawan/dashboard — Statistik dashboard relawan
router.get('/dashboard', getRelawanDashboardStats);

// GET  /api/relawan/profile — Biodata relawan
router.get('/profile', getMyProfile);
// POST /api/relawan/profile/update — Ajukan perubahan biodata (masuk antrean review)
router.post('/profile/update', requestProfileUpdate);

// GET /api/relawan/history — Riwayat penugasan & pengajuan
router.get('/history', getMyHistory);

// GET /api/relawan/penugasan — Daftar penugasan aktif
router.get('/penugasan', getMyPenugasan);

// POST /api/relawan/verify-password — Verifikasi password (real-time)
router.post('/verify-password', verifyCurrentPassword);
// POST /api/relawan/change-password — Ganti password
router.post('/change-password', changePassword);

export default router;