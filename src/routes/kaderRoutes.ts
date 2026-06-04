/*
 * KADER ROUTES (Super Admin) — Manajemen Kader Global
 * Base URL: /api/kader
 * Semua route: verifyToken + authorizeRole('super_admin')
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import {
    getAllKader,
    getKaderById,
    createKader,
    createBulkKader,
    updateKader,
    deleteKader,
    toggleKaderStatus,
    assignPicKader,
    getPicKaderHistory
} from '../controllers/kaderController';

const router = Router();

router.use(verifyToken, authorizeRole('super_admin'));

// GET  /api/kader — Daftar semua kader (opsional ?opd_id=)
router.get('/', getAllKader);

// POST /api/kader/bulk — Import kader dari Excel
router.post('/bulk', createBulkKader);

// GET  /api/kader/:id — Detail kader
router.get('/:id', getKaderById);

// POST /api/kader — Tambah kader baru
router.post('/', createKader);

// PUT  /api/kader/:id — Update kader
router.put('/:id', updateKader);

// DELETE /api/kader/:id — Hapus kader
router.delete('/:id', deleteKader);

// PATCH /api/kader/:id/status — Aktif/nonaktifkan kader
router.patch('/:id/status', toggleKaderStatus);

// GET  /api/kader/:id/pic-history — Riwayat PIC kader
router.get('/:id/pic-history', getPicKaderHistory);

// POST /api/kader/:id/assign-pic — Ganti PIC kader
router.post('/:id/assign-pic', assignPicKader);

export default router;