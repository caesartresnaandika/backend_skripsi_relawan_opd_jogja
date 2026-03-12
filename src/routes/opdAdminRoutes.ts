import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { requireOpdContext } from '../middleware/opdMiddleware';
import { getOpdDashboardStats } from '../controllers/opdDashboardController';
import { getKaderByOpd, createKader, updateKader, deleteKader } from '../controllers/kaderController';
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

// 2. Manajemen Kader / Komunitas
router.get('/kader', getKaderByOpd);
router.post('/kader', createKader);
router.patch('/kader/:id', updateKader);
router.delete('/kader/:id', deleteKader);

// 3. Data Relawan & Surat Keputusan (Sudah difilter otomatis by opd_id)
router.get('/relawan', getRelawanByOpd);
router.get('/sk', getSkByOpd);

export default router;
