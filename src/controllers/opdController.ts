import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAllOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT opd_id, nama_opd, alamat, kontak, pic, is_active, created_at, updated_at
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
            SELECT opd_id, nama_opd, alamat, kontak, pic, is_active, created_at, updated_at
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
    const { nama_opd, alamat, kontak, pic } = req.body;

    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }

    try {
        const query = `
            INSERT INTO opd (nama_opd, alamat, kontak, pic)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [nama_opd, alamat || null, kontak || null, pic || null];
        const result = await executeQueryWithContext(query, values, req.user);

        res.status(201).json({
            success: true,
            message: 'Berhasil menambahkan OPD baru',
            data: result.rows[0]
        });
    } catch (error: any) {
        // PERUBAHAN DEBUGGING: Log seluruh error object ke console
        console.error('FULL ERROR in createOpd:', error);
        
        let errorMessage = 'Terjadi kesalahan pada server';
        // Tambahkan detail error dari PostgreSQL jika ada (misal masalah RLS)
        if (error.code) {
           errorMessage += ` (Kode PG: ${error.code})`;
        }
        if (error.detail) {
           errorMessage += ` - ${error.detail}`;
        }

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
        // Prepare bulk insert query
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
