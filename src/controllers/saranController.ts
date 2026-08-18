/*
 * ============================================================
 * SARAN CONTROLLER — FEEDBACK / SARAN MASUKAN
 * ============================================================
 * Mengelola saran dan masukan dari pengguna.
 *
 * Fitur:
 * 1. CREATE (POST /api/saran): Semua user yang login bisa kirim saran
 * 2. GET MY SARAN (GET /api/saran/me): User lihat riwayat sarannya sendiri
 * 3. GET ALL (GET /api/saran/admin): Super Admin lihat semua saran (search + filter)
 * 4. UPDATE STATUS (PATCH /api/saran/admin/:id/baca): Admin tandai selesai
 *
 * Status saran: 'Menunggu' (default) atau 'Selesai'
 * ============================================================
 */

import { Request, Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET MY SARAN (Semua role login)
 * Mengambil riwayat saran masukan milik user yang sedang login saja.
 * Endpoint: GET /api/saran/me
 */
export const getMySaran = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
            return;
        }

        const query = `
            SELECT 
                saran_id,
                subjek,
                pesan,
                status_keaktifan,
                catatan_admin,
                created_at,
                updated_at
            FROM saran_masukan
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        const result = await executeQueryWithContext(query, [userId], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil riwayat saran saya',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getMySaran:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat membaca saran' });
    }
};

/**
 * GET ALL SARAN (Admin only)
 * Mengambil semua saran masukan dengan pagination, filter status, dan search teks.
 * Endpoint: GET /api/saran/admin
 * Query: ?page=1&limit=10&status=Menunggu|Selesai&q=
 */
export const getAllSaran = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const statusFilter = req.query.status as string; // 'Menunggu' atau 'Selesai'
        const search = req.query.q as string;

        let baseQuery = `
            SELECT 
                sm.saran_id,
                sm.subjek,
                sm.pesan,
                sm.status_keaktifan,
                sm.catatan_admin,
                sm.created_at,
                sm.updated_at,
                u.nama_lengkap,
                u.no_hp,
                u.role
            FROM saran_masukan sm
            JOIN users u ON sm.user_id = u.user_id
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (statusFilter && ['Menunggu', 'Selesai'].includes(statusFilter)) {
            baseQuery += ` AND sm.status_keaktifan = $${paramIndex}`;
            values.push(statusFilter);
            paramIndex++;
        }

        if (search && search.trim() !== '') {
            baseQuery += ` AND (sm.pesan ILIKE $${paramIndex} OR sm.subjek ILIKE $${paramIndex} OR u.nama_lengkap ILIKE $${paramIndex} OR u.no_hp ILIKE $${paramIndex})`;
            values.push(`%${search.trim()}%`);
            paramIndex++;
        }

        // Hitung total untuk pagination
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
 * Mengirim saran masukan. Bisa dilakukan oleh semua user yang sudah login.
 * Body: { subjek?: string, pesan: string }
 */
export const createSaran = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { subjek, pesan } = req.body;
        const userId = req.user?.id;

        if (!pesan || typeof pesan !== 'string' || pesan.trim() === '') {
            res.status(400).json({ success: false, message: 'Field "pesan" wajib diisi' });
            return;
        }

        if (!userId) {
            res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
            return;
        }

        const resolvedSubjek = subjek && subjek.trim() !== ''
            ? subjek.trim()
            : `Saran dari ${(req.user as any)?.nama_lengkap || req.user?.role || 'Pengguna'}`;

        const query = `
            INSERT INTO saran_masukan (user_id, subjek, pesan, status_keaktifan)
            VALUES ($1, $2, $3, 'Menunggu')
            RETURNING saran_id, subjek, pesan, status_keaktifan, created_at
        `;
        const result = await executeQueryWithContext(query, [userId, resolvedSubjek, pesan.trim()], req.user);

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
 * PATCH /api/saran/admin/:id/baca
 * Update status saran + opsional tambah catatan admin. Hanya untuk Super Admin.
 * Body: { status_keaktifan: 'Menunggu' | 'Selesai', catatan_admin?: string }
 */
export const updateStatusBaca = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status_keaktifan, catatan_admin } = req.body;

        if (!status_keaktifan || !['Menunggu', 'Selesai'].includes(status_keaktifan)) {
            res.status(400).json({ success: false, message: 'Field "status_keaktifan" wajib diisi dengan nilai "Menunggu" atau "Selesai"' });
            return;
        }

        const query = `
            UPDATE saran_masukan
            SET status_keaktifan = $1,
                catatan_admin = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE saran_id = $3
            RETURNING saran_id, status_keaktifan, catatan_admin, updated_at
        `;
        const result = await executeQueryWithContext(
            query,
            [status_keaktifan, catatan_admin || null, id],
            req.user
        );

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, message: 'Saran tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Saran berhasil ditandai sebagai "${status_keaktifan}"`,
            data: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error in updateStatusBaca:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};