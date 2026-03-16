import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Dapatkan semua kader (bisa difilter berdasarkan opd_id)
export const getAllKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        let query: string;
        let params: any[];

        if (opd_id) {
            query = `
                SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.opd_id, k.created_at, k.updated_at, k.is_active,
                       o.nama_opd
                FROM kader k
                JOIN opd o ON k.opd_id = o.opd_id
                WHERE k.opd_id = $1
                ORDER BY k.created_at DESC;
            `;
            params = [opd_id];
        } else {
            query = `
                SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.opd_id, k.created_at, k.updated_at, k.is_active,
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
        console.error('Error in getAllkader:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 2. Dapatkan detail kader berdasarkan ID
export const getKaderById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `
            SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.opd_id, k.created_at, k.updated_at, k.is_active,
                   o.nama_opd
            FROM kader k
            JOIN opd o ON k.opd_id = o.opd_id
            WHERE k.kader_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'kader tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail kader',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getkaderById:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 3. Buat kader baru
export const createKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id, nama_kader, deskripsi, pic } = req.body;

    if (!opd_id || !nama_kader) {
        res.status(400).json({ success: false, message: 'Field opd_id dan nama_kader wajib diisi' });
        return;
    }

    try {
        const query = `
            INSERT INTO kader (opd_id, nama_kader, deskripsi, pic)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [opd_id, nama_kader, deskripsi || null, pic || null], req.user);

        res.status(201).json({
            success: true,
            message: 'Berhasil menambahkan kader baru',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('FULL ERROR in createkader:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code === '23505') errorMessage = 'Nama kader sudah digunakan di OPD yang sama';
        if (error.code === '23503') errorMessage = 'OPD yang dipilih tidak ditemukan';
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    }
};

// 4. Update kader
export const updateKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_kader, deskripsi, pic } = req.body;

    if (!nama_kader) {
        res.status(400).json({ success: false, message: 'Field nama_kader wajib diisi' });
        return;
    }

    try {
        const query = `
            UPDATE kader
            SET nama_kader = $1, deskripsi = $2, pic = $3, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $4
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [nama_kader, deskripsi || null, pic || null, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'kader tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil memperbarui kader',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updatekader:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 5. Hapus kader
export const deleteKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `DELETE FROM kader WHERE kader_id = $1 RETURNING kader_id;`;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'kader tidak ditemukan' });
            return;
        }

        res.status(200).json({ success: true, message: 'Berhasil menghapus kader' });
    } catch (error: any) {
        console.error('Error in deletekader:', error.message);
        // Cek apakah masih ada relawan yang terhubung
        if (error.code === '23503') {
            res.status(400).json({ success: false, message: 'kader tidak dapat dihapus karena masih memiliki relawan aktif' });
            return;
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 6. Toggle Status kader
export const toggleKaderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
        res.status(400).json({ success: false, message: 'Field is_active wajib diisi' });
        return;
    }

    try {
        const query = `
            UPDATE kader
            SET is_active = $1, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $2
            RETURNING kader_id, nama_kader, is_active;
        `;
        const result = await executeQueryWithContext(query, [is_active, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'kader tidak ditemukan' });
            return;
        }

        const statusText = result.rows[0].is_active ? 'diaktifkan' : 'dinonaktifkan';
        
        res.status(200).json({
            success: true,
            message: `kader ${result.rows[0].nama_kader} berhasil ${statusText}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in togglekaderStatus:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
