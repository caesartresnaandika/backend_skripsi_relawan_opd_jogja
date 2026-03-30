//relawanMiddleware
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { executeQueryWithContext } from '../../config/db';

export interface RelawanAuthRequest extends AuthRequest {
    relawan_id?: number;
}

export const requireRelawanContext = async (req: RelawanAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('🔍 requireRelawanContext - user:', req.user); // ← tambah ini

        if (!req.user || req.user.role !== 'relawan') {
            console.log('❌ Role check failed:', req.user?.role);  // ← tambah ini
            res.status(403).json({ success: false, message: 'Akses ditolak.' });
            return;
        }

        const result = await executeQueryWithContext(
            `SELECT relawan_id FROM relawan WHERE user_id = $1 LIMIT 1`,
            [req.user.id],
            req.user   // ← ini yang penting: bawa context user agar RLS tidak memblokir
        );
        console.log('🔍 Query result rows:', result.rows.length); // ← tambah ini

        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Data biodata relawan belum terdata.' });
            return;
        }

        req.relawan_id = result.rows[0].relawan_id;
        next();
    } catch (error: any) {
        console.error('Error in requireRelawanContext:', error);
        res.status(500).json({ success: false, message: 'Kesalahan verifikasi identitas.' });
    }
};