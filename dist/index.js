"use strict";
/*
 * ============================================================
 * MAIN ENTRY POINT — SERVER EXPRESS
 * ============================================================
 * File ini adalah titik awal aplikasi backend. Semua konfigurasi
 * server Express, middleware global, dan pendaftaran route
 * dilakukan di sini.
 *
 * Aplikasi ini mendukung dua mode:
 * 1. Mode Development: Menjalankan server lokal di port tertentu
 * 2. Mode Production (Vercel): Mengexport app sebagai serverless function
 * ============================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// ============================================
// IMPORT SEMUA FILE ROUTES
// Setiap route group ditempatkan di file terpisah
// di folder src/routes/ untuk modularitas
// ============================================
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const relawanRoutes_1 = __importDefault(require("./src/routes/relawanRoutes"));
const opdRoutes_1 = __importDefault(require("./src/routes/opdRoutes"));
const relawanAdminRoutes_1 = __importDefault(require("./src/routes/relawanAdminRoutes"));
const skRoutes_1 = __importDefault(require("./src/routes/skRoutes"));
const dashboardRoutes_1 = __importDefault(require("./src/routes/dashboardRoutes"));
const logRoutes_1 = __importDefault(require("./src/routes/logRoutes"));
const opdAdminRoutes_1 = __importDefault(require("./src/routes/opdAdminRoutes"));
const debugRoutes_1 = __importDefault(require("./src/routes/debugRoutes"));
const saranRoutes_1 = __importDefault(require("./src/routes/saranRoutes"));
const kaderRoutes_1 = __importDefault(require("./src/routes/kaderRoutes"));
const profileRoutes_1 = __importDefault(require("./src/routes/profileRoutes"));
const statistikRoutes_1 = __importDefault(require("./src/routes/statistikRoutes"));
const settingsRoutes_1 = __importDefault(require("./src/routes/settingsRoutes"));
const wilayahRoutes_1 = __importDefault(require("./src/routes/wilayahRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ============================================
// MIDDLEWARE GLOBAL
// ============================================
// CORS: Mengizinkan akses dari domain lain (frontend)
app.use((0, cors_1.default)());
// Body parser: Mengubah JSON body request menjadi objek JavaScript
app.use(express_1.default.json());
/*
 * MIDDLEWARE URL PREFIX
 * Jika request masuk tanpa prefix /api (misal: /auth/login),
 * middleware ini otomatis menambahkan /api di depannya.
 * Ini memudahkan frontend jika lupa menambahkan prefix.
 */
app.use((req, res, next) => {
    if (!req.url.startsWith('/api') && req.url !== '/') {
        req.url = '/api' + req.url;
    }
    next();
});
// ============================================
// DAFTAR ROUTES / ENDPOINT API
// Setiap route di-mount ke path tertentu dengan
// middleware auth dan role-nya masing-masing
// (detail ada di masing-masing file routes)
// ============================================
// 🔐 Autentikasi (Register & Login — public)
app.use('/api/auth', authRoutes_1.default);
// 👤 Relawan (untuk role relawan — akses diri sendiri)
app.use('/api/relawan', relawanRoutes_1.default);
// 🏛️ OPD (manajemen OPD — super_admin only)
app.use('/api/opd', opdRoutes_1.default);
// 👥 Admin Relawan (manajemen relawan — super_admin)
app.use('/api/admin/relawan', relawanAdminRoutes_1.default);
// 📄 SK / Surat Keputusan (super_admin & OPD)
app.use('/api/admin/sk', skRoutes_1.default);
// 📊 Dashboard Admin (super_admin & OPD)
app.use('/api/admin/dashboard', dashboardRoutes_1.default);
// 📋 Log Aktivitas (super_admin only)
app.use('/api/admin/logs', logRoutes_1.default);
// 🏛️ OPD Admin (manajemen internal OPD — role opd)
app.use('/api/opd-admin', opdAdminRoutes_1.default);
// 💬 Saran / Feedback (public create, admin manage)
app.use('/api/saran', saranRoutes_1.default);
// 🧑‍🏫 Kader (manajemen kader — super_admin)
app.use('/api/kader', kaderRoutes_1.default);
// 🐛 Debug (untuk testing koneksi database)
app.use('/api/debug', debugRoutes_1.default);
// 👤 Profile (semua role yang login)
app.use('/api/profile', profileRoutes_1.default);
// 📈 Statistik (semua role)
app.use('/api/statistik', statistikRoutes_1.default);
// ⚙️ Settings (pengaturan sistem)
app.use('/api/settings', settingsRoutes_1.default);
// 🗺️ Wilayah (Kemantren & Kelurahan — public lookup)
app.use('/api/wilayah', wilayahRoutes_1.default);
// Test root — untuk cek apakah server hidup
app.get('/', (req, res) => {
    res.send('Server Backend Berjalan');
});
// ============================================
// MODE DEVELOPMENT — SERVER LOKAL
// ============================================
// Jika bukan production (Vercel), jalankan server Express
// secara lokal di port yang ditentukan.
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}
// ============================================
// MODE PRODUCTION — EXPORT UNTUK VERCEL
// ============================================
// Vercel akan menggunakan export default ini sebagai
// serverless function (lihat vercel.json).
exports.default = app;
// ============================================
// HANDLER GLOBAL ERROR
// Menangkap promise rejection yang tidak tertangani
// agar server tidak crash diam-diam
// ============================================
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
