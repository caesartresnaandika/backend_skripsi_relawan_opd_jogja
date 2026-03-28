import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { 
    getAllRelawan, 
    getRelawanById, 
    getPengajuanPerubahanDaftar, 
    reviewPengajuan,
    createBulkRelawan,
    createRelawan,
    getkaderByOpd
} from '../controllers/relawanAdminController';

const router = Router();

router.use(verifyToken as any, authorizeRole('super_admin') as any);

router.get('/', getAllRelawan as any);
router.post('/', createRelawan as any);
router.post('/bulk', createBulkRelawan as any);
router.get('/kader', getkaderByOpd as any);
router.get('/pengajuan', getPengajuanPerubahanDaftar as any);
router.get('/:id', getRelawanById as any);
router.post('/pengajuan/:id/review', reviewPengajuan as any);

export default router;