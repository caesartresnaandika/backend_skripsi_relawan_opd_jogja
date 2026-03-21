//opdRelawanControllers.ts
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdMiddleware';

// 1. Dapatkan Daftar Relawan yang bertugas di OPD ini
export const getRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT 
                r.relawan_id, u.nama_lengkap, u.nik, r.alamat_domisili, r.kelurahan,
                k.nama_kader as kader, pr.status_keaktifan
            FROM penugasan_relawan pr
            JOIN relawan r ON pr.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            WHERE pr.opd_id = $1
            ORDER BY u.nama_lengkap ASC
        `, [opdId], req.user);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getRelawanByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 2. Dapatkan Daftar Surat Keputusan (SK) milik OPD ini
export const getSkByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, 
                sk.batas_aktif, sk.status, sk.file_path,
                (SELECT COUNT(*) FROM penugasan_relawan pr WHERE pr.sk_id = sk.sk_id) as jumlah_relawan
            FROM surat_keputusan sk
            WHERE sk.opd_id = $1
            ORDER BY sk.tanggal_terbit DESC
        `, [opdId], req.user);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getSkByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
