/*
 * ============================================================
 * PROFILE CONTROLLER — MANAJEMEN PROFIL PENGGUNA
 * ============================================================
 * Controller ini menangani pengelolaan profil untuk semua role
 * (super_admin, opd, relawan) yang sudah login.
 *
 * Fitur:
 * 1. Lihat profil sendiri
 * 2. Update profil (nama, no_hp, foto)
 * 3. Ganti password
 *
 * Semua fungsi menggunakan `req.user.id` dari token JWT,
 * sehingga user hanya bisa mengakses profilnya sendiri.
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';
import { REGEX_PATTERNS, cleanPhoneNumber } from '../utils/regex';

/*
 * ============================================
 * 1. GET PROFIL SAYA
 * ============================================
 * Mengambil data profil user yang sedang login.
 * Query hanya berdasarkan user_id dari token JWT,
 * sehingga user tidak bisa melihat profil orang lain.
 * ============================================
 */
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    try {
        const result = await executeQueryWithContext(
            `SELECT user_id, nik, nama_lengkap, no_hp, role, foto_profil
             FROM users
             WHERE user_id = $1`,
            [userId], req.user
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            return;
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in getMyProfile:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

/*
 * ============================================
 * 2. UPDATE PROFIL
 * ============================================
 * Memperbarui data profil user yang sedang login.
 * Yang bisa diubah: nama_lengkap, no_hp, foto_profil
 * NIK tidak bisa diubah (identitas tetap).
 *
 * Query dibangun secara dinamis:
 * - Jika foto_profil dikirim → update kolom foto_profil
 * - Jika foto_profil bernilai string kosong → set ke null (hapus foto)
 * ============================================
 */
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { nama_lengkap, no_hp, foto_profil } = req.body;

    if (!nama_lengkap) {
        res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi' });
        return;
    }
    if (nama_lengkap.trim().length < 3) {
        res.status(400).json({ success: false, message: 'Nama lengkap minimal 3 karakter' });
        return;
    }
    if (!REGEX_PATTERNS.NAMA_RELAWAN.test(nama_lengkap)) {
        res.status(400).json({ success: false, message: 'Nama Lengkap tidak boleh mengandung angka atau karakter spesial selain tanda baca nama' });
        return;
    }
    if (no_hp) {
        const cleanNoHp = cleanPhoneNumber(no_hp);
        if (REGEX_PATTERNS.HAS_LETTERS.test(cleanNoHp)) {
            res.status(400).json({ success: false, message: 'Nomor HP tidak boleh mengandung huruf' });
            return;
        }
        if (!REGEX_PATTERNS.NO_HP.test(cleanNoHp)) {
            res.status(400).json({ success: false, message: 'Format nomor HP tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)' });
            return;
        }
    }

    try {
        // Bangun query dinamis — tambah kolom foto_profil hanya jika dikirim
        let updateQuery = `UPDATE users SET nama_lengkap = $1, no_hp = $2, updated_at = CURRENT_TIMESTAMP`;
        const params: any[] = [nama_lengkap, no_hp || null];

        // Jika foto_profil dikirim dari frontend, tambahkan ke query update
        if (foto_profil !== undefined) {
            params.push(foto_profil === '' ? null : foto_profil);
            updateQuery += `, foto_profil = $${params.length}`;
        }

        params.push(userId);
        updateQuery += ` WHERE user_id = $${params.length} RETURNING user_id, nik, nama_lengkap, no_hp, role, foto_profil`;

        const result = await executeQueryWithContext(updateQuery, params, req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Profil berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateMyProfile:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

/*
 * ============================================
 * 3. GANTI PASSWORD
 * ============================================
 * Mengganti password user yang sedang login.
 * Alur:
 * 1. Ambil password saat ini dari database
 * 2. Verifikasi password lama (bcrypt.compare + pepper)
 * 3. Hash password baru dengan bcrypt
 * 4. Simpan password baru ke database
 *
 * Keamanan:
 * - Password lama harus sesuai sebelum diubah
 * - Pepper rahasia dari .env ditambahkan sebelum hashing
 * - Password minimal 6 karakter
 * ============================================
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { password_lama, password_baru } = req.body;
    const userId = req.user?.id;

    if (!password_lama || !password_baru) {
        res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi' });
        return;
    }

    if (password_baru.length < 6) {
        res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
        return;
    }

    try {
        // 1. Ambil password saat ini dari DB
        const userRes = await executeQueryWithContext(
            `SELECT password FROM users WHERE user_id = $1`,
            [userId], req.user
        );

        if (userRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            return;
        }

        // 2. Verifikasi password lama (bcrypt.compare + pepper)
        const isMatch = await bcrypt.compare(password_lama + (process.env.PASSWORD_PEPPER || ''), userRes.rows[0].password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Password lama tidak sesuai' });
            return;
        }

        // 3. Hash password baru
        const salt = await bcrypt.genSalt(10);
        const hashedBaru = await bcrypt.hash(password_baru + (process.env.PASSWORD_PEPPER || ''), salt);

        // 4. Simpan password baru
        await executeQueryWithContext(
            `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
            [hashedBaru, userId], req.user
        );

        res.status(200).json({ success: true, message: 'Password berhasil diubah' });

    } catch (error: any) {
        console.error('Error in changePassword:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};