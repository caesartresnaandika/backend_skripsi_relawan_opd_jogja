/*
 * AUTH ROUTES — Autentikasi (Public)
 * Base URL: /api/auth
 */
import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// POST /api/auth/register — Daftar akun baru (dilindungi setup key)
router.post('/register', register);

// POST /api/auth/login — Login (NIK + Password) → dapat token JWT
router.post('/login', login);

export default router;