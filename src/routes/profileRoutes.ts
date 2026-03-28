import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware';
import { changePassword } from '../controllers/profileController';

const router = Router();

router.use(verifyToken as any);
router.patch('/change-password', changePassword as any);

export default router;