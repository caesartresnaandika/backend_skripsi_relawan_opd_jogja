import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { executeQueryWithContext } from '../../config/db';

export interface RelawanAuthRequest extends AuthRequest {
    relawan_id?: number;
}

export const requireRelawanContext = async (req: RelawanAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Verifikasi tipe Role
        if (!req.user || req.user.role !== 'relawan') {
            res.status(403).json({ success: false, message: 'Akses ditolak. Fitur ini khusus untuk Relawan.' });
            return;
        }

        // 2. Cari relawan_id di database
        const result = await executeQueryWithContext(
            `SELECT relawan_id FROM relawan WHERE user_id = $1 LIMIT 1`,
            [req.user.id],
            req.user
        );

        // Jika belum ada record di tabel relawan (misal: pendaftaran baru yang belum diisi detailnya)
        if (result.rows.length === 0) {
            res.status(403).json({ 
                success: false, 
                message: 'Data biodata relawan Anda belum terdata di sistem. Silakan hubungi Admin.' 
            });
            return;
        }

        // 3. Simpan ke req object
        req.relawan_id = result.rows[0].relawan_id;
        
        next();

    } catch (error: any) {
        console.error('Error in requireRelawanContext:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memverifikasi identitas Relawan.' });
    }
};
