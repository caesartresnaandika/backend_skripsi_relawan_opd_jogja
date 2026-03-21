import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import bcrypt from 'bcrypt';

// ============================================================
// SUPER ADMIN — dipakai via /api/kader (kaderRoutes.ts)
// ============================================================

// 1. Dapatkan semua kader (bisa difilter berdasarkan opd_id)
export const getAllKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        let query: string;
        let params: any[];

        if (opd_id) {
            query = `
                SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic,
                       k.opd_id, k.is_active, k.created_at, k.updated_at,
                       o.nama_opd
                FROM kader k
                JOIN opd o ON k.opd_id = o.opd_id
                WHERE k.opd_id = $1
                ORDER BY k.created_at DESC;
            `;
            params = [opd_id];
        } else {
            query = `
                SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic,
                       k.opd_id, k.is_active, k.created_at, k.updated_at,
                       o.nama_opd
                FROM kader k
                JOIN opd o ON k.opd_id = o.opd_id
                ORDER BY k.created_at DESC;
            `;
            params = [];
        }

        const result = await executeQueryWithContext(query, params, req.user);
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar kader',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getAllKader:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 2. Dapatkan detail kader berdasarkan ID
export const getKaderById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `
            SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic,
                   k.opd_id, k.is_active, k.created_at, k.updated_at,
                   o.nama_opd
            FROM kader k
            JOIN opd o ON k.opd_id = o.opd_id
            WHERE k.kader_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail kader',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getKaderById:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 3. Buat kader baru (Super Admin) — sekaligus membuat akun user untuk PIC
export const createKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id, nama_kader, deskripsi, pic, nik_pic } = req.body;

    if (!opd_id || !nama_kader) {
        res.status(400).json({ success: false, message: 'Field opd_id dan nama_kader wajib diisi' });
        return;
    }

    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }

    if (String(nik_pic).length !== 16) {
        res.status(400).json({ success: false, message: 'NIK PIC harus 16 digit' });
        return;
    }

    try {
        // 1. Cek apakah NIK sudah terdaftar
        const checkNik = await executeQueryWithContext(
            `SELECT user_id FROM users WHERE nik = $1`,
            [nik_pic], req.user
        );

        if (checkNik.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
            return;
        }

        // 2. Buat akun user (role: relawan, password default = NIK)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(nik_pic), salt);

        const userRes = await executeQueryWithContext(
            `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
             VALUES ($1, $2, $3, 'relawan', true)
             RETURNING user_id;`,
            [nik_pic, pic || nama_kader, hashedPassword],
            req.user
        );
        const userId = userRes.rows[0].user_id;

        // 3. Insert ke tabel kader
        const result = await executeQueryWithContext(
            `INSERT INTO kader (opd_id, nama_kader, deskripsi, pic, nik_pic, user_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *;`,
            [opd_id, nama_kader, deskripsi || null, pic || null, nik_pic, userId],
            req.user
        );

        res.status(201).json({
            success: true,
            message: `Kader berhasil ditambahkan. Akun login PIC dibuat dengan NIK: ${nik_pic}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('FULL ERROR in createKader:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code === '23505') errorMessage = 'Nama kader sudah digunakan di OPD yang sama';
        if (error.code === '23503') errorMessage = 'OPD yang dipilih tidak ditemukan';
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    }
};

