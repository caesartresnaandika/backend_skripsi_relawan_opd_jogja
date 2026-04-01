// statistikController.ts
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// GET /api/statistik/gender
export const getStatistikGender = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT r.jenis_kelamin AS gender, COUNT(*) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
                WHERE u.is_active = true AND pr.opd_id = $1
                GROUP BY r.jenis_kelamin
            `, [user.opd_id], user);
        } else {
            result = await executeQueryWithContext(
                `SELECT * FROM vw_statistik_gender`, [], user
            );
        }

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getStatistikGender:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// GET /api/statistik/kelurahan
export const getStatistikKelurahan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT r.kelurahan, COUNT(*) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
                WHERE u.is_active = true
                  AND r.kelurahan IS NOT NULL
                  AND r.kelurahan != '-'
                  AND pr.opd_id = $1
                GROUP BY r.kelurahan
                ORDER BY jumlah DESC
                LIMIT 5
            `, [user.opd_id], user);
        } else {
            result = await executeQueryWithContext(`
                SELECT r.kelurahan, COUNT(*) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                WHERE u.is_active = true
                  AND r.kelurahan IS NOT NULL
                  AND r.kelurahan != '-'
                GROUP BY r.kelurahan
                ORDER BY jumlah DESC
                LIMIT 5
            `, [], user);
        }

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getStatistikKelurahan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// GET /api/statistik/relawan-per-kader
export const getRelawanPerKader = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT k.nama_kader AS name, COUNT(pr.relawan_id) AS value
                FROM kader k
                LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id
                    AND pr.status_keaktifan = 'Aktif'
                WHERE k.opd_id = $1
                GROUP BY k.kader_id, k.nama_kader
                ORDER BY value DESC
                LIMIT 5
            `, [user.opd_id], user);
        } else {
            result = await executeQueryWithContext(`
                SELECT k.nama_kader AS name, COUNT(pr.relawan_id) AS value
                FROM kader k
                LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id
                    AND pr.status_keaktifan = 'Aktif'
                GROUP BY k.kader_id, k.nama_kader
                ORDER BY value DESC
                LIMIT 5
            `, [], user);
        }

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getRelawanPerKader:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// GET /api/statistik/kader-per-opd
export const getKaderPerOPD = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT o.nama_opd AS name, COUNT(k.kader_id) AS value
                FROM opd o
                LEFT JOIN kader k ON o.opd_id = k.opd_id AND k.is_active = true
                WHERE o.opd_id = $1
                GROUP BY o.opd_id, o.nama_opd
            `, [user.opd_id], user);
        } else {
            result = await executeQueryWithContext(`
                SELECT o.nama_opd AS name, COUNT(k.kader_id) AS value
                FROM opd o
                LEFT JOIN kader k ON o.opd_id = k.opd_id AND k.is_active = true
                WHERE o.is_active = true
                GROUP BY o.opd_id, o.nama_opd
                ORDER BY value DESC
                LIMIT 5
            `, [], user);
        }

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKaderPerOPD:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};