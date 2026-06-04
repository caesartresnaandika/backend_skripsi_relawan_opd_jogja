/*
 * ============================================================
 * STATISTIK CONTROLLER — DATA VISUALISASI CHART
 * ============================================================
 * Menyediakan data untuk grafik/chart di frontend.
 * Semua fungsi menerapkan branching berdasarkan role:
 * - Super Admin → data global (semua OPD)
 * - OPD Admin → data terbatas ke OPD-nya sendiri
 *
 * Endpoints:
 * 1. GET /api/statistik/gender → Demografi gender
 * 2. GET /api/statistik/kelurahan → Demografi kelurahan (top 5)
 * 3. GET /api/statistik/relawan-per-kader → Relawan per kader (top 5)
 * 4. GET /api/statistik/kader-per-opd → Kader per OPD (top 5)
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

/*
 * GET /api/statistik/gender
 * Demografi gender relawan.
 * - Role OPD: scoped ke OPD-nya (via JOIN penugasan_relawan)
 * - Super Admin: global via view vw_statistik_gender
 */
export const getStatistikGender = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT r.jenis_kelamin AS gender, COUNT(DISTINCT r.relawan_id) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
                WHERE u.status_keaktifan = true AND pr.opd_id = $1
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

/*
 * GET /api/statistik/kelurahan
 * Top 5 kelurahan dengan relawan terbanyak.
 * - Role OPD: scoped ke OPD-nya
 * - Super Admin: global
 */
export const getStatistikKelurahan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT r.kelurahan, COUNT(DISTINCT r.relawan_id) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
                WHERE u.status_keaktifan = true
                  AND r.kelurahan IS NOT NULL
                  AND r.kelurahan != '-'
                  AND pr.opd_id = $1
                GROUP BY r.kelurahan
                ORDER BY jumlah DESC
                LIMIT 5
            `, [user.opd_id], user);
        } else {
            result = await executeQueryWithContext(`
                SELECT r.kelurahan, COUNT(r.relawan_id) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                WHERE u.status_keaktifan = true
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

/*
 * GET /api/statistik/relawan-per-kader
 * Top 5 kader dengan jumlah relawan terbanyak.
 */
export const getRelawanPerKader = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT k.nama_kader AS name, COUNT(DISTINCT pr.relawan_id) AS value
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
                SELECT k.nama_kader AS name, COUNT(DISTINCT pr.relawan_id) AS value
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

/*
 * GET /api/statistik/kader-per-opd
 * Top 5 OPD dengan jumlah kader terbanyak.
 */
export const getKaderPerOPD = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let result;

        if (user.role === 'opd') {
            result = await executeQueryWithContext(`
                SELECT o.nama_opd AS name, COUNT(k.kader_id) AS value
                FROM opd o
                LEFT JOIN kader k ON o.opd_id = k.opd_id AND k.status_keaktifan = true
                WHERE o.opd_id = $1
                GROUP BY o.opd_id, o.nama_opd
            `, [user.opd_id], user);
        } else {
            result = await executeQueryWithContext(`
                SELECT o.nama_opd AS name, COUNT(k.kader_id) AS value
                FROM opd o
                LEFT JOIN kader k ON o.opd_id = k.opd_id AND k.status_keaktifan = true
                WHERE o.status_keaktifan = true
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