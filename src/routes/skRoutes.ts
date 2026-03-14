import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import multer from 'multer';
import { 
    getAllSK,
    getSKById,
    createSKDetail,
    updateSKStatus
} from '../controllers/skController';

const router = Router();

// Konfigurasi Multer untuk upload file (kita gunakan memoryStorage dulu untuk dikirim ke cloud storage/disimpan ke lokal nantinya)
// Atau untuk simple demo: diskStorage. Kita pakai memoryStorage biar mudah dimodifikasi nantinya ke S3/Supabase Storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Endpoint ini wajib dilindungi khusus untuk Super Admin
router.use(verifyToken, authorizeRole('super_admin'));

// URL: GET http://localhost:3000/api/admin/sk
router.get('/', getAllSK);

// URL: POST http://localhost:3000/api/admin/sk
// Gunakan middleware upload.single('file') untuk memproses form-data dengan nama field 'file'
router.post('/', upload.single('file'), createSKDetail);

// URL: GET http://localhost:3000/api/admin/sk/:id  (TARUH DI BAWAH RUTE STATIS JIKA ADA)
router.get('/:id', getSKById);

// URL: PATCH http://localhost:3000/api/admin/sk/:id/status
router.patch('/:id/status', updateSKStatus);

export default router;
