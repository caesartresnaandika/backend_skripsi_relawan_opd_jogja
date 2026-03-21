import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import bcrypt from 'bcrypt';

// 1. Dapatkan Daftar Kader di OPD ini
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

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 2. Tambah Kader Baru untuk OPD ini
export const createKader = async (req: OpdAuthRequest, res: Response): Promise<void> => {
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

        if (nik_pic.length !== 16) {
            res.status(400).json({ success: false, message: 'NIK PIC harus 16 digit' });
            return;
        }

        // 1. Cek apakah NIK sudah terdaftar
        const checkNik = await executeQueryWithContext(
            `SELECT user_id FROM users WHERE nik = $1`,
            [nik_pic], req.user
        );

        if (checkNik.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
            return;
        }

        // 2. Buat akun user untuk PIC Kader (role: relawan, password default = NIK)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nik_pic, salt);

        const insertUserQuery = `
            INSERT INTO users (nik, nama_lengkap, password, role, is_active)
            VALUES ($1, $2, $3, 'relawan', true)
            RETURNING user_id;
        `;
        const userRes = await executeQueryWithContext(
            insertUserQuery,
            [nik_pic, pic || nama_kader, hashedPassword],
            req.user
        );
        const userId = userRes.rows[0].user_id;

        // 3. Insert ke tabel kader (dengan user_id dan nik_pic)
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
        console.error('Error in createKader:', error);
        res.status(500).json({ success: false, message: 'Server error', error_dev: error.message });
    }
};

// 3. Update Kader
export const updateKader = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);
        const { nama_kader, deskripsi, pic } = req.body;

        // Pastikan kader ini benar-benar milik OPD yang login
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
        console.error('Error in updateKader:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 4. Hapus Kader
export const deleteKader = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);

        // Ambil user_id dulu sebelum hapus
        const findQuery = await executeQueryWithContext(
            `SELECT user_id FROM kader WHERE kader_id = $1 AND opd_id = $2`,
            [kaderId, opdId], req.user
        );

        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        // Hapus kader (FK ON DELETE SET NULL akan null-kan user_id di kader)
        await executeQueryWithContext(
            `DELETE FROM kader WHERE kader_id = $1 AND opd_id = $2`,
            [kaderId, opdId], req.user
        );

        res.status(200).json({ success: true, message: 'Kader berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deleteKader:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};