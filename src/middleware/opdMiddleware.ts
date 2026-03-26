//opdMiddleware
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { executeQueryWithContext } from '../../config/db';

export interface OpdAuthRequest extends AuthRequest {
    opd_id?: number;
}

export const requireOpdContext = async (req: OpdAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Harus ada user (dari verifyToken) dan role-nya harus 'opd'
        if (!req.user || req.user.role !== 'opd') {
            res.status(403).json({ success: false, message: 'Akses ditolak. Layanan ini khusus untuk Role Admin OPD.' });
            return;
        }

        // Cari opd_id-nya di database based on user_id
        const result = await executeQueryWithContext(
            `SELECT opd_id FROM pengelola_opd WHERE user_id = $1 LIMIT 1`,
            [req.user.id],
            req.user
        );

        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Akses ditolak. Akun Anda belum terikat ke Instansi (OPD) manapun.' });
            return;
        }

        // Simpan opd_id ke request object agar controller di rute ini tidak perlu query ulang
        req.opd_id = result.rows[0].opd_id;
        
        next();

    } catch (error: any) {
        console.error('Error in requireOpdContext:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memverifikasi identitas OPD.' });
    }
};