// 4. Update kader (Super Admin)
export const updateKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_kader, deskripsi, pic } = req.body;

    if (!nama_kader) {
        res.status(400).json({ success: false, message: 'Field nama_kader wajib diisi' });
        return;
    }

    try {
        const result = await executeQueryWithContext(
            `UPDATE kader
             SET nama_kader = $1, deskripsi = $2, pic = $3, updated_at = CURRENT_TIMESTAMP
             WHERE kader_id = $4
             RETURNING *;`,
            [nama_kader, deskripsi || null, pic || null, id],
            req.user
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil memperbarui kader',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateKader:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 5. Hapus kader (Super Admin)
export const deleteKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await executeQueryWithContext(
            `DELETE FROM kader WHERE kader_id = $1 RETURNING kader_id;`,
            [id], req.user
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        res.status(200).json({ success: true, message: 'Berhasil menghapus kader' });
    } catch (error: any) {
        console.error('Error in deleteKader:', error.message);
        if (error.code === '23503') {
            res.status(400).json({ success: false, message: 'Kader tidak dapat dihapus karena masih memiliki relawan aktif' });
            return;
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 6. Toggle status kader (Super Admin)
export const toggleKaderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
        res.status(400).json({ success: false, message: 'Field is_active wajib diisi' });
        return;
    }

    try {
        const result = await executeQueryWithContext(
            `UPDATE kader
             SET is_active = $1, updated_at = CURRENT_TIMESTAMP
             WHERE kader_id = $2
             RETURNING kader_id, nama_kader, is_active;`,
            [is_active, id], req.user
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        const statusText = result.rows[0].is_active ? 'diaktifkan' : 'dinonaktifkan';
        res.status(200).json({
            success: true,
            message: `Kader ${result.rows[0].nama_kader} berhasil ${statusText}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in toggleKaderStatus:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};


// ============================================================
// OPD ADMIN — dipakai via /api/opd-admin/kader (opdAdminRoutes.ts)
// ============================================================

// 7. Dapatkan daftar kader milik OPD yang sedang login
export const getKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic, k.is_active,
                   COUNT(pr.relawan_id) as jumlah_anggota
            FROM kader k
            LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id
            WHERE k.opd_id = $1
            GROUP BY k.kader_id
            ORDER BY k.nama_kader ASC
        `, [opdId], req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 8. Tambah kader baru oleh OPD — sekaligus membuat akun user untuk PIC
export const createKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const { nama_kader, deskripsi, pic, nik_pic } = req.body;

        if (!nama_kader) {
            res.status(400).json({ success: false, message: 'Nama kader wajib diisi' });
            return;
        }

        if (!nik_pic) {
            res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
            return;
        }

        if (String(nik_pic).length !== 16) {
            res.status(400).json({ success: false, message: 'NIK PIC harus 16 digit' });
            return;
        }

        // 1. Cek NIK tidak duplikat
        const checkNik = await executeQueryWithContext(
            `SELECT user_id FROM users WHERE nik = $1`,
            [nik_pic], req.user
        );

        if (checkNik.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
            return;
        }

        // 2. Buat akun user (role: relawan, password = NIK)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(nik_pic), salt);

        const userRes = await executeQueryWithContext(
            `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
             VALUES ($1, $2, $3, 'relawan', true)
             RETURNING user_id;`,
            [nik_pic, pic || nama_kader, hashedPassword],
            req.user
        );
        const userId = userRes.rows[0].user_id;

        // 3. Insert ke tabel kader
        const result = await executeQueryWithContext(`
            INSERT INTO kader (opd_id, nama_kader, deskripsi, pic, nik_pic, user_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [opdId, nama_kader, deskripsi || null, pic || null, nik_pic, userId], req.user);

        res.status(201).json({
            success: true,
            message: `Kader berhasil ditambahkan. Akun login PIC dibuat dengan NIK: ${nik_pic}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in createKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error', error_dev: error.message });
    }
};

// 9. Update kader oleh OPD (hanya milik OPD sendiri)
export const updateKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);
        const { nama_kader, deskripsi, pic } = req.body;

        const findQuery = await executeQueryWithContext(
            `SELECT * FROM kader WHERE kader_id = $1 AND opd_id = $2`,
            [kaderId, opdId], req.user
        );

        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan di instansi Anda' });
            return;
        }

        const result = await executeQueryWithContext(`
            UPDATE kader 
            SET nama_kader = $1, deskripsi = $2, pic = $3, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $4
            RETURNING *
        `, [nama_kader, deskripsi || null, pic || null, kaderId], req.user);

        res.status(200).json({
            success: true,
            message: 'Data kader berhasil diperbarui',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 10. Hapus kader oleh OPD (hanya milik OPD sendiri)
export const deleteKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);

        const findQuery = await executeQueryWithContext(
            `SELECT user_id FROM kader WHERE kader_id = $1 AND opd_id = $2`,
            [kaderId, opdId], req.user
        );

        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        await executeQueryWithContext(
            `DELETE FROM kader WHERE kader_id = $1 AND opd_id = $2`,
            [kaderId, opdId], req.user
        );

        res.status(200).json({ success: true, message: 'Kader berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deleteKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};