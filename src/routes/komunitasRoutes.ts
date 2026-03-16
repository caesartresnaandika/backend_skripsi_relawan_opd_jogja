import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import {
    getAllKader,
    getKaderById,
    createKader,
    updateKader,
    deleteKader,
    toggleKaderStatus
} from '../controllers/komunitasController';

const router = Router();

// Semua route dilindungi Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// URL: GET /api/kader          → semua kader
// URL: GET /api/kader?opd_id=1 → kader berdasarkan OPD
router.get('/', getAllKader);

// URL: GET /api/kader/:id
router.get('/:id', getKaderById);

// URL: POST /api/kader
router.post('/', createKader);

// URL: PUT /api/kader/:id
router.put('/:id', updateKader);

// URL: DELETE /api/kader/:id
router.delete('/:id', deleteKader);

// URL: PATCH /api/kader/:id/status
router.patch('/:id/status', toggleKaderStatus);

export default router;
