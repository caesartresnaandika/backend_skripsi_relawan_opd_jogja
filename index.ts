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

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ============================================
// IMPORT SEMUA FILE ROUTES
// Setiap route group ditempatkan di file terpisah
// di folder src/routes/ untuk modularitas
// ============================================
import authRoutes from './src/routes/authRoutes';
import relawanRoutes from './src/routes/relawanRoutes';
import opdRoutes from './src/routes/opdRoutes';
import relawanAdminRoutes from './src/routes/relawanAdminRoutes';
import skRoutes from './src/routes/skRoutes';
import dashboardRoutes from './src/routes/dashboardRoutes';
import logRoutes from './src/routes/logRoutes';
import opdAdminRoutes from './src/routes/opdAdminRoutes';
import debugRoutes from './src/routes/debugRoutes';
import saranRoutes from './src/routes/saranRoutes';
import kaderRoutes from './src/routes/kaderRoutes';
import profileRoutes from './src/routes/profileRoutes';
import statistikRoutes from './src/routes/statistikRoutes';
import settingsRoutes from './src/routes/settingsRoutes';
import wilayahRoutes from './src/routes/wilayahRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// CORS: Mengizinkan akses dari domain lain (frontend)
app.use(cors());

// Body parser: Mengubah JSON body request menjadi objek JavaScript
app.use(express.json());

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
app.use('/api/auth', authRoutes);

// 👤 Relawan (untuk role relawan — akses diri sendiri)
app.use('/api/relawan', relawanRoutes);

// 🏛️ OPD (manajemen OPD — super_admin only)
app.use('/api/opd', opdRoutes);

// 👥 Admin Relawan (manajemen relawan — super_admin)
app.use('/api/admin/relawan', relawanAdminRoutes);

// 📄 SK / Surat Keputusan (super_admin & OPD)
app.use('/api/admin/sk', skRoutes);

// 📊 Dashboard Admin (super_admin & OPD)
app.use('/api/admin/dashboard', dashboardRoutes);

// 📋 Log Aktivitas (super_admin only)
app.use('/api/admin/logs', logRoutes);

// 🏛️ OPD Admin (manajemen internal OPD — role opd)
app.use('/api/opd-admin', opdAdminRoutes);

// 💬 Saran / Feedback (public create, admin manage)
app.use('/api/saran', saranRoutes);

// 🧑‍🏫 Kader (manajemen kader — super_admin)
app.use('/api/kader', kaderRoutes);

// 🐛 Debug (untuk testing koneksi database)
app.use('/api/debug', debugRoutes);

// 👤 Profile (semua role yang login)
app.use('/api/profile', profileRoutes);

// 📈 Statistik (semua role)
app.use('/api/statistik', statistikRoutes);

// ⚙️ Settings (pengaturan sistem)
app.use('/api/settings', settingsRoutes);

// 🗺️ Wilayah (Kemantren & Kelurahan — public lookup)
app.use('/api/wilayah', wilayahRoutes);

// Test root — untuk cek apakah server hidup
app.get('/', (req: Request, res: Response) => {
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
export default app;

// ============================================
// HANDLER GLOBAL ERROR
// Menangkap promise rejection yang tidak tertangani
// agar server tidak crash diam-diam
// ============================================
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});