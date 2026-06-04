/*
 * ============================================================
 * OPD MIDDLEWARE — KONTEKS INSTANSI OPD
 * ============================================================
 * Middleware untuk mengambil dan menyediakan konteks OPD
 * (Organisasi Perangkat Daerah) dari user yang login.
 *
 * Digunakan terutama oleh role `opd` (admin OPD) untuk:
 * 1. Memastikan user terdaftar sebagai pengelola OPD
 * 2. Menyediakan opd_id di request agar controller tidak
 *    perlu query ulang ke database
 * ============================================================
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { executeQueryWithContext } from '../../config/db';

/*
 * OPD AUTH REQUEST INTERFACE
 * Memperluas AuthRequest dengan properti opd_id
 * yang akan diisi oleh middleware ini.
 */
export interface OpdAuthRequest extends AuthRequest {
    opd_id?: number;
}

/*
 * REQUIRE OPD CONTEXT (WAJIB)
 * Middleware ini WAJIB dijalankan untuk route yang khusus role OPD.
 * - Memastikan user memiliki role 'opd'
 * - Mencari opd_id dari tabel pengelola_opd berdasarkan user_id
 * - Jika tidak ditemukan → tolak akses (403)
 * - Jika ditemukan → simpan opd_id di req.opd_id untuk digunakan controller
 */
export const requireOpdContext = async (req: OpdAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Pastikan user sudah login dan role-nya 'opd'
        if (!req.user || req.user.role !== 'opd') {
            res.status(403).json({ success: false, message: 'Akses ditolak. Layanan ini khusus untuk Role Admin OPD.' });
            return;
        }

        // Query ke tabel pengelola_opd untuk mencari OPD tempat user bekerja
        const result = await executeQueryWithContext(
            `SELECT opd_id FROM pengelola_opd WHERE user_id = $1 AND status_keaktifan = 'Aktif' LIMIT 1`,
            [req.user.id],
            req.user
        );

        // Jika user tidak terdaftar sebagai pengelola OPD manapun
        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Akses ditolak. Akun Anda belum terikat ke Instansi (OPD) manapun.' });
            return;
        }

        // Simpan opd_id ke request agar controller bisa langsung pakai
        req.opd_id = result.rows[0].opd_id;

        next();

    } catch (error: any) {
        console.error('Error in requireOpdContext:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memverifikasi identitas OPD.' });
    }
};

/*
 * ATTACH OPD ID (OPSIONAL)
 * Middleware ini OPSIONAL — hanya meng-attach opd_id jika user
 * memiliki role 'opd'. Untuk role lain, middleware ini langsung
 * melanjutkan tanpa error.
 *
 * Berguna untuk route yang bisa diakses oleh beberapa role
 * tapi tetap membutuhkan konteks OPD jika user adalah OPD.
 */
export const attachOpdId = async (req: OpdAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Hanya jalankan untuk role 'opd', role lain langsung lanjut
        if (!req.user || req.user.role !== 'opd') {
            return next();
        }

        // Cari opd_id walau tanpa filter status_keaktifan
        const result = await executeQueryWithContext(
            `SELECT opd_id FROM pengelola_opd WHERE user_id = $1 LIMIT 1`,
            [req.user.id],
            req.user
        );

        if (result.rows.length > 0) {
            req.opd_id = result.rows[0].opd_id;
        }

        next();
    } catch (error: any) {
        console.error('Error in attachOpdId:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memverifikasi identitas OPD.' });
    }
};