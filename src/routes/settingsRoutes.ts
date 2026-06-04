/*
 * SETTINGS ROUTES — Pengaturan Sistem
 * Base URL: /api/settings
 *
 * - GET /hotline → Public (tanpa login)
 * - PUT /hotline → Super Admin only
 */
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { getHotlineSettings, updateHotlineSettings } from '../controllers/settingsController';

const router = Router();

// GET /api/settings/hotline — Ambil info kontak hotline (public)
router.get('/hotline', getHotlineSettings);

// PUT /api/settings/hotline — Update info kontak hotline (Super Admin only)
router.put('/hotline', verifyToken, authorizeRole('super_admin'), updateHotlineSettings);

export default router;
