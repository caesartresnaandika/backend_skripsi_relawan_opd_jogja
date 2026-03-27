//opdAdminRoutes.ts
import { Router } from 'express';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import bcrypt from 'bcrypt';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireOpdContext } from '../middleware/opdMiddleware';
import { getOpdDashboardStats } from '../controllers/opdDashboardController';
import {
    getKaderByOpd,
    createKaderByOpd,
    updateKaderByOpd,
    deleteKaderByOpd,
    createBulkKaderByOpd // ✨ Tambahan baru
} from '../controllers/kaderController';
import { 
    getRelawanByOpd, 
    getSkByOpd,
    createRelawanByOpd, // ✨ Tambahan baru (untuk nanti)
    createBulkRelawanByOpd // ✨ Tambahan baru (untuk nanti)
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
// 🚨 router.patch('/kader/:id/status', toggleKaderStatus); <-- BARIS INI SUDAH DIHAPUS DEMI KEAMANAN!

// 3. Data Relawan & Surat Keputusan
router.get('/relawan', getRelawanByOpd);
router.post('/relawan', createRelawanByOpd); // ✨ (Manual khusus OPD)
router.post('/relawan/bulk', createBulkRelawanByOpd); // ✨ (Excel Bulk khusus OPD)
router.get('/sk', getSkByOpd);

export default router;