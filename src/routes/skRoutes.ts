/*
 * SK ROUTES — Surat Keputusan (Super Admin & OPD)
 * Base URL: /api/admin/sk
 * Melindungi semua route dengan verifyToken + authorizeRole('super_admin', 'opd')
 *
 * Fitur khusus:
 * - Upload file PDF (max 2MB) menggunakan multer memoryStorage
 * - File disimpan sebagai base64 string di database
 */
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

// Konfigurasi Multer: upload file PDF ke memory (buffer), max 2MB
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

// Middleware error handler khusus untuk multer
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

// Semua route dilindungi — Super Admin dan OPD bisa akses
router.use(verifyToken, authorizeRole('super_admin', 'opd'));

// GET  /api/admin/sk — Daftar semua SK
router.get('/', getAllSK);

// GET  /api/admin/sk/opd-list — Dropdown OPD
router.get('/opd-list', getOPDList);

// GET  /api/admin/sk/kader-list?opd_id= — Dropdown kader untuk target SK
router.get('/kader-list', getKaderListForSK);

// POST /api/admin/sk — Buat SK baru (+ upload PDF)
router.post('/', upload.single('file'), handleMulterError, createSK);

// GET  /api/admin/sk/:id — Detail SK + daftar relawan
router.get('/:id', getSKById);

// GET  /api/admin/sk/:id/pdf — Ambil file PDF SK
router.get('/:id/pdf', getSKPdf);

// PATCH /api/admin/sk/:id/status — Update status SK
router.patch('/:id/status', updateSKStatus);

// DELETE /api/admin/sk/:id — Hapus SK
router.delete('/:id', deleteSK);

export default router;