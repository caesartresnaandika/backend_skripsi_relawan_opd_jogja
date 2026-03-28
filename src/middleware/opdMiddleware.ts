// backend/src/middleware/opdMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import pool from '../../config/db';

export interface OpdAuthRequest extends Request {
    opd_id?: number;
    opd_name?: string;
    user?: {
        id: number;
        role: string;
        opd_id?: number;
        nama_opd?: string;
    };
}

export const requireOpdContext = async (
    req: OpdAuthRequest, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'opd') {
            res.status(403).json({ message: 'Akses Ditolak! Hanya untuk user OPD.' });
            return;
        }

        const result = await pool.query(
            `SELECT po.opd_id, o.nama_opd 
             FROM pengelola_opd po 
             JOIN opd o ON po.opd_id = o.opd_id 
             WHERE po.user_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            res.status(403).json({ message: 'User OPD tidak terasosiasi dengan OPD manapun.' });
            return;
        }

        req.opd_id = result.rows[0].opd_id;
        req.opd_name = result.rows[0].nama_opd;

        // Set context untuk RLS
        await pool.query("SET LOCAL app.current_opd_id = $1;", [req.opd_id]);
        await pool.query("SET LOCAL app.current_user_id = $1;", [req.user.id]);
        await pool.query("SET LOCAL app.current_user_role = $1;", [req.user.role]);

        next();
    } catch (error: any) {
        console.error('Error in requireOpdContext:', error);
        res.status(500).json({ message: 'Server error' });
    }
};