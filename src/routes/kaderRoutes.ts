import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import {
    getAllKader,
    getKaderById,
    createKader,
    updateKader,
    deleteKader,
    toggleKaderStatus
} from '../controllers/kaderController';

const router = Router();

// Semua route dilindungi Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// GET /api/kader          → semua kader
// GET /api/kader?opd_id=1 → kader berdasarkan OPD
router.get('/', getAllKader);

// GET /api/kader/:id
router.get('/:id', getKaderById);

// POST /api/kader
router.post('/', createKader);

// PUT /api/kader/:id
router.put('/:id', updateKader);

// DELETE /api/kader/:id
router.delete('/:id', deleteKader);

// PATCH /api/kader/:id/status
router.patch('/:id/status', toggleKaderStatus);

export default router;