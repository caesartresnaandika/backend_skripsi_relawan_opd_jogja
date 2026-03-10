import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Dapatkan semua relawan dengan detail informasi User, Relawan, dan OPD Penugasan
export const getAllRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.email, u.no_hp, u.is_active,
                r.relawan_id, r.jenis_kelamin, r.tempat_lahir, r.tanggal_lahir,
                pr.status_keaktifan AS status_penugasan,
                o.nama_opd, k.nama_komunitas
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN komunitas k ON pr.komunitas_id = k.komunitas_id
            WHERE u.role = 'relawan'
            ORDER BY u.created_at DESC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar relawan',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getAllRelawan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// 2. Dapatkan detail seorang relawan
export const getRelawanById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params; // id di sini adalah user_id dari relawan
    try {
        const query = `
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.email, u.no_hp, u.foto_profil, u.is_active,
                r.relawan_id, r.jenis_kelamin, r.tempat_lahir, r.tanggal_lahir, r.alamat_ktp, r.alamat_domisili, r.kelurahan,
                pr.penugasan_id, pr.jabatan, pr.status_keaktifan AS status_penugasan, pr.nomor_sk_manual,
                o.nama_opd, k.nama_komunitas
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN komunitas k ON pr.komunitas_id = k.komunitas_id
            WHERE u.user_id = $1 AND u.role = 'relawan';
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data relawan tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail relawan',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getRelawanById:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// 3. Dapatkan daftar antrian pengajuan perubahan data
export const getPengajuanPerubahanDaftar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT 
                pp.pengajuan_id, pp.jenis_perubahan, pp.status, pp.tanggal_pengajuan, pp.catatan_relawan,
                u.nama_lengkap, u.nik, r.relawan_id
            FROM pengajuan_perubahan_data pp
            JOIN relawan r ON pp.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            ORDER BY pp.tanggal_pengajuan DESC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil antrian pengajuan perubahan data',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getPengajuanPerubahanDaftar:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// 4. Review Pengajuan (Approve / Reject)
export const reviewPengajuan = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params; // pengajuan_id
    const { status, catatan_verifikator } = req.body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
        res.status(400).json({ success: false, message: "Status harus 'Disetujui' atau 'Ditolak'" });
        return;
    }

    try {
        // Ambil data pengajuan
        const pengajuanQuery = `SELECT * FROM pengajuan_perubahan_data WHERE pengajuan_id = $1 AND status = 'Menunggu Review'`;
        const pengajuanRes = await executeQueryWithContext(pengajuanQuery, [id], req.user);

        if (pengajuanRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan atau sudah direview' });
            return;
        }

        const pengajuan = pengajuanRes.rows[0];

        // Mulai transaksi untuk Update status dan Terapkan Perubahan (Jika disetujui)
        const updatePengajuanQuery = `
            UPDATE pengajuan_perubahan_data 
            SET status = $1, catatan_verifikator = $2, tanggal_verifikasi = CURRENT_TIMESTAMP, verifikator_id = $3
            WHERE pengajuan_id = $4
        `;
        await executeQueryWithContext(updatePengajuanQuery, [status, catatan_verifikator || null, req.user.id, id], req.user);

        // Jika Disetujui, terapkan perubahan JSON ke target tabel (sementara khusus tabel relawan/users, tergantung logika yang dibangun di Frontend)
        if (status === 'Disetujui' && pengajuan.data_baru) {
             // IMPLEMENTASI MENDATANG: Eksekusi update dinamis ke tabel Relawan/Users sesuai isi data_baru
             // (Kebutuhan update JSON ini bisa sangat kompleks, sehingga biasanya di handle spesifik per kolom)
             // ... 
        }

        res.status(200).json({
            success: true,
            message: `Pengajuan berhasil di-${status}`
        });

    } catch (error: any) {
        console.error('Error in reviewPengajuan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};
