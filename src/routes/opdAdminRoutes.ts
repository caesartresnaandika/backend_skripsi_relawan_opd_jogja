/*
 * OPD ADMIN ROUTES — Dashboard & Manajemen Internal OPD
 * Base URL: /api/opd-admin
 * Middleware: verifyToken + authorizeRole('opd') + requireOpdContext
 *
 * Admin OPD bisa mengelola:
 * - Dashboard statistik OPD-nya
 * - Kader (CRUD + bulk import + assign PIC)
 * - Relawan (CRUD + bulk import + review pengajuan)
 * - SK (melihat daftar SK milik OPD-nya)
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireOpdContext } from '../middleware/opdMiddleware';
import { getOpdDashboardStats } from '../controllers/opdDashboardController';
import {
    getKaderByOpd,
    createKaderByOpd,
    updateKaderByOpd,
    deleteKaderByOpd,
    createBulkKaderByOpd,
    assignPicKader,
    getPicKaderHistory,
    toggleKaderStatus
} from '../controllers/kaderController';
import {
    getRelawanByOpd,
    getSkByOpd,
    createRelawanByOpd,
    createBulkRelawanByOpd,
    updateRelawanByOpd,
    deletePenugasanByOpd,
    getPengajuanPerubahanByOpd,
    reviewPengajuanByOpd
} from '../controllers/opdRelawanController';

const router = Router();

// Autentikasi + ambil konteks OPD
router.use(verifyToken, authorizeRole('opd'));
router.use(requireOpdContext);

// ─── 1. Dashboard ───
router.get('/dashboard', getOpdDashboardStats);

// ─── 2. Manajemen Kader ───
router.get('/kader', getKaderByOpd);
router.post('/kader', createKaderByOpd);
router.post('/kader/bulk', createBulkKaderByOpd);
router.patch('/kader/:id', updateKaderByOpd);
router.delete('/kader/:id', deleteKaderByOpd);
router.get('/kader/:id/pic-history', getPicKaderHistory);
router.post('/kader/:id/assign-pic', assignPicKader);
router.patch('/kader/:id/status', toggleKaderStatus);

// ─── 3. Data Relawan & SK ───
router.get('/relawan', getRelawanByOpd);
router.post('/relawan', createRelawanByOpd);
router.post('/relawan/bulk', createBulkRelawanByOpd);
router.get('/sk', getSkByOpd);
router.put('/relawan/:relawan_id', updateRelawanByOpd);
router.delete('/relawan/penugasan/:penugasan_id', deletePenugasanByOpd);

// ─── 4. Pengajuan Perubahan Data ───
// ⚠️ Ditempatkan sebelum /relawan/:id agar tidak bentrok
router.get('/relawan/pengajuan', getPengajuanPerubahanByOpd);
router.post('/relawan/pengajuan/:id/review', reviewPengajuanByOpd);

export default router;