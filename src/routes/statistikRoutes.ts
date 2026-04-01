import { Router } from 'express';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';
import { attachOpdId } from '../middleware/opdMiddleware'; // middleware yg attach opd_id ke req.user
import {
    getStatistikGender,
    getStatistikKelurahan,
    getRelawanPerKader,
    getKaderPerOPD,
} from '../controllers/statistikController';

const router = Router();

router.use(verifyToken);
router.use(attachOpdId); // pastikan req.user.opd_id tersedia untuk role OPD

router.get('/gender', getStatistikGender);
router.get('/kelurahan', getStatistikKelurahan);
router.get('/relawan-per-kader', getRelawanPerKader);
router.get('/kader-per-opd', getKaderPerOPD);

export default router;