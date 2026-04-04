//authRoutes.ts
import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// URL: http://localhost:3000/api/auth/register
router.post('/register', register);

// URL: http://localhost:3000/api/auth/login
router.post('/login', login);

export default router;