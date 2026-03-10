import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { 
    getAllSK,
    getSKById,
    createSKDetail,
    updateSKStatus
} from '../controllers/skController';

const router = Router();

// Endpoint ini wajib dilindungi khusus untuk Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// URL: GET http://localhost:3000/api/admin/sk
router.get('/', getAllSK);

// URL: POST http://localhost:3000/api/admin/sk
router.post('/', createSKDetail);

// URL: GET http://localhost:3000/api/admin/sk/:id  (TARUH DI BAWAH RUTE STATIS JIKA ADA)
router.get('/:id', getSKById);

// URL: PATCH http://localhost:3000/api/admin/sk/:id/status
router.patch('/:id/status', updateSKStatus);

export default router;
