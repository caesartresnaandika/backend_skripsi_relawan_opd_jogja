/*
 * RELAWAN ADMIN ROUTES — Manajemen relawan (Super Admin only)
 * Base URL: /api/admin/relawan
 * Semua endpoint dilindungi verifyToken + authorizeRole('super_admin')
 *
 * ⚠️ URUTAN PENTING: Route /pengajuan harus SEBELUM /:id
 * agar Express tidak salah mengartikan 'pengajuan' sebagai parameter ID.
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { 
    getAllRelawan, 
    getRelawanById, 
    getPengajuanPerubahanDaftar, 
    reviewPengajuan,
    createBulkRelawan,
    createRelawan,
    getkaderByOpd,
    updateRelawan,
    deletePenugasan
} from '../controllers/relawanAdminController';

const router = Router();

// Semua route dilindungi — hanya Super Admin yang bisa akses
router.use(verifyToken, authorizeRole('super_admin'));

// GET  /api/admin/relawan — Daftar semua relawan
router.get('/', getAllRelawan);

// POST /api/admin/relawan — Tambah relawan manual
router.post('/', createRelawan);

// POST /api/admin/relawan/bulk — Import relawan dari Excel
router.post('/bulk', createBulkRelawan);

// GET  /api/admin/relawan/kader?opd_id= — Daftar kader untuk dropdown
router.get('/kader', getkaderByOpd);

// GET  /api/admin/relawan/pengajuan — Antrian pengajuan perubahan data
// ⚠️ HARUS DI ATAS /:id agar tidak bentrok!
router.get('/pengajuan', getPengajuanPerubahanDaftar);

// POST /api/admin/relawan/pengajuan/:id/review — Setujui/tolak pengajuan
// ⚠️ HARUS DI ATAS /:id agar tidak bentrok!
router.post('/pengajuan/:id/review', reviewPengajuan);

// DELETE /api/admin/relawan/penugasan/:penugasan_id — Hapus penugasan
router.delete('/penugasan/:penugasan_id', deletePenugasan);

// PUT /api/admin/relawan/:relawan_id — Update data relawan
router.put('/:relawan_id', updateRelawan);

// GET /api/admin/relawan/:id — Detail relawan
router.get('/:id', getRelawanById);

export default router;