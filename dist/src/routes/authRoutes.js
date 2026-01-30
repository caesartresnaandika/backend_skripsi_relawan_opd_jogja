"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// URL: http://localhost:3000/api/auth/register
router.post('/register', authController_1.register);
// URL: http://localhost:3000/api/auth/login
router.post('/login', authController_1.login);
exports.default = router;
