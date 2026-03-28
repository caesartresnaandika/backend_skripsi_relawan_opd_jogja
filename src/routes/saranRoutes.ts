import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getAllSaran, createSaran, updateStatusBaca } from '../controllers/saranController';

const router = Router();

// =========================================================
// Endpoint publik (butuh login, semua role bisa kirim saran)
// =========================================================

// POST /api/saran  — Kirim saran (Relawan, OPD, atau siapapun yang login)
router.post('/', verifyToken, createSaran);

// =========================================================
// Endpoint khusus Super Admin
// =========================================================

// GET /api/saran/admin  — Lihat semua kotak masuk saran
router.get('/admin', verifyToken, authorizeRole('super_admin'), getAllSaran);

// PATCH /api/saran/admin/:id/baca  — Toggle status baca
router.patch('/admin/:id/baca', verifyToken, authorizeRole('super_admin'), updateStatusBaca);

export default router;
