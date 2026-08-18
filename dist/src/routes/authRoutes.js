"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * AUTH ROUTES — Autentikasi (Public)
 * Base URL: /api/auth
 */
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// POST /api/auth/register — Daftar akun baru (dilindungi setup key)
router.post('/register', authController_1.register);
// POST /api/auth/login — Login (NIK + Password) → dapat token JWT
router.post('/login', authController_1.login);
exports.default = router;
