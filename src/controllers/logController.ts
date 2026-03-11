import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Ambil Parameter dari Query String (dengan nilai default)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const actionType = req.query.action_type as string; // misal: 'INSERT', 'UPDATE', 'DELETE'
        const startDate = req.query.start_date as string;   // format: YYYY-MM-DD
        const endDate = req.query.end_date as string;       // format: YYYY-MM-DD
        const userId = req.query.user_id as string;         // Filter by specific user

        // 2. Siapkan Query Dasar & Parameter
        // Kita JOIN dengan tabel users agar frontend langsung dapat nama pelakunya
        let baseQuery = `
            SELECT 
                al.log_id, al.action_type, al.table_name, al.record_id, 
                al.old_value, al.new_value, al.ip_address, al.timestamp,
                u.nama_lengkap as nama_pengguna, u.role as role_pengguna, u.nik
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        // 3. Pasang Filter Secara Dinamis
        if (actionType) {
            baseQuery += ` AND al.action_type = $${paramIndex}`;
            values.push(actionType.toUpperCase());
            paramIndex++;
        }

        if (userId) {
            baseQuery += ` AND al.user_id = $${paramIndex}`;
            values.push(userId);
            paramIndex++;
        }

        if (startDate) {
            // Berlaku dari awal hari (00:00:00)
            baseQuery += ` AND al.timestamp >= $${paramIndex}::timestamp`;
            values.push(`${startDate} 00:00:00`);
            paramIndex++;
        }

        if (endDate) {
            // Sampai akhir hari (23:59:59)
            baseQuery += ` AND al.timestamp <= $${paramIndex}::timestamp`;
            values.push(`${endDate} 23:59:59`);
            paramIndex++;
        }

        // 4. Hitung TOTAL RECORD (Untuk Pagination)
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as total_count`;
        const countResult = await executeQueryWithContext(countQuery, values, req.user);
        const totalRecords = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalRecords / limit);

        // 5. Terapkan Sorting (Terbaru ke Terlama), Limit, dan Offset
        const finalQuery = `
            ${baseQuery}
            ORDER BY al.timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        values.push(limit, offset);

        const result = await executeQueryWithContext(finalQuery, values, req.user);

        // 6. Kirim Response ke Frontend Format Standar
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar log aktivitas',
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
        console.error('Error in getAuditLogs:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat membaca logs' });
    }
};
