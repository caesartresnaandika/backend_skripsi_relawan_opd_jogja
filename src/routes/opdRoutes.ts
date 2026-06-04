/*
 * OPD ROUTES — Manajemen OPD (Super Admin only)
 * Base URL: /api/opd
 * Semua endpoint dilindungi verifyToken + authorizeRole('super_admin')
 */
import { Router } from 'express';
import { getAllOpd, getOpdById, createOpd, createBulkOpd, updateOpd, toggleOpdStatus } from '../controllers/opdController';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// GET  /api/opd — Daftar semua OPD
router.get('/', verifyToken, authorizeRole('super_admin'), getAllOpd);

// GET  /api/opd/:id — Detail OPD
router.get('/:id', verifyToken, authorizeRole('super_admin'), getOpdById);

// POST /api/opd/bulk — Import OPD dari Excel
router.post('/bulk', verifyToken, authorizeRole('super_admin'), createBulkOpd);

// POST /api/opd — Tambah OPD baru (+ buat akun admin OPD)
router.post('/', verifyToken, authorizeRole('super_admin'), createOpd);

// PUT  /api/opd/:id — Update data OPD
router.put('/:id', verifyToken, authorizeRole('super_admin'), updateOpd);

// PATCH /api/opd/:id/status — Aktif/nonaktifkan OPD
router.patch('/:id/status', verifyToken, authorizeRole('super_admin'), toggleOpdStatus);

export default router;