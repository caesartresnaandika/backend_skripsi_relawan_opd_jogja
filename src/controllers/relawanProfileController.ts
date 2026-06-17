/*
 * ============================================================
 * RELAWAN PROFILE CONTROLLER
 * ============================================================
 * Controller khusus untuk role relawan yang menangani:
 * 1. Melihat biodata lengkap (data dari tabel relawan + users)
 * 2. Mengajukan perubahan biodata (masuk antrean review admin)
 * 3. Melihat daftar penugasan
 * 4. Verifikasi password lama (real-time dari frontend)
 * 5. Ganti password
 *
 * Berbeda dengan profileController biasa, controller ini
 * menggunakan `req.relawan_id` yang sudah di-set oleh
 * middleware requireRelawanContext.
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { RelawanAuthRequest } from '../middleware/relawanMiddleware';
import bcrypt from 'bcrypt';

/*
 * ============================================
 * 1. GET BIODATA LENGKAP RELAWAN
 * ============================================
 * Mengambil data dari tabel relawan + users.
 * Data sensitif seperti password tidak dikirim.
 * ============================================
 */
export const getMyProfile = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                u.nik, u.nama_lengkap, u.no_hp,
                r.jenis_kelamin, r.alamat_ktp, r.kemantren, r.kelurahan
            FROM relawan r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.relawan_id = $1
        `, [req.relawan_id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Biodata tidak ditemukan.' });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getMyProfile:', error);
        res.status(500).json({ success: false, message: 'Server error saat menarik profil.' });
    }
};

/*
 * ============================================
 * 2. REQUEST PERUBAHAN BIODATA
 * ============================================
 * Tidak langsung mengubah data di database!
 * Perubahan biodata masuk ke tabel pengajuan_perubahan_data
 * dan harus direview oleh admin/OPD terlebih dahulu.
 *
 * Alur:
 * 1. Ambil data lama dari database
 * 2. Simpan data lama + data baru ke tabel pengajuan
 * 3. Status awal: 'Menunggu Review'
 * 4. Admin/OPD akan me-review dan menyetujui/menolak
 *
 * Keuntungan: Admin bisa memeriksa perubahan sebelum diterapkan.
 * ============================================
 */
export const requestProfileUpdate = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const relawanId = req.relawan_id;
        const { data_baru, catatan } = req.body;

        if (!data_baru) {
            res.status(400).json({ success: false, message: 'Data perubahan wajib disertakan (JSON).' });
            return;
        }

        // Ambil data lama sebagai perbandingan/history
        const oldDataRes = await executeQueryWithContext(`
            SELECT r.*, u.nama_lengkap, u.no_hp
            FROM relawan r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.relawan_id = $1
        `, [relawanId], req.user);

        const dataLama = oldDataRes.rows[0];

        // Insert ke tabel pengajuan (belum di-apply, masih waiting review)
        const insertRes = await executeQueryWithContext(`
            INSERT INTO pengajuan_perubahan_data 
            (relawan_id, jenis_perubahan, data_lama, data_baru, catatan_relawan, status_pengajuan)
            VALUES ($1, 'Biodata Diri', $2, $3, $4, 'Menunggu Review')
            RETURNING pengajuan_id, status_pengajuan, tanggal_pengajuan
        `, [relawanId, JSON.stringify(dataLama), JSON.stringify(data_baru), catatan], req.user);

        res.status(201).json({
            success: true,
            message: 'Pengajuan perubahan data berhasil dikirim dan sedang menunggu review Admin.',
            data: insertRes.rows[0]
        });

    } catch (error: any) {
        console.error('Error in requestProfileUpdate:', error);
        res.status(500).json({ success: false, message: 'Server error saat mengirim pengajuan.' });
    }
};

/*
 * ============================================
 * 3. GET DAFTAR PENUGASAN RELAWAN
 * ============================================
 * Mengambil semua penugasan yang dimiliki relawan ini,
 * termasuk informasi OPD, kader, dan nomor SK.
 * ============================================
 */
export const getMyPenugasan = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                pr.penugasan_id, pr.jabatan, pr.detail_jabatan, 
                pr.status_keaktifan,
                o.nama_opd, k.nama_kader,
                sk.nomor_sk
            FROM penugasan_relawan pr
            JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            LEFT JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
            WHERE pr.relawan_id = $1
            ORDER BY pr.created_at DESC
        `, [req.relawan_id], req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getMyPenugasan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
 * ============================================
 * 4. VERIFIKASI PASSWORD LAMA (REAL-TIME)
 * ============================================
 * Endpoint untuk validasi real-time dari frontend.
 * Digunakan untuk memverifikasi password lama sebelum
 * user mengganti password (tanpa mengubah apapun).
 *
 * Return: { success: true, match: true/false }
 * ============================================
 */
export const verifyCurrentPassword = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    const { password } = req.body;
    const userId = req.user?.id;

    if (!password) {
        res.status(400).json({ success: false, match: false, message: 'Password wajib diisi.' });
        return;
    }

    try {
        const userRes = await executeQueryWithContext(
            `SELECT password FROM users WHERE user_id = $1`,
            [userId], req.user
        );

        if (userRes.rows.length === 0) {
            res.status(404).json({ success: false, match: false, message: 'User tidak ditemukan.' });
            return;
        }

        const isMatch = await bcrypt.compare(password + (process.env.PASSWORD_PEPPER || ''), userRes.rows[0].password);
        res.status(200).json({ success: true, match: isMatch });
    } catch (error: any) {
        console.error('Error in verifyCurrentPassword (relawan):', error);
        res.status(500).json({ success: false, match: false, message: 'Terjadi kesalahan server.' });
    }
};

/*
 * ============================================
 * 5. GANTI PASSWORD RELAWAN
 * ============================================
 * Alur:
 * 1. Ambil password saat ini dari DB
 * 2. Verifikasi password lama
 * 3. Cegah password baru sama dengan password lama
 * 4. Hash password baru dengan bcrypt + pepper
 * 5. Simpan password baru
 *
 * Validasi tambahan: minimal 8 karakter + minimal 1 angka.
 * ============================================
 */
export const changePassword = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    const { old_password, new_password } = req.body;
    const userId = req.user?.id;

    // Validasi input
    if (!old_password || !new_password) {
        res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi.' });
        return;
    }

    if (new_password.length < 8) {
        res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
        return;
    }

    if (!/\d/.test(new_password)) {
        res.status(400).json({ success: false, message: 'Password baru harus mengandung minimal 1 angka.' });
        return;
    }

    try {
        // 1. Ambil password saat ini dari DB
        const userRes = await executeQueryWithContext(
            `SELECT password FROM users WHERE user_id = $1`,
            [userId], req.user
        );

        if (userRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
            return;
        }

        // 2. Verifikasi password lama
        const isMatch = await bcrypt.compare(old_password + (process.env.PASSWORD_PEPPER || ''), userRes.rows[0].password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });
            return;
        }

        // 3. Cegah password baru sama dengan password lama
        const isSame = await bcrypt.compare(new_password + (process.env.PASSWORD_PEPPER || ''), userRes.rows[0].password);
        if (isSame) {
            res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama.' });
            return;
        }

        // 4. Hash password baru
        const salt = await bcrypt.genSalt(10);
        const hashedBaru = await bcrypt.hash(new_password + (process.env.PASSWORD_PEPPER || ''), salt);

        // 5. Simpan password baru
        await executeQueryWithContext(
            `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
            [hashedBaru, userId], req.user
        );

        res.status(200).json({ success: true, message: 'Password berhasil diubah.' });

    } catch (error: any) {
        console.error('Error in changePassword (relawan):', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengubah password.' });
    }
};