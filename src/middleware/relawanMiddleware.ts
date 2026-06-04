/*
 * ============================================================
 * RELAWAN MIDDLEWARE — KONTEKS RELAWAN
 * ============================================================
 * Middleware untuk mengambil dan menyediakan konteks relawan
 * dari user yang sedang login.
 *
 * Digunakan untuk route khusus role `relawan` agar controller
 * bisa langsung mengakses relawan_id tanpa query ulang.
 * ============================================================
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import pool from '../../config/db';

/*
 * RELAWAN AUTH REQUEST INTERFACE
 * Memperluas AuthRequest dengan properti relawan_id
 * yang akan diisi oleh middleware ini.
 */
export interface RelawanAuthRequest extends AuthRequest {
    relawan_id?: number;
}

/*
 * REQUIRE RELAWAN CONTEXT
 * Middleware Wajib untuk route yang khusus role 'relawan':
 * 1. Memastikan user memiliki role 'relawan'
 * 2. Mencari relawan_id dari tabel relawan berdasarkan user_id
 * 3. Jika biodata relawan belum ada → tolak akses (403)
 * 4. Jika ditemukan → simpan relawan_id di req.relawan_id
 */
export const requireRelawanContext = async (req: RelawanAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('🔍 requireRelawanContext - user:', req.user);

        // Pastikan user memiliki role 'relawan'
        if (!req.user || req.user.role !== 'relawan') {
            console.log('❌ Role check failed:', req.user?.role);
            res.status(403).json({ success: false, message: 'Akses ditolak.' });
            return;
        }

        // Cari data relawan dari user yang login
        const result = await pool.query(
            `SELECT relawan_id FROM relawan WHERE user_id = $1 LIMIT 1`,
            [req.user.id]
        );

        // Jika user belum melengkapi data relawan
        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Data biodata relawan belum terdata.' });
            return;
        }

        // Simpan relawan_id ke request untuk digunakan controller
        req.relawan_id = result.rows[0].relawan_id;
        next();
    } catch (error: any) {
        console.error('Error in requireRelawanContext:', error);
        res.status(500).json({ success: false, message: 'Kesalahan verifikasi identitas.' });
    }
};