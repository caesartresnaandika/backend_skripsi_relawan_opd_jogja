import { Request, Response } from 'express';
import pool from '../../config/db';

export const getAllKemantren = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM kemantren ORDER BY nama_kemantren ASC');
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getAllKemantren:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil data kemantren' });
    }
};

export const getKelurahanByKemantren = async (req: Request, res: Response): Promise<void> => {
    const idKemantren = req.params.idKemantren;
    try {
        const result = await pool.query(
            'SELECT * FROM kelurahan WHERE id_kemantren = $1 ORDER BY nama_kelurahan ASC',
            [idKemantren]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKelurahanByKemantren:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil data kelurahan' });
    }
};

export const getAllKelurahan = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM kelurahan ORDER BY nama_kelurahan ASC');
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getAllKelurahan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil data semua kelurahan' });
    }
};
