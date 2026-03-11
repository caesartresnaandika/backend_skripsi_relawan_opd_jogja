import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdContextMiddleware';

// 1. Dapatkan Daftar Kader di OPD ini
export const getKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT k.komunitas_id, k.nama_komunitas, k.deskripsi, 
                   COUNT(pr.relawan_id) as jumlah_anggota
            FROM komunitas k
            LEFT JOIN penugasan_relawan pr ON k.komunitas_id = pr.komunitas_id
            WHERE k.opd_id = $1
            GROUP BY k.komunitas_id
            ORDER BY k.nama_komunitas ASC
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
        const { nama_komunitas, deskripsi } = req.body;

        if (!nama_komunitas) {
            res.status(400).json({ success: false, message: 'Nama komunitas wajib diisi' });
            return;
        }

        const result = await executeQueryWithContext(`
            INSERT INTO komunitas (opd_id, nama_komunitas, deskripsi)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [opdId, nama_komunitas, deskripsi], req.user);

        res.status(201).json({
            success: true,
            message: 'Kader/Komunitas berhasil ditambahkan',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in createKader:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 3. Update Kader
export const updateKader = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);
        const { nama_komunitas, deskripsi } = req.body;

        // Pastikan komunitas ini benar-benar milik OPD yang login
        const findQuery = await executeQueryWithContext(
            `SELECT * FROM komunitas WHERE komunitas_id = $1 AND opd_id = $2`,
            [kaderId, opdId], req.user
        );

        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan di instansi Anda' });
            return;
        }

        const result = await executeQueryWithContext(`
            UPDATE komunitas 
            SET nama_komunitas = $1, deskripsi = $2, updated_at = CURRENT_TIMESTAMP
            WHERE komunitas_id = $3
            RETURNING *
        `, [nama_komunitas, deskripsi, kaderId], req.user);

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

        const result = await executeQueryWithContext(
            `DELETE FROM komunitas WHERE komunitas_id = $1 AND opd_id = $2 RETURNING *`,
            [kaderId, opdId], req.user
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        res.status(200).json({ success: true, message: 'Kader berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deleteKader:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
