import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

// ── 1. GET Profil Saya ────────────────────────────────────────────────────────
// Semua role: ambil data user dari tabel users berdasarkan token
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    try {
        const result = await executeQueryWithContext(
            `SELECT user_id, nik, nama_lengkap, no_hp, role
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

// ── 2. UPDATE Profil ──────────────────────────────────────────────────────────
// Update nama_lengkap dan no_hp (NIK tidak boleh diubah)
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { nama_lengkap, no_hp } = req.body;

    if (!nama_lengkap) {
        res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi' });
        return;
    }

    try {
        const result = await executeQueryWithContext(
            `UPDATE users
             SET nama_lengkap = $1, no_hp = $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3
             RETURNING user_id, nik, nama_lengkap, no_hp, role`,
            [nama_lengkap, no_hp || null, userId], req.user
        );

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

// ── 3. GANTI PASSWORD ─────────────────────────────────────────────────────────
// Semua role yang sudah login bisa mengganti password
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

        // 2. Verifikasi password lama
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