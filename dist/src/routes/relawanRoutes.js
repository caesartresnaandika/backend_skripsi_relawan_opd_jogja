"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * RELAWAN ROUTES — Khusus role relawan
 * Base URL: /api/relawan
 * Middleware: verifyToken + authorizeRole('relawan') + requireRelawanContext
 */
const express_1 = require("express");
const authMiddleware_1 = __importStar(require("../middleware/authMiddleware"));
const relawanMiddleware_1 = require("../middleware/relawanMiddleware");
const relawanDashboardController_1 = require("../controllers/relawanDashboardController");
const relawanProfileController_1 = require("../controllers/relawanProfileController");
const relawanHistoryController_1 = require("../controllers/relawanHistoryController");
const router = (0, express_1.Router)();
// Lapis 1: Verifikasi token + pastikan role 'relawan'
router.use(authMiddleware_1.default, (0, authMiddleware_1.authorizeRole)('relawan'));
// Lapis 2: Ambil relawan_id dari database dan attach ke request
router.use(relawanMiddleware_1.requireRelawanContext);
// GET  /api/relawan/dashboard — Statistik dashboard relawan
router.get('/dashboard', relawanDashboardController_1.getRelawanDashboardStats);
// GET  /api/relawan/profile — Biodata relawan
router.get('/profile', relawanProfileController_1.getMyProfile);
// POST /api/relawan/profile/update — Ajukan perubahan biodata (masuk antrean review)
router.post('/profile/update', relawanProfileController_1.requestProfileUpdate);
// GET /api/relawan/history — Riwayat penugasan & pengajuan
router.get('/history', relawanHistoryController_1.getMyHistory);
// GET /api/relawan/penugasan — Daftar penugasan aktif
router.get('/penugasan', relawanProfileController_1.getMyPenugasan);
// POST /api/relawan/verify-password — Verifikasi password (real-time)
router.post('/verify-password', relawanProfileController_1.verifyCurrentPassword);
// POST /api/relawan/change-password — Ganti password
router.post('/change-password', relawanProfileController_1.changePassword);
exports.default = router;
