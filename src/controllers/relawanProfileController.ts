//relawanProfileController
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { RelawanAuthRequest } from '../middleware/relawanMiddleware';

// 1. Get Detail Lengkap Biodata
export const getMyProfile = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                u.nik, u.nama_lengkap, u.email, u.no_hp,
                r.jenis_kelamin, r.tempat_lahir, r.tanggal_lahir, 
                r.alamat_ktp, r.alamat_domisili, r.kelurahan
            FROM relawan r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.relawan_id = $1
        `, [req.relawan_id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Biodata tidak ditemukan.' });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in getMyProfile:', error);
        res.status(500).json({ success: false, message: 'Server error saat menarik profil.' });
    }
};

// 2. Request Perubahan Biodata (Tidak update langsung, masuk antrean Review)
export const requestProfileUpdate = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const relawanId = req.relawan_id;
        const { data_baru, catatan } = req.body;

        if (!data_baru) {
            res.status(400).json({ success: false, message: 'Data perubahan wajib disertakan (JSON).' });
            return;
        }

        // Ambil data lama sebagai perbandingan/history
        const oldDataRes = await executeQueryWithContext(`
            SELECT r.*, u.nama_lengkap, u.no_hp
            FROM relawan r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.relawan_id = $1
        `, [relawanId], req.user);

        const dataLama = oldDataRes.rows[0];

        // Insert ke tabel pengajuan (sebelum di approve admin)
        const insertRes = await executeQueryWithContext(`
            INSERT INTO pengajuan_perubahan_data 
            (relawan_id, jenis_perubahan, data_lama, data_baru, catatan_relawan, status)
            VALUES ($1, 'Biodata Diri', $2, $3, $4, 'Menunggu Review')
            RETURNING pengajuan_id, status, tanggal_pengajuan
        `, [relawanId, JSON.stringify(dataLama), JSON.stringify(data_baru), catatan], req.user);

        res.status(201).json({
            success: true,
            message: 'Pengajuan perubahan data berhasil dikirim dan sedang menunggu review Admin.',
            data: insertRes.rows[0]
        });

    } catch (error: any) {
        console.error('Error in requestProfileUpdate:', error);
        res.status(500).json({ success: false, message: 'Server error saat mengirim pengajuan.' });
    }
};

export const getMyPenugasan = async (req: RelawanAuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                pr.penugasan_id, pr.jabatan, pr.detail_jabatan, 
                pr.status_keaktifan, pr.nomor_sk_manual,
                o.nama_opd, k.nama_kader
            FROM penugasan_relawan pr
            JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            WHERE pr.relawan_id = $1
            ORDER BY pr.created_at DESC
        `, [req.relawan_id], req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getMyPenugasan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};