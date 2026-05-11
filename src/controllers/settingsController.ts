import { Request, Response } from 'express';
import pool from '../../config/db';

export const getHotlineSettings = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT telepon, whatsapp, jam_layanan, updated_at FROM hotline_settings ORDER BY id DESC LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Settings not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error getting hotline settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateHotlineSettings = async (req: Request, res: Response) => {
    try {
        const { telepon, whatsapp, jam_layanan } = req.body;
        const userId = (req as any).user?.user_id;


        if (!telepon || !whatsapp || !jam_layanan) {
            return res.status(400).json({ success: false, message: 'Semua field (telepon, whatsapp, jam_layanan) harus diisi' });
        }

        const result = await pool.query(
            `UPDATE hotline_settings 
             SET telepon = $1, whatsapp = $2, jam_layanan = $3, updated_at = NOW(), updated_by = $4 
             RETURNING telepon, whatsapp, jam_layanan, updated_at, updated_by`,
            [telepon, whatsapp, jam_layanan, userId]
        );

        if (result.rows.length === 0) {
            // fallback if table is empty
            const insertRes = await pool.query(
                `INSERT INTO hotline_settings (telepon, whatsapp, jam_layanan, updated_by) 
                VALUES ($1, $2, $3, $4) RETURNING telepon, whatsapp, jam_layanan, updated_at, updated_by`,
                [telepon, whatsapp, jam_layanan, userId]
            );
            return res.json({ success: true, data: insertRes.rows[0], message: 'Hotline settings created' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Hotline settings updated successfully' });
    } catch (error) {
        console.error('Error updating hotline settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
