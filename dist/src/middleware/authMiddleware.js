"use strict";
/*
 * ============================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ============================================================
 * Middleware ini bertanggung jawab untuk:
 * 1. Memverifikasi token JWT yang dikirim client (verifyToken)
 * 2. Memeriksa hak akses berdasarkan role user (authorizeRole)
 *
 * Alur autentikasi:
 * Client → mengirim token di header Authorization: Bearer <token>
 *        → verifyToken mendekode token dan menyimpan data user di req.user
 *        → (opsional) authorizeRole memeriksa apakah role user diizinkan
 *        → Controller menerima req.user yang sudah berisi data user
 * ============================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/*
 * VERIFIKASI TOKEN JWT
 * Middleware ini membaca token dari header Authorization,
 * memverifikasi keasliannya, dan menyimpan data user ke req.user.
 *
 * Jika token tidak ada → 401
 * Jika token expired → 401 dengan pesan khusus
 * Jika token tidak valid → 401
 * Jika sukses → next() melanjutkan ke handler berikutnya
 */
const verifyToken = (req, res, next) => {
    // Ambil token dari header: "Authorization: Bearer <token>"
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Akses Ditolak! Butuh Token.' });
        return;
    }
    try {
        // Verifikasi token menggunakan secret key
        const verified = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'rahasia_skripsi_caesar');
        // Type assertion untuk payload JWT
        const decoded = verified;
        /*
         * DETEKSI ALAMAT IP
         * Mendeteksi IP asli client dengan memeriksa:
         * 1. X-Forwarded-For header (jika di belakang proxy/load balancer)
         * 2. Remote address dari socket langsung
         * 3. req.ip (fallback Express)
         */
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        if (Array.isArray(clientIp)) {
            clientIp = clientIp[0];
        }
        else if (typeof clientIp === 'string') {
            clientIp = clientIp.split(',')[0].trim();
        }
        // Simpan data user + IP ke request object
        req.user = Object.assign(Object.assign({}, decoded), { ip: clientIp });
        next();
    }
    catch (err) {
        // Token expired → pesan khusus
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Sesi anda telah berakhir. Silakan login kembali.' });
            return;
        }
        // Token tidak valid secara umum
        res.status(401).json({ message: 'Token Tidak Valid!' });
        return;
    }
};
/*
 * AUTHORIZE ROLE — RBAC (ROLE-BASED ACCESS CONTROL)
 * Middleware factory yang mengembalikan middleware untuk memeriksa
 * apakah role user termasuk dalam daftar role yang diizinkan.
 *
 * Contoh penggunaan di routes:
 *   router.get('/data', verifyToken, authorizeRole('super_admin', 'opd'), handler)
 *
 * Jika role tidak sesuai → 403 Forbidden
 * Jika sesuai → next()
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Pastikan verifyToken sudah dijalankan dan req.user tersedia
        if (!req.user || !req.user.role) {
            res.status(403).json({ message: 'Akses Ditolak! Role tidak ditemukan.' });
            return;
        }
        // Cek apakah role user termasuk dalam daftar yang diizinkan
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: `Akses Ditolak! Halaman ini hanya untuk role: ${allowedRoles.join(', ')}`
            });
            return;
        }
        // Role sesuai → lanjut ke controller
        next();
    };
};
exports.authorizeRole = authorizeRole;
exports.default = verifyToken;
