/*
 * ============================================================
 * DASHBOARD CONTROLLER — STATISTIK DASHBOARD
 * ============================================================
 * Menyediakan data statistik untuk halaman dashboard.
 * Ada dua fungsi:
 * 1. getDashboardStats → untuk Super Admin (global)
 * 2. getOpdDashboardStats → untuk Admin OPD (scope OPD-nya)
 *
 * Semua query dijalankan PARALEL menggunakan Promise.all
 * agar response API secepat mungkin.
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { OpdAuthRequest } from '../middleware/opdMiddleware';

/*
 * GET DASHBOARD STATS (Super Admin)
 * Menghitung statistik global:
 * - Total relawan aktif
 * - Total OPD
 * - Total kader
 * - Pengajuan pending review
 * - Grafik relawan per OPD
 * - Demografi gender
 *
 * Semua query berjalan paralel via Promise.all.
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Kita jalankan semua query hitung-hitungan ini secara paralel agar response API sangat cepat
        const [
            totalRelawanRes,
            totalOpdRes,
            totalKaderRes,
            pengajuanPendingRes,
            relawanPerOpdRes,
            demografiGenderRes,
            topRelawanRes
        ] = await Promise.all([
            // 1. Total Relawan Aktif
            executeQueryWithContext(`
                SELECT COUNT(*) as total 
                FROM relawan r 
                JOIN users u ON r.user_id = u.user_id 
                WHERE u.status_keaktifan = true AND u.role = 'relawan'
            `, [], req.user),

            // 2. Total OPD
            executeQueryWithContext(`
                SELECT COUNT(*) as total FROM opd WHERE status_keaktifan = true
            `, [], req.user),

            // 3. Total Kader/kader
            executeQueryWithContext(`
                SELECT COUNT(*) as total FROM kader
            `, [], req.user),

            // 4. Pengajuan Menunggu Review
            executeQueryWithContext(`
                SELECT COUNT(*) as total 
                FROM pengajuan_perubahan_data 
                WHERE status_pengajuan = 'Menunggu Review'
            `, [], req.user),

            // 5. Grafik: Relawan per OPD
            executeQueryWithContext(`
                SELECT o.nama_opd, COUNT(pr.relawan_id) as jumlah_relawan
                FROM opd o
                LEFT JOIN penugasan_relawan pr ON o.opd_id = pr.opd_id AND pr.status_keaktifan = 'Aktif'
                GROUP BY o.opd_id, o.nama_opd
                ORDER BY jumlah_relawan DESC
            `, [], req.user),

            // 6. Demografi: Gender
            executeQueryWithContext(`
                SELECT jenis_kelamin, COUNT(*) as jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id 
                WHERE u.status_keaktifan = true
                GROUP BY jenis_kelamin
            `, [], req.user),

            // 7. Top 5 Relawan (Leaderboard)
            executeQueryWithContext(`
                SELECT 
                    r.relawan_id,
                    u.nama_lengkap,
                    o.nama_opd,
                    COUNT(pr.penugasan_id) as total_penugasan
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id
                JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
                LEFT JOIN opd o ON pr.opd_id = o.opd_id
                WHERE u.status_keaktifan = true
                GROUP BY r.relawan_id, u.nama_lengkap, o.nama_opd
                ORDER BY total_penugasan DESC
                LIMIT 5
            `, [], req.user)
        ]);

        // Rekap semua hasil menjadi 1 JSON Object yang rapi untuk Frontend
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data statistik dashboard',
            data: {
                ringkasan: {
                    total_relawan_aktif: parseInt(totalRelawanRes.rows[0].total, 10),
                    total_opd: parseInt(totalOpdRes.rows[0].total, 10),
                    total_kader: parseInt(totalKaderRes.rows[0].total, 10),
                    pengajuan_pending: parseInt(pengajuanPendingRes.rows[0].total, 10)
                },
                top_relawan: topRelawanRes.rows.map(row => ({
                    relawan_id: row.relawan_id,
                    nama_lengkap: row.nama_lengkap,
                    nama_opd: row.nama_opd || 'Bappeda',
                    total_penugasan: parseInt(row.total_penugasan, 10)
                })),
                grafik_relawan_per_opd: relawanPerOpdRes.rows.map(row => ({
                    nama_opd: row.nama_opd,
                    jumlah_relawan: parseInt(row.jumlah_relawan, 10)
                })),
                demografi_gender: demografiGenderRes.rows.map(row => ({
                    jenis_kelamin: row.jenis_kelamin,
                    jumlah: parseInt(row.jumlah, 10)
                })),
                demografi_umur: []
            }
        });

    } catch (error: any) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghitung statistik server' });
    }
};

/*
 * GET OPD DASHBOARD STATS
 * Statistik untuk dashboard Admin OPD (scope terbatas ke OPD-nya):
 * - Total relawan aktif di OPD ini
 * - Total kader di OPD ini
 * - Grafik relawan per kader
 * - Nama OPD
 */
export const getOpdDashboardStats = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const [totalRelawanRes, totalKaderRes, relawanPerKaderRes, opdInfoRes] = await Promise.all([
            executeQueryWithContext(`
                SELECT COUNT(DISTINCT pr.relawan_id) as total 
                FROM penugasan_relawan pr 
                JOIN users u ON pr.relawan_id = (SELECT relawan_id FROM relawan WHERE user_id = u.user_id LIMIT 1)
                WHERE pr.opd_id = $1 AND pr.status_keaktifan = 'Aktif' AND u.status_keaktifan = true
            `, [opdId], req.user),
            executeQueryWithContext(`SELECT COUNT(*) as total FROM kader WHERE opd_id = $1 AND status_keaktifan = true`, [opdId], req.user),
            executeQueryWithContext(`
                SELECT k.nama_kader, COUNT(pr.relawan_id) as jumlah_relawan
                FROM kader k
                LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id AND pr.status_keaktifan = 'Aktif'
                WHERE k.opd_id = $1
                GROUP BY k.kader_id, k.nama_kader
                ORDER BY jumlah_relawan DESC
            `, [opdId], req.user),
            executeQueryWithContext(`SELECT nama_opd FROM opd WHERE opd_id = $1`, [opdId], req.user)
        ]);

        res.status(200).json({
            success: true,
            data: {
                nama_opd: opdInfoRes.rows[0]?.nama_opd || 'Instansi',
                ringkasan: {
                    total_relawan_aktif: parseInt(totalRelawanRes.rows[0].total, 10),
                    total_kader: parseInt(totalKaderRes.rows[0].total, 10),
                    pengajuan_pending: 0, // OPD belum ada fitur review pengajuan
                    total_opd: 1 
                },
                grafik_relawan_per_opd: relawanPerKaderRes.rows.map(row => ({
                    nama_opd: row.nama_kader, // Kita pinjam properti ini agar chart frontend tetap jalan
                    jumlah_relawan: parseInt(row.jumlah_relawan, 10)
                }))
            }
        });
    } catch (error: any) {
        console.error('Error in getOpdDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat statistik OPD' });
    }
};