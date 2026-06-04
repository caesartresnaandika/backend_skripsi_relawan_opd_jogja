/*
 * SARAN ROUTES — Feedback/Saran Masukan
 * Base URL: /api/saran
 *
 * - POST / → Semua role yang login bisa kirim saran
 * - GET /admin → Super Admin lihat semua saran
 * - PATCH /admin/:id/baca → Super Admin update status saran
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAllSaran, createSaran, updateStatusBaca } from '../controllers/saranController';

const router = Router();

// POST /api/saran — Kirim saran (semua role yang login)
router.post('/', verifyToken, createSaran);

// GET  /api/saran/admin — Lihat kotak masuk saran (Super Admin only)
router.get('/admin', verifyToken, authorizeRole('super_admin'), getAllSaran);

// PATCH /api/saran/admin/:id/baca — Tandai saran sebagai selesai (Super Admin only)
router.patch('/admin/:id/baca', verifyToken, authorizeRole('super_admin'), updateStatusBaca);

export default router;
