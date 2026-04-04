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
const express_1 = require("express");
const authMiddleware_1 = __importStar(require("../middleware/authMiddleware"));
const relawanMiddleware_1 = require("../middleware/relawanMiddleware");
const relawanDashboardController_1 = require("../controllers/relawanDashboardController");
const relawanProfileController_1 = require("../controllers/relawanProfileController");
const relawanHistoryController_1 = require("../controllers/relawanHistoryController");
const router = (0, express_1.Router)();
// Middleware Lapis 1: Cek Token JWT dan pastikan role-nya adalah 'relawan'
router.use(authMiddleware_1.default, (0, authMiddleware_1.authorizeRole)('relawan'));
// Middleware Lapis 2: Ekstrak relawan_id secara otomatis ke dalam req object
router.use(relawanMiddleware_1.requireRelawanContext);
// ==========================================
// Kumpulan Endpoint API Khusus Relawan
// ==========================================
// 1. Dashboard Relawan
router.get('/dashboard', relawanDashboardController_1.getRelawanDashboardStats);
// 2. Profil Biodata
router.get('/profile', relawanProfileController_1.getMyProfile);
router.post('/profile/update', relawanProfileController_1.requestProfileUpdate);
// 3. Riwayat / History
router.get('/history', relawanHistoryController_1.getMyHistory);
exports.default = router;
