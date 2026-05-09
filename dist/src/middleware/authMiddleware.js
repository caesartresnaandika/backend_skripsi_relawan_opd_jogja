"use strict";
// authMiddleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Akses Ditolak! Butuh Token.' });
        return;
    }
    try {
        const verified = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'rahasia_skripsi_caesar');
        // ✅ FIXED: Type assertion untuk JWT payload
        const decoded = verified;
        // Coba tangkap IP dari Railway proxy atau direct socket
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        if (Array.isArray(clientIp)) {
            clientIp = clientIp[0];
        }
        else if (typeof clientIp === 'string') {
            clientIp = clientIp.split(',')[0].trim();
        }
        req.user = Object.assign(Object.assign({}, decoded), { ip: clientIp });
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Sesi anda telah berakhir. Silakan login kembali.' });
            return;
        }
        res.status(401).json({ message: 'Token Tidak Valid!' });
        return;
    }
};
// === MIDDLEWARE KHUSUS RBAC (ROLE-BASED ACCESS CONTROL) ===
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Memastikan verifyToken sudah dijalankan sebelumnya sehingga req.user ada
        if (!req.user || !req.user.role) {
            res.status(403).json({ message: 'Akses Ditolak! Role tidak ditemukan.' });
            return;
        }
        // Cek apakah role user saat ini ada di dalam daftar allowedRoles
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: `Akses Ditolak! Halaman ini hanya untuk role: ${allowedRoles.join(', ')}`
            });
            return;
        }
        next(); // Lanjut ke controller jika role sesuai
    };
};
exports.authorizeRole = authorizeRole;
exports.default = verifyToken;
