import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { RelawanAuthRequest } from '../middleware/relawanMiddleware';

export const getMyHistory = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const relawanId = req.relawan_id;

        // Ambil histori 2 jenis data secara paralel
        const [
            riwayatPenugasanRes,
            riwayatPengajuanRes
        ] = await Promise.all([
            // 1. History Penugasan (Semua status termasuk yang sudah Selesai)
            executeQueryWithContext(`
                SELECT 
                    pr.status_keaktifan, pr.created_at, pr.updated_at,
                    sk.nomor_sk, sk.judul_sk, sk.batas_aktif,
                    o.nama_opd, k.nama_kader
                FROM penugasan_relawan pr
                JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
                JOIN opd o ON pr.opd_id = o.opd_id
                LEFT JOIN kader k ON pr.kader_id = k.kader_id
                WHERE pr.relawan_id = $1
                ORDER BY pr.created_at DESC
            `, [relawanId], req.user),

            // 2. History Status Pengajuan Perubahan Biodata
            executeQueryWithContext(`
                SELECT 
                    pengajuan_id, jenis_perubahan, status, 
                    catatan_relawan, catatan_verifikator,
                    tanggal_pengajuan, tanggal_verifikasi
                FROM pengajuan_perubahan_data
                WHERE relawan_id = $1
                ORDER BY tanggal_pengajuan DESC
            `, [relawanId], req.user)
        ]);

        res.status(200).json({
            success: true,
            data: {
                riwayat_penugasan: riwayatPenugasanRes.rows,
                riwayat_pengajuan: riwayatPengajuanRes.rows
            }
        });

    } catch (error: any) {
        console.error('Error in getMyHistory:', error);
        res.status(500).json({ success: false, message: 'Server error saat menarik riwayat.' });
    }
};
