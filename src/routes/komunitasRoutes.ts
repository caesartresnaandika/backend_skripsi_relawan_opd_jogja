import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import {
    getAllKomunitas,
    getKomunitasById,
    createKomunitas,
    updateKomunitas,
    deleteKomunitas
} from '../controllers/komunitasController';

const router = Router();

// Semua route dilindungi Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// URL: GET /api/komunitas          → semua komunitas
// URL: GET /api/komunitas?opd_id=1 → komunitas berdasarkan OPD
router.get('/', getAllKomunitas);

// URL: GET /api/komunitas/:id
router.get('/:id', getKomunitasById);

// URL: POST /api/komunitas
router.post('/', createKomunitas);

// URL: PUT /api/komunitas/:id
router.put('/:id', updateKomunitas);

// URL: DELETE /api/komunitas/:id
router.delete('/:id', deleteKomunitas);

export default router;
