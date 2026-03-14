import { Request, Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET /api/admin/saran
 * Mengambil semua saran masukan. Hanya untuk Super Admin.
 * Mendukung query: ?page=1&limit=10&status_baca=true|false
 */
export const getAllSaran = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const statusBaca = req.query.status_baca as string; // 'true' atau 'false'

        let baseQuery = `
            SELECT 
                sm.saran_id,
                sm.subjek,
                sm.pesan,
                sm.status_baca,
                sm.created_at,
                u.nama_lengkap,
                u.no_hp,
                u.role
            FROM saran_masukan sm
            JOIN users u ON sm.user_id = u.user_id
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (statusBaca !== undefined && statusBaca !== '') {
            baseQuery += ` AND sm.status_baca = $${paramIndex}`;
            values.push(statusBaca === 'true');
            paramIndex++;
        }

        // Hitung total record untuk pagination
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total_count`;
        const countResult = await executeQueryWithContext(countQuery, values, req.user);
        const totalRecords = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalRecords / limit);

        const finalQuery = `
            ${baseQuery}
            ORDER BY sm.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        values.push(limit, offset);

        const result = await executeQueryWithContext(finalQuery, values, req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar saran masukan',
            data: result.rows,
            pagination: {
                total_records: totalRecords,
                total_pages: totalPages,
                current_page: page,
                limit_per_page: limit,
                has_next_page: page < totalPages,
                has_prev_page: page > 1
            }
        });

    } catch (error: any) {
        console.error('Error in getAllSaran:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat membaca saran' });
    }
};

/**
 * POST /api/saran
 * Mengirim saran masukan. Bisa dilakukan oleh semua user yang sudah login (Relawan, OPD, dll).
 * Body: { subjek?: string, pesan: string }
 */
export const createSaran = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { subjek, pesan } = req.body;
        const userId = req.user?.user_id;

        if (!pesan) {
            res.status(400).json({ success: false, message: 'Field "pesan" wajib diisi' });
            return;
        }

        if (!userId) {
            res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
            return;
        }

        const query = `
            INSERT INTO saran_masukan (user_id, subjek, pesan)
            VALUES ($1, $2, $3)
            RETURNING saran_id, subjek, pesan, status_baca, created_at
        `;
        const values = [userId, subjek || null, pesan];

        const result = await executeQueryWithContext(query, values, req.user);

        res.status(201).json({
            success: true,
            message: 'Saran berhasil dikirim. Terima kasih!',
            data: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error in createSaran:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat mengirim saran' });
    }
};

/**
 * PATCH /api/admin/saran/:id/baca
 * Menandai saran sebagai sudah dibaca (atau toggle). Hanya untuk Super Admin.
 * Body: { status_baca: true | false }
 */
export const updateStatusBaca = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status_baca } = req.body;

        if (status_baca === undefined) {
            res.status(400).json({ success: false, message: 'Field "status_baca" wajib diisi (true/false)' });
            return;
        }

        const query = `
            UPDATE saran_masukan
            SET status_baca = $1
            WHERE saran_id = $2
            RETURNING saran_id, status_baca
        `;
        const result = await executeQueryWithContext(query, [status_baca, id], req.user);

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, message: 'Saran tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Saran berhasil ditandai sebagai ${status_baca ? 'sudah dibaca' : 'belum dibaca'}`,
            data: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error in updateStatusBaca:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
