import { Router } from 'express';
import { getMyTagihan } from '../controllers/bpjsController';
import verifyToken from '../middleware/authMiddleware';

const router = Router();

router.get('/my-tagihan', verifyToken, getMyTagihan);

export default router;