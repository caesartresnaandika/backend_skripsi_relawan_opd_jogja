/*
 * ============================================================
 * RELAWAN DASHBOARD CONTROLLER
 * ============================================================
 * Menyediakan data dashboard untuk role relawan.
 *
 * Statistik:
 * - Jumlah SK aktif (penugasan yang sedang berjalan)
 * - Total kegiatan yang pernah diikuti
 * - Poin relawan (asumsi: 1 kegiatan = 10 poin)
 * - Detail penugasan aktif saat ini
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { RelawanAuthRequest } from '../middleware/relawanMiddleware';

/*
 * GET RELAWAN DASHBOARD STATS
 * Menampilkan ringkasan aktivitas relawan yang sedang login.
 * Semua query berjalan paralel via Promise.all.
 */
export const getRelawanDashboardStats = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const relawanId = req.relawan_id;

        const [
            skAktifRes,
            totalKegiatanRes,
            penugasanSaatIniRes
        ] = await Promise.all([
            // 1. Jumlah SK Aktif (Penugasan Aktif)
            executeQueryWithContext(`
                SELECT COUNT(*) as total 
                FROM penugasan_relawan
                WHERE relawan_id = $1 AND status_keaktifan = 'Aktif'
            `, [relawanId], req.user),

            // 2. Total Kegiatan (Menghitung dari tabel kegiatan yang pernah dia lakukan
            executeQueryWithContext(`
                SELECT COUNT(*) as total 
                FROM penugasan_relawan
                WHERE relawan_id = $1
            `, [relawanId], req.user),

            // 3. Info Penugasan Aktif Saat Ini (Menampilkan Detail SK & Instansi)
            executeQueryWithContext(`
                SELECT 
                    sk.nomor_sk, sk.judul_sk, sk.batas_aktif, sk.file_path,
                    o.nama_opd,
                    k.nama_kader as peran_kader
                FROM penugasan_relawan pr
                LEFT JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id   
                JOIN opd o ON pr.opd_id = o.opd_id
                LEFT JOIN kader k ON pr.kader_id = k.kader_id
                WHERE pr.relawan_id = $1 AND pr.status_keaktifan = 'Aktif'
                LIMIT 1
            `, [relawanId], req.user)
        ]);

        const totalKegiatan = parseInt(totalKegiatanRes.rows[0].total, 10);
        // Asumsi bisnis: 1 Kegiatan selesai = 10 Poin Relasi
        const poinRelawan = totalKegiatan * 10;

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data dashboard relawan',
            data: {
                statistik: {
                    sk_aktif: parseInt(skAktifRes.rows[0].total, 10),
                    total_kegiatan: totalKegiatan,
                    poin_relawan: poinRelawan
                },
                penugasan_saat_ini: penugasanSaatIniRes.rows.length > 0 ? penugasanSaatIniRes.rows[0] : null
            }
        });

    } catch (error: any) {
        console.error('Error in getRelawanDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil statistik Relawan' });
    }
};