import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

export const getAllOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT opd_id, nama_opd, alamat, kontak, pic, nik_pic, is_active, created_at, updated_at
            FROM opd
            ORDER BY created_at DESC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar OPD',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getAllOpd:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const getOpdById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const query = `
            SELECT opd_id, nama_opd, alamat, kontak, pic, nik_pic, is_active, created_at, updated_at
            FROM opd
            WHERE opd_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail OPD',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getOpdById:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const createOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nama_opd, alamat, kontak, pic, nik_pic } = req.body;

    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
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

        // 2. Buat akun user untuk PIC OPD (role: opd, password default = NIK)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nik_pic, salt);

        const insertUserQuery = `
            INSERT INTO users (nik, nama_lengkap, password, role, is_active)
            VALUES ($1, $2, $3, 'opd', true)
            RETURNING user_id;
        `;
        const userRes = await executeQueryWithContext(
            insertUserQuery,
            [nik_pic, pic || nama_opd, hashedPassword],
            req.user
        );
        const userId = userRes.rows[0].user_id;

        // 3. Insert ke tabel opd
        const insertOpdQuery = `
            INSERT INTO opd (nama_opd, alamat, kontak, pic, nik_pic)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const opdRes = await executeQueryWithContext(
            insertOpdQuery,
            [nama_opd, alamat || null, kontak || null, pic || null, nik_pic],
            req.user
        );
        const opdId = opdRes.rows[0].opd_id;

        // 4. Hubungkan user ke OPD via tabel pengelola_opd
        await executeQueryWithContext(
            `INSERT INTO pengelola_opd (user_id, opd_id) VALUES ($1, $2)`,
            [userId, opdId],
            req.user
        );

        res.status(201).json({
            success: true,
            message: `Berhasil menambahkan OPD baru. Akun login PIC dibuat dengan NIK: ${nik_pic}`,
            data: opdRes.rows[0]
        });

    } catch (error: any) {
        console.error('FULL ERROR in createOpd:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code) errorMessage += ` (Kode PG: ${error.code})`;
        if (error.detail) errorMessage += ` - ${error.detail}`;
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    }
};

export const createBulkOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ success: false, message: 'Data yang dikirim harus berupa array yang tidak kosong' });
        return;
    }

    try {
        const values: any[] = [];
        const placeholders: string[] = [];
        let index = 1;

        data.forEach(item => {
            placeholders.push(`($${index++}, $${index++}, $${index++}, $${index++}, $${index++})`);
            values.push(
                item.namaOpd || item.nama_opd,
                item.alamat || null,
                item.kontak || null,
                item.pic || null,
                item.status === 'Aktif' || item.is_active === true
            );
        });

        const query = `
            INSERT INTO opd (nama_opd, alamat, kontak, pic, is_active)
            VALUES ${placeholders.join(', ')}
            RETURNING *;
        `;

        const result = await executeQueryWithContext(query, values, req.user);

        res.status(201).json({
            success: true,
            message: `Berhasil menambahkan ${result.rowCount} data OPD baru dari Excel`,
            insertedCount: result.rowCount
        });
    } catch (error: any) {
        console.error('Error in createBulkOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat import data Excel', errorDetail: error.message });
    }
};

export const updateOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_opd, alamat, kontak, pic } = req.body;

    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }

    try {
        const query = `
            UPDATE opd
            SET nama_opd = $1, alamat = $2, kontak = $3, pic = $4, updated_at = CURRENT_TIMESTAMP
            WHERE opd_id = $5
            RETURNING *;
        `;
        const values = [nama_opd, alamat || null, kontak || null, pic || null, id];
        const result = await executeQueryWithContext(query, values, req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil memperbarui data OPD',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateOpd:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const toggleOpdStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        res.status(400).json({ success: false, message: 'Field is_active wajib diisi dan harus berupa boolean (true/false)' });
        return;
    }

    try {
        const query = `
            UPDATE opd
            SET is_active = $1, updated_at = CURRENT_TIMESTAMP
            WHERE opd_id = $2
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [is_active, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }

        const statusText = is_active ? 'diaktifkan' : 'dinonaktifkan';

        res.status(200).json({
            success: true,
            message: `OPD berhasil ${statusText}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in toggleOpdStatus:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};