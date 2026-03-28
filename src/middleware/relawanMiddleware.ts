// backend/src/middleware/relawanMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import pool from '../../config/db';

export interface RelawanAuthRequest extends Request {
    relawan_id?: number;
    user?: {
        id: number;
        role: string;
    };
}

export const requireRelawanContext = async (
    req: RelawanAuthRequest, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'relawan') {
            res.status(403).json({ message: 'Akses Ditolak! Hanya untuk relawan.' });
            return;
        }

        const result = await pool.query(
            `SELECT relawan_id FROM relawan WHERE user_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            res.status(403).json({ message: 'User tidak terdaftar sebagai relawan.' });
            return;
        }

        req.relawan_id = result.rows[0].relawan_id;

        // Set context untuk RLS
        await pool.query("SET LOCAL app.current_user_id = $1;", [req.user.id]);
        await pool.query("SET LOCAL app.current_user_role = $1;", [req.user.role]);

        next();
    } catch (error: any) {
        console.error('Error in requireRelawanContext:', error);
        res.status(500).json({ message: 'Server error' });
    }
};