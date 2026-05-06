//skRoutes.ts
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import multer from 'multer';
import { 
    getAllSK,
    getSKById,
    getSKPdf,
    getOPDList,
    createSK,
    updateSKStatus,
    deleteSK,
    getKaderListForSK
} from '../controllers/skController';

const router = Router();

// Konfigurasi Multer untuk upload file PDF
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file PDF yang diperbolehkan'));
        }
    }
});

// Middleware untuk handle error multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ukuran file terlalu besar. Maksimal 2MB.',
                error_code: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

// Protect all routes - hanya super_admin dan opd yang bisa akses
router.use(verifyToken, authorizeRole('super_admin', 'opd'));

// URL: GET /api/admin/sk
router.get('/', getAllSK);

// URL: GET /api/admin/sk/opd-list (Dropdown OPD)
router.get('/opd-list', getOPDList);

// URL: GET /api/admin/sk/kader-list?opd_id=1 (Dropdown Kader untuk upload SK)
router.get('/kader-list', getKaderListForSK);

// URL: POST /api/admin/sk (Upload PDF)
router.post('/', upload.single('file'), handleMulterError, createSK);

// URL: GET /api/admin/sk/:id
router.get('/:id', getSKById);

// URL: GET /api/admin/sk/:id/pdf
router.get('/:id/pdf', getSKPdf);

// URL: PATCH /api/admin/sk/:id/status
router.patch('/:id/status', updateSKStatus);

// URL: DELETE /api/admin/sk/:id
router.delete('/:id', deleteSK);

export default router;