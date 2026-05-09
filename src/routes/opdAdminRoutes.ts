//opdAdminRoutes.ts
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
    createRelawanByOpd, // ✨ Tambahan baru (untuk nanti)
    createBulkRelawanByOpd,
    updateRelawanByOpd,
    deletePenugasanByOpd, // ✨ Tambahan baru (untuk nanti)
    getPengajuanPerubahanByOpd,
    reviewPengajuanByOpd
} from '../controllers/opdRelawanController';

const router = Router();

router.use(verifyToken, authorizeRole('opd'));
router.use(requireOpdContext);

// 1. Dashboard Statistik
router.get('/dashboard', getOpdDashboardStats);

// 2. Manajemen Kader
router.get('/kader', getKaderByOpd);
router.post('/kader', createKaderByOpd); // (Manual)
router.post('/kader/bulk', createBulkKaderByOpd); // ✨ (Excel Bulk khusus OPD)
router.patch('/kader/:id', updateKaderByOpd);
router.delete('/kader/:id', deleteKaderByOpd);
router.get('/kader/:id/pic-history', getPicKaderHistory);
router.post('/kader/:id/assign-pic', assignPicKader);
router.patch('/kader/:id/status', toggleKaderStatus);

// 3. Data Relawan & Surat Keputusan
router.get('/relawan', getRelawanByOpd);
router.post('/relawan', createRelawanByOpd); // ✨ (Manual khusus OPD)
router.post('/relawan/bulk', createBulkRelawanByOpd); // ✨ (Excel Bulk khusus OPD)
router.get('/sk', getSkByOpd);
router.put('/relawan/:relawan_id', updateRelawanByOpd);
router.delete('/relawan/penugasan/:penugasan_id', deletePenugasanByOpd);

// 4. Pengajuan Perubahan Data (Khusus OPD)
// TARUH DI ATAS /relawan/:id JIKA ADA AGAR TIDAK BENTROK
router.get('/relawan/pengajuan', getPengajuanPerubahanByOpd);
router.post('/relawan/pengajuan/:id/review', reviewPengajuanByOpd);


export default router;