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
    deleteSK
} from '../controllers/skController';

const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file PDF yang diperbolehkan'));
        }
    }
});

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

router.use(verifyToken as any, authorizeRole('super_admin', 'opd') as any);

router.get('/', getAllSK as any);
router.get('/opd-list', getOPDList as any);
router.post('/', upload.single('file'), handleMulterError, createSK as any);
router.get('/:id', getSKById as any);
router.get('/:id/pdf', getSKPdf as any);
router.patch('/:id/status', updateSKStatus as any);
router.delete('/:id', deleteSK as any);

export default router;