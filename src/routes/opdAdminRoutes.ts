import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireOpdContext } from '../middleware/opdMiddleware';
import { getOpdDashboardStats } from '../controllers/opdDashboardController';
import {
    getKaderByOpd,
    createKaderByOpd,
    updateKaderByOpd,
    deleteKaderByOpd
} from '../controllers/kaderController';
import { getRelawanByOpd, getSkByOpd } from '../controllers/opdRelawanController';

const router = Router();

// Middleware Lapis 1: Cek Token JWT dan pastikan role-nya adalah 'opd'
router.use(verifyToken, authorizeRole('opd'));

// Middleware Lapis 2: Cek apakah user OPD ini punya opd_id (terdaftar di tabel pengelola_opd)
router.use(requireOpdContext);

// ==========================================
// Kumpulan Endpoint API Khusus Admin OPD
// ==========================================

// 1. Dashboard Statistik
router.get('/dashboard', getOpdDashboardStats);

// 2. Manajemen Kader
router.get('/kader', getKaderByOpd);
router.post('/kader', createKaderByOpd);
router.patch('/kader/:id', updateKaderByOpd);
router.delete('/kader/:id', deleteKaderByOpd);

// 3. Data Relawan & Surat Keputusan
router.get('/relawan', getRelawanByOpd);
router.get('/sk', getSkByOpd);

export default router;