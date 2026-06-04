/*
 * STATISTIK ROUTES — Data Chart & Grafik (Semua Role)
 * Base URL: /api/statistik
 * Semua role yang login bisa akses.
 * Middleware attachOpdId memastikan req.user.opd_id tersedia untuk role OPD.
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { attachOpdId } from '../middleware/opdMiddleware';
import {
    getStatistikGender,
    getStatistikKelurahan,
    getRelawanPerKader,
    getKaderPerOPD,
} from '../controllers/statistikController';

const router = Router();

// Semua route: butuh login + attach OPD context (jika role OPD)
router.use(verifyToken);
router.use(attachOpdId);

// GET /api/statistik/gender — Demografi gender
router.get('/gender', getStatistikGender);

// GET /api/statistik/kelurahan — Top 5 kelurahan
router.get('/kelurahan', getStatistikKelurahan);

// GET /api/statistik/relawan-per-kader — Relawan per kader
router.get('/relawan-per-kader', getRelawanPerKader);

// GET /api/statistik/kader-per-opd — Kader per OPD
router.get('/kader-per-opd', getKaderPerOPD);

export default router;