import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

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
            demografiUmurRes
        ] = await Promise.all([
            // 1. Total Relawan Aktif
            executeQueryWithContext(`
                SELECT COUNT(*) as total 
                FROM relawan r 
                JOIN users u ON r.user_id = u.user_id 
                WHERE u.is_active = true AND u.role = 'relawan'
            `, [], req.user),

            // 2. Total OPD
            executeQueryWithContext(`
                SELECT COUNT(*) as total FROM opd WHERE is_active = true
            `, [], req.user),

            // 3. Total Kader/Komunitas
            executeQueryWithContext(`
                SELECT COUNT(*) as total FROM komunitas
            `, [], req.user),

            // 4. Pengajuan Menunggu Review
            executeQueryWithContext(`
                SELECT COUNT(*) as total 
                FROM pengajuan_perubahan_data 
                WHERE status = 'Menunggu Review'
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
                WHERE u.is_active = true
                GROUP BY jenis_kelamin
            `, [], req.user),

            // 7. Demografi: Range Umur
            executeQueryWithContext(`
                SELECT 
                    CASE 
                        WHEN EXTRACT(YEAR FROM age(tanggal_lahir)) < 20 THEN '< 20 Tahun'
                        WHEN EXTRACT(YEAR FROM age(tanggal_lahir)) BETWEEN 20 AND 29 THEN '20 - 29 Tahun'
                        WHEN EXTRACT(YEAR FROM age(tanggal_lahir)) BETWEEN 30 AND 39 THEN '30 - 39 Tahun'
                        WHEN EXTRACT(YEAR FROM age(tanggal_lahir)) BETWEEN 40 AND 49 THEN '40 - 49 Tahun'
                        ELSE '50+ Tahun'
                    END AS range_umur,
                    COUNT(*) AS jumlah
                FROM relawan r
                JOIN users u ON r.user_id = u.user_id 
                WHERE u.is_active = true AND tanggal_lahir IS NOT NULL
                GROUP BY range_umur
                ORDER BY range_umur ASC
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
                grafik_relawan_per_opd: relawanPerOpdRes.rows.map(row => ({
                    nama_opd: row.nama_opd,
                    jumlah_relawan: parseInt(row.jumlah_relawan, 10)
                })),
                demografi_gender: demografiGenderRes.rows.map(row => ({
                    jenis_kelamin: row.jenis_kelamin,
                    jumlah: parseInt(row.jumlah, 10)
                })),
                demografi_umur: demografiUmurRes.rows.map(row => ({
                    range_umur: row.range_umur,
                    jumlah: parseInt(row.jumlah, 10)
                }))
            }
        });

    } catch (error: any) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghitung statistik server' });
    }
};
