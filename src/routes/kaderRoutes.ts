//kaderRoutes.ts
import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import {
    getAllKader,
    getKaderById,
    createKader,
    createBulkKader,
    updateKader,
    deleteKader,
    toggleKaderStatus,
    assignPicKader,
    getPicKaderHistory
} from '../controllers/kaderController';

const router = Router();

router.use(verifyToken, authorizeRole('super_admin'));

router.get('/', getAllKader);

router.post('/bulk', createBulkKader);

router.get('/:id', getKaderById);
router.post('/', createKader);
router.put('/:id', updateKader);
router.delete('/:id', deleteKader);
router.patch('/:id/status', toggleKaderStatus);
router.get('/:id/pic-history', getPicKaderHistory);
router.post('/:id/assign-pic', assignPicKader);

export default router;