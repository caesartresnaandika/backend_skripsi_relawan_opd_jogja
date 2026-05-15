// opdDashboardControllers.ts

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdMiddleware';

export const getOpdDashboardStats = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        // ✅ FIXED: Tambah query untuk get nama_opd
        const opdInfoRes = await executeQueryWithContext(
            `SELECT nama_opd FROM opd WHERE opd_id = $1`,
            [opdId],
            req.user
        );

        // Eksekusi paralel untuk kecepatan maksimal
        const [
            totalRelawanRes,
            totalSKRes,
            totalKaderRes,
            chartRelawanPerKaderRes,
            chartStatusPenugasanRes
        ] = await Promise.all([
            // 1. Total Relawan Aktif di OPD ini
            executeQueryWithContext(`
                SELECT COUNT(pr.relawan_id) as total 
                FROM penugasan_relawan pr 
                JOIN relawan r ON pr.relawan_id = r.relawan_id
                JOIN users u ON r.user_id = u.user_id
                WHERE pr.opd_id = $1 AND u.status_keaktifan = true AND pr.status_keaktifan = 'Aktif'
            `, [opdId], req.user),

            // 2. Berkas SK Terunggah milik OPD
            executeQueryWithContext(`
                SELECT COUNT(*) as total FROM surat_keputusan WHERE opd_id = $1
            `, [opdId], req.user),

            // 3. Jumlah Kader Aktif milik OPD
            executeQueryWithContext(`
                SELECT COUNT(*) as total FROM kader WHERE opd_id = $1 AND status_keaktifan = true
            `, [opdId], req.user),

            // 4. Grafik: Relawan per Kader (kader) di OPD
            executeQueryWithContext(`
                SELECT k.nama_kader, COUNT(pr.relawan_id) as jumlah_relawan
                FROM kader k
                LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id AND pr.status_keaktifan = 'Aktif'
                WHERE k.opd_id = $1
                GROUP BY k.kader_id, k.nama_kader
                ORDER BY jumlah_relawan DESC
            `, [opdId], req.user),

            // 5. Grafik: Pie Chart Status Penugasan di OPD ini
            executeQueryWithContext(`
                SELECT status_keaktifan as status, COUNT(*) as jumlah
                FROM penugasan_relawan
                WHERE opd_id = $1
                GROUP BY status_keaktifan
            `, [opdId], req.user)
        ]);

        // ✅ FIXED: Sesuaikan response dengan yang frontend expect
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data statistik dashboard OPD',
            data: {
                nama_opd: opdInfoRes.rows[0]?.nama_opd || 'OPD',  // ✅ Tambah nama_opd
                ringkasan: {
                    total_relawan_aktif: parseInt(totalRelawanRes.rows[0].total, 10),
                    total_opd: 1,  // ✅ OPD user hanya punya 1 OPD (dirinya sendiri)
                    total_kader: parseInt(totalKaderRes.rows[0].total, 10),  // ✅ Fix field name
                    pengajuan_pending: 0  // ✅ Tambah field ini (bisa diimplementasi nanti)
                },
                // ✅ FIXED: Ubah nama field agar match dengan frontend
                grafik_relawan_per_opd: chartRelawanPerKaderRes.rows.map(row => ({
                    nama_opd: row.nama_kader,  // ✅ Untuk OPD, chart adalah per kader
                    jumlah_relawan: parseInt(row.jumlah_relawan, 10)
                })),
                // Keep ini untuk referensi (bisa dipakai untuk chart lain nanti)
                grafik_status_penugasan: chartStatusPenugasanRes.rows.map(row => ({
                    status: row.status,
                    jumlah: parseInt(row.jumlah, 10)
                }))
            }
        });

    } catch (error: any) {
        console.error('Error in getOpdDashboardStats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan saat menghitung statistik OPD',
            data: null  // ✅ Return null bukan undefined
        });
    }
};