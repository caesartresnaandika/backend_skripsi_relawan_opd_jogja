import { Request, Response } from 'express';
import pool from '../../config/db';

// Helper: set RLS context
async function setRLSContext(client: any, userId: number, role: string, opdId?: number) {
    await client.query(`SET LOCAL app.current_user_id = $1`, [userId]);
    await client.query(`SET LOCAL app.current_user_role = $1`, [role]);
    if (opdId) {
        await client.query(`SET LOCAL app.current_opd_id = $1`, [opdId]);
    }
}

// GET /api/statistik/gender
export const getStatistikGender = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const user = (req as any).user;
        await client.query('BEGIN');
        await setRLSContext(client, user.user_id, user.role, user.opd_id);

        let result;
        if (user.role === 'opd') {
            // OPD: hanya gender relawan di OPD mereka
            result = await client.query(`
                SELECT r.jenis_kelamin AS gender, COUNT(*) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
                WHERE u.is_active = true AND pr.opd_id = $1
                GROUP BY r.jenis_kelamin
            `, [user.opd_id]);
        } else {
            // Super admin: semua
            result = await client.query(`SELECT * FROM vw_statistik_gender`);
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Server error', error: err });
    } finally {
        client.release();
    }
};

// GET /api/statistik/kelurahan
export const getStatistikKelurahan = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const user = (req as any).user;
        await client.query('BEGIN');
        await setRLSContext(client, user.user_id, user.role, user.opd_id);

        let result;
        if (user.role === 'opd') {
            result = await client.query(`
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
                LIMIT 10
            `, [user.opd_id]);
        } else {
            result = await client.query(`
                SELECT r.kelurahan, COUNT(*) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                WHERE u.is_active = true
                  AND r.kelurahan IS NOT NULL
                  AND r.kelurahan != '-'
                GROUP BY r.kelurahan
                ORDER BY jumlah DESC
                LIMIT 10
            `);
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Server error', error: err });
    } finally {
        client.release();
    }
};

// GET /api/statistik/relawan-per-kader
export const getRelawanPerKader = async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
        const user = (req as any).user;
        await client.query('BEGIN');
        await setRLSContext(client, user.user_id, user.role, user.opd_id);

        let result;
        if (user.role === 'opd') {
            // OPD: hanya kader di OPD mereka
            result = await client.query(`
                SELECT k.nama_kader AS name, COUNT(pr.relawan_id) AS value
                FROM kader k
                LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id
                    AND pr.status_keaktifan = 'Aktif'
                WHERE k.opd_id = $1
                GROUP BY k.kader_id, k.nama_kader
                ORDER BY value DESC
            `, [user.opd_id]);
        } else {
            // Super admin: semua kader
            result = await client.query(`
                SELECT k.nama_kader AS name, COUNT(pr.relawan_id) AS value
                FROM kader k
                LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id
                    AND pr.status_keaktifan = 'Aktif'
                GROUP BY k.kader_id, k.nama_kader
                ORDER BY value DESC
            `);
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Server error', error: err });
    } finally {
        client.release();
    }
};

// GET /api/statistik/kader-per-opd
export const getKaderPerOPD = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const user = (req as any).user;
        await client.query('BEGIN');
        await setRLSContext(client, user.user_id, user.role, user.opd_id);

        let result;
        if (user.role === 'opd') {
            // OPD: hanya data OPD mereka sendiri
            result = await client.query(`
                SELECT o.nama_opd AS name, COUNT(k.kader_id) AS value
                FROM opd o
                LEFT JOIN kader k ON o.opd_id = k.opd_id AND k.is_active = true
                WHERE o.opd_id = $1
                GROUP BY o.opd_id, o.nama_opd
            `, [user.opd_id]);
        } else {
            // Super admin: semua OPD
            result = await client.query(`
                SELECT o.nama_opd AS name, COUNT(k.kader_id) AS value
                FROM opd o
                LEFT JOIN kader k ON o.opd_id = k.opd_id AND k.is_active = true
                WHERE o.is_active = true
                GROUP BY o.opd_id, o.nama_opd
                ORDER BY value DESC
            `);
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Server error', error: err });
    } finally {
        client.release();
    }
};