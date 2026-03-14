import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

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

export const createBulkRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ success: false, message: 'Data yang dikirim harus berupa array yang tidak kosong' });
        return;
    }

    try {
        let insertedCount = 0;
        const skippedNIK: string[] = [];
        
        for (const item of data) {
            const defaultPassword = process.env.DEFAULT_RELAWAN_PASSWORD || 'rahasia123';
            
            const checkQuery = `SELECT user_id FROM users WHERE nik = $1`;
            const checkRes = await executeQueryWithContext(checkQuery, [item.nik], req.user);
            
            if (checkRes.rows.length > 0) {
                skippedNIK.push(item.nik);
                continue; // Skip jika NIK sudah ada
            }

            // 1. Insert ke tabel users
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);
             
            const insertUserQuery = `
                INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                VALUES ($1, $2, $3, 'relawan', true)
                RETURNING user_id;
            `;
            const userRes = await executeQueryWithContext(insertUserQuery, [
                item.nik, 
                item.namaLengkap || item.nama_lengkap, 
                hashedPassword
            ], req.user);
            const userId = userRes.rows[0].user_id;

            // 2. Insert ke tabel relawan
            // Mapping fleksibel: terima dari Excel ('jenis kelamin', 'penugasaan') atau form manual ('jenis_kelamin', 'alamat_ktp', 'penugasan')
            const jenisKelamin = item['jenis kelamin'] || item.jenis_kelamin || item.jenisKelamin || 'L';
            const alamat = item.alamat_ktp || item.alamat || '-';
            const kelurahan = item.kelurahan || '-';
            const penugasan = item.penugasaan || item.penugasan || '-'; // penugasaan = dari Excel (typo di template lama), penugasan = dari form manual
            const kader = item.kader || '-';
            const jabatan = item.jabatan || '-';

            const insertRelawanQuery = `
                INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan, penugasan)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING relawan_id;
            `;
            const relawanRes = await executeQueryWithContext(insertRelawanQuery, [
                userId, 
                jenisKelamin,
                alamat,
                kelurahan,
                penugasan
            ], req.user);
            const relawanId = relawanRes.rows[0].relawan_id;

            // 3. Jika opd_id disertakan, buat record penugasan_relawan
            if (item.opd_id) {
                const insertPenugasanQuery = `
                    INSERT INTO penugasan_relawan (relawan_id, opd_id, komunitas_id, status_keaktifan)
                    VALUES ($1, $2, $3, 'Aktif')
                    ON CONFLICT (relawan_id, opd_id) DO NOTHING;
                `;
                await executeQueryWithContext(insertPenugasanQuery, [
                    relawanId,
                    item.opd_id,
                    item.komunitas_id || null
                ], req.user);
            }
            
            insertedCount++;
        }

        res.status(201).json({
            success: true,
            message: `Berhasil menambahkan ${insertedCount} relawan baru${skippedNIK.length > 0 ? `. ${skippedNIK.length} NIK dilewati karena sudah terdaftar.` : ''}`,
            data: { insertedCount, skippedNIK }
        });
    } catch (error: any) {
        console.error('Error in createBulkRelawan:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan pada server saat menyimpan data relawan', 
            errorDetail: error.message 
        });
    }
};

// Endpoint helper: dapatkan daftar komunitas berdasarkan opd_id (untuk dropdown di form)
export const getKomunitasByOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        let query: string;
        let params: any[];

        if (opd_id) {
            query = `SELECT komunitas_id, nama_komunitas, opd_id FROM komunitas WHERE opd_id = $1 ORDER BY nama_komunitas`;
            params = [opd_id];
        } else {
            query = `SELECT komunitas_id, nama_komunitas, opd_id FROM komunitas ORDER BY nama_komunitas`;
            params = [];
        }

        const result = await executeQueryWithContext(query, params, req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKomunitasByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

