import { Response } from 'express';
import pool from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware'; // Import Interface Custom tadi

// LIHAT TAGIHAN SAYA (Khusus Relawan Login)
export const getMyTagihan = async (req: AuthRequest, res: Response) => {
    try {
        // Ambil ID dari Token JWT
        const userId = req.user?.id;

        if (!userId) {
            res.status(403).json({ message: 'User ID tidak valid' });
            return;
        }

        const result = await pool.query(
            `SELECT t.*, u.nama_lengkap 
       FROM tagihan_bpjs t
       JOIN relawan r ON t.relawan_id = r.relawan_id
       JOIN users u ON r.user_id = u.user_id
       WHERE u.user_id = $1`,
            [userId]
        );

        res.json({
            user_id: userId,
            total_tagihan: result.rowCount,
            data: result.rows
        });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};