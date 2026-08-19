/*
 * ============================================================
 * RELAWAN HISTORY CONTROLLER
 * ============================================================
 * Menampilkan riwayat aktivitas relawan yang sedang login.
 * Data terdiri dari 2 jenis:
 * 1. Riwayat penugasan (semua status)
 * 2. Riwayat pengajuan perubahan biodata
 *
 * Kedua query dijalankan paralel untuk performa.
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { RelawanAuthRequest } from '../middleware/relawanMiddleware';

/*
 * GET MY HISTORY
 * Mengambil riwayat penugasan dan pengajuan perubahan data
 * secara paralel.
 */
export const getMyHistory = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const relawanId = req.relawan_id;
        const statusFilter = req.query.status as string;

        let pengajuanQuery = `
            SELECT 
                pp.pengajuan_id, pp.jenis_perubahan, pp.status_pengajuan, 
                pp.catatan_relawan, pp.catatan_verifikator,
                pp.tanggal_pengajuan, pp.tanggal_verifikasi, pp.verifikator_id,
                uv.nama_lengkap AS nama_verifikator,
                uv.role AS role_verifikator
            FROM pengajuan_perubahan_data pp
            LEFT JOIN users uv ON pp.verifikator_id = uv.user_id
            WHERE pp.relawan_id = $1
        `;
        const pengajuanParams: any[] = [relawanId];

        if (statusFilter && statusFilter.trim() !== '') {
            pengajuanQuery += ` AND pp.status_pengajuan = $2`;
            pengajuanParams.push(statusFilter.trim());
        }

        pengajuanQuery += ` ORDER BY pp.tanggal_pengajuan DESC`;

        // Ambil histori 2 jenis data secara paralel
        const [
            riwayatPenugasanRes,
            riwayatPengajuanRes
        ] = await Promise.all([
            // 1. History Penugasan (Semua status)
            executeQueryWithContext(`
                SELECT 
                    pr.status_keaktifan, pr.created_at, pr.updated_at,
                    sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif,
                    o.nama_opd, k.nama_kader
                FROM penugasan_relawan pr
                JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
                JOIN opd o ON pr.opd_id = o.opd_id
                LEFT JOIN kader k ON pr.kader_id = k.kader_id
                WHERE pr.relawan_id = $1
                ORDER BY pr.created_at DESC
            `, [relawanId], req.user),

            // 2. History Status Pengajuan Perubahan Biodata
            executeQueryWithContext(pengajuanQuery, pengajuanParams, req.user)
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
