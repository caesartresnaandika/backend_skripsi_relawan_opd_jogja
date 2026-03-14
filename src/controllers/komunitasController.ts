import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Dapatkan semua komunitas (bisa difilter berdasarkan opd_id)
export const getAllKomunitas = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        let query: string;
        let params: any[];

        if (opd_id) {
            query = `
                SELECT k.komunitas_id, k.nama_komunitas, k.deskripsi, k.pic, k.opd_id, k.created_at, k.updated_at,
                       o.nama_opd
                FROM komunitas k
                JOIN opd o ON k.opd_id = o.opd_id
                WHERE k.opd_id = $1
                ORDER BY k.created_at DESC;
            `;
            params = [opd_id];
        } else {
            query = `
                SELECT k.komunitas_id, k.nama_komunitas, k.deskripsi, k.pic, k.opd_id, k.created_at, k.updated_at,
                       o.nama_opd
                FROM komunitas k
                JOIN opd o ON k.opd_id = o.opd_id
                ORDER BY k.created_at DESC;
            `;
            params = [];
        }

        const result = await executeQueryWithContext(query, params, req.user);
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar komunitas',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getAllKomunitas:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 2. Dapatkan detail komunitas berdasarkan ID
export const getKomunitasById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `
            SELECT k.komunitas_id, k.nama_komunitas, k.deskripsi, k.pic, k.opd_id, k.created_at, k.updated_at,
                   o.nama_opd
            FROM komunitas k
            JOIN opd o ON k.opd_id = o.opd_id
            WHERE k.komunitas_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Komunitas tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail komunitas',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getKomunitasById:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 3. Buat komunitas baru
export const createKomunitas = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id, nama_komunitas, deskripsi, pic } = req.body;

    if (!opd_id || !nama_komunitas) {
        res.status(400).json({ success: false, message: 'Field opd_id dan nama_komunitas wajib diisi' });
        return;
    }

    try {
        const query = `
            INSERT INTO komunitas (opd_id, nama_komunitas, deskripsi, pic)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [opd_id, nama_komunitas, deskripsi || null, pic || null], req.user);

        res.status(201).json({
            success: true,
            message: 'Berhasil menambahkan komunitas baru',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('FULL ERROR in createKomunitas:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code === '23505') errorMessage = 'Nama komunitas sudah digunakan di OPD yang sama';
        if (error.code === '23503') errorMessage = 'OPD yang dipilih tidak ditemukan';
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    }
};

// 4. Update komunitas
export const updateKomunitas = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_komunitas, deskripsi, pic } = req.body;

    if (!nama_komunitas) {
        res.status(400).json({ success: false, message: 'Field nama_komunitas wajib diisi' });
        return;
    }

    try {
        const query = `
            UPDATE komunitas
            SET nama_komunitas = $1, deskripsi = $2, pic = $3, updated_at = CURRENT_TIMESTAMP
            WHERE komunitas_id = $4
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [nama_komunitas, deskripsi || null, pic || null, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Komunitas tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil memperbarui komunitas',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateKomunitas:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 5. Hapus komunitas
export const deleteKomunitas = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `DELETE FROM komunitas WHERE komunitas_id = $1 RETURNING komunitas_id;`;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Komunitas tidak ditemukan' });
            return;
        }

        res.status(200).json({ success: true, message: 'Berhasil menghapus komunitas' });
    } catch (error: any) {
        console.error('Error in deleteKomunitas:', error.message);
        // Cek apakah masih ada relawan yang terhubung
        if (error.code === '23503') {
            res.status(400).json({ success: false, message: 'Komunitas tidak dapat dihapus karena masih memiliki relawan aktif' });
            return;
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
