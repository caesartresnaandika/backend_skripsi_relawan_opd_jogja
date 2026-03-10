import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { 
    getAllRelawan, 
    getRelawanById, 
    getPengajuanPerubahanDaftar, 
    reviewPengajuan 
} from '../controllers/relawanAdminController';

const router = Router();

// Semua rute ini wajib dilindungi dari akses non Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// URL: GET http://localhost:3000/api/admin/relawan
router.get('/', getAllRelawan);

// URL: GET http://localhost:3000/api/admin/relawan/pengajuan
// TARUH PENGAJUAN DI ATAS /:id AGAR TIDAK BENTROK DENGAN BACA PARAMETER ID
router.get('/pengajuan', getPengajuanPerubahanDaftar);

// URL: GET http://localhost:3000/api/admin/relawan/:id
router.get('/:id', getRelawanById);

// URL: POST http://localhost:3000/api/admin/relawan/pengajuan/:id/review
router.post('/pengajuan/:id/review', reviewPengajuan);

export default router;
