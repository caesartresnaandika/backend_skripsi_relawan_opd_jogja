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
                r.relawan_id, r.jenis_kelamin,
                r.alamat_ktp, r.kelurahan,
                pr.penugasan, pr.status_keaktifan AS status_penugasan,
                o.nama_opd, k.nama_kader
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
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
                r.relawan_id, r.jenis_kelamin, r.alamat_ktp, r.kelurahan,
                pr.penugasan_id, pr.penugasan, pr.jabatan, pr.status_keaktifan AS status_penugasan, pr.nomor_sk_manual,
                o.nama_opd, k.nama_kader
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
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

// 5. Tambah Relawan (Single Form)
export const createRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    // Form input: Nama, NIK, Alamat KTP, Kelurahan, Jabatan, Penugasan (OPD), Kader/kader
    const nama_lengkap = req.body.nama || req.body.nama_lengkap;
    const nik = req.body.nik;
    const alamat_ktp = req.body.alamat_ktp;
    const kelurahan = req.body.kelurahan;
    const jabatan = req.body.jabatan;
    const penugasanText = req.body.penugasan || req.body.opd;
    const kaderText = req.body.kader || req.body.kader || req.body.kader_kader;
    const jenis_kelamin = req.body.jenis_kelamin || 'L'; // Default Laki-laki

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }

    try {
        // Handler error pengecekan jika ada NIK yang sama, tidak akan bisa disimpan
        const checkNikQuery = `SELECT user_id FROM users WHERE nik = $1`;
        const checkNikRes = await executeQueryWithContext(checkNikQuery, [nik], req.user);
        
        if (checkNikRes.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar, data tidak dapat disimpan' });
            return;
        }

        const defaultPassword = process.env.DEFAULT_RELAWAN_PASSWORD || 'rahasia123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        // 1. INSERT users
        const insertUserQuery = `
            INSERT INTO users (nik, nama_lengkap, password, role, is_active)
            VALUES ($1, $2, $3, 'relawan', true)
            RETURNING user_id;
        `;
        const userRes = await executeQueryWithContext(insertUserQuery, [nik, nama_lengkap, hashedPassword], req.user);
        const userId = userRes.rows[0].user_id;

        // 2. INSERT relawan
        const insertRelawanQuery = `
            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
            VALUES ($1, $2, $3, $4)
            RETURNING relawan_id;
        `;
        const relawanRes = await executeQueryWithContext(insertRelawanQuery, [
            userId, 
            jenis_kelamin, 
            alamat_ktp || '-', 
            kelurahan || '-'
        ], req.user);
        const relawanId = relawanRes.rows[0].relawan_id;

        // 3. SELECT opd_id berdasarkan text dari autocomplete
        let opdId: number | null = null;
        if (penugasanText) {
            const opdLookup = await executeQueryWithContext(
                `SELECT opd_id FROM opd WHERE LOWER(nama_opd) = LOWER($1) LIMIT 1`,
                [penugasanText], req.user
            );
            if (opdLookup.rows.length > 0) {
                opdId = opdLookup.rows[0].opd_id;
            }
        }

        // 4. SELECT kader_id berdasarkan text dari autocomplete
        let kaderId: number | null = null;
        if (kaderText) {
            const paramKader = opdId ? [kaderText, opdId] : [kaderText];
            const kaderQuery = opdId 
                ? `SELECT kader_id FROM kader WHERE LOWER(nama_kader) = LOWER($1) AND opd_id = $2 LIMIT 1`
                : `SELECT kader_id FROM kader WHERE LOWER(nama_kader) = LOWER($1) LIMIT 1`;

            const kaderLookup = await executeQueryWithContext(kaderQuery, paramKader, req.user);
            if (kaderLookup.rows.length > 0) {
                kaderId = kaderLookup.rows[0].kader_id;
            }
        }

        // 5. INSERT penugasan_relawan
        // Pastikan menyimpan text penugasan juga walaupun opdId ditemukan (sesuai skema lama/fallback)
        const insertPenugasanQuery = `
            INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, penugasan, status_keaktifan)
            VALUES ($1, $2, $3, $4, $5, 'Aktif')
        `;
        await executeQueryWithContext(insertPenugasanQuery, [
            relawanId,
            opdId,
            kaderId,
            jabatan || null,
            penugasanText || null
        ], req.user);

        res.status(201).json({
            success: true,
            message: 'Berhasil menambahkan data relawan'
        });

    } catch (error: any) {
        console.error('Error in createRelawan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menambahkan data relawan' });
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

            // 2. Insert ke tabel relawan (tanpa kolom penugasan - sudah dipindah ke penugasan_relawan)
            const jenisKelamin = item['jenis kelamin'] || item.jenis_kelamin || item.jenisKelamin || 'L';
            const alamat = item.alamat_ktp || item.alamat || '-';
            const kelurahan = item.kelurahan || '-';
            const jabatan = item.jabatan || null;

            const insertRelawanQuery = `
                INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                VALUES ($1, $2, $3, $4)
                RETURNING relawan_id;
            `;
            const relawanRes = await executeQueryWithContext(insertRelawanQuery, [
                userId, 
                jenisKelamin,
                alamat,
                kelurahan
            ], req.user);
            const relawanId = relawanRes.rows[0].relawan_id;

            // 3. Lookup opd_id dari nama OPD yang diketik (jika ada)
            // item.penugasan = nama OPD (dari autocomplete), item.opd_id = ID langsung (dari Excel)
            let opdId: number | null = item.opd_id || null;
            const namaOpd = item.penugasan || item.penugasaan || null; // penugasaan = typo dari Excel lama

            if (!opdId && namaOpd && namaOpd !== '-') {
                const opdLookup = await executeQueryWithContext(
                    `SELECT opd_id FROM opd WHERE LOWER(nama_opd) = LOWER($1) LIMIT 1`,
                    [namaOpd], req.user
                );
                if (opdLookup.rows.length > 0) {
                    opdId = opdLookup.rows[0].opd_id;
                }
            }

            // 4. Lookup kader_id dari nama kader yang diketik (jika ada)
            let kaderId: number | null = item.kader_id || null;
            const namaKader = item.kader || null;

            if (!kaderId && namaKader && namaKader !== '-') {
                const kaderLookup = await executeQueryWithContext(
                    `SELECT kader_id FROM kader WHERE LOWER(nama_kader) = LOWER($1)${opdId ? ' AND opd_id = $2' : ''} LIMIT 1`,
                    opdId ? [namaKader, opdId] : [namaKader], req.user
                );
                if (kaderLookup.rows.length > 0) {
                    kaderId = kaderLookup.rows[0].kader_id;
                }
            }

            // 5. Insert ke penugasan_relawan jika ada opd_id yang valid
            if (opdId) {
                const insertPenugasanQuery = `
                    INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, penugasan, status_keaktifan)
                    VALUES ($1, $2, $3, $4, $5, 'Aktif')
                    ON CONFLICT (relawan_id, opd_id) DO UPDATE
                        SET kader_id = EXCLUDED.kader_id,
                            jabatan = EXCLUDED.jabatan,
                            penugasan = EXCLUDED.penugasan,
                            updated_at = CURRENT_TIMESTAMP;
                `;
                await executeQueryWithContext(insertPenugasanQuery, [
                    relawanId,
                    opdId,
                    kaderId,
                    jabatan,
                    namaOpd         // simpan teks penugasan juga sebagai fallback
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

// Endpoint helper: dapatkan daftar kader berdasarkan opd_id (untuk dropdown di form)
export const getkaderByOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        let query: string;
        let params: any[];

        if (opd_id) {
            query = `SELECT kader_id, nama_kader, opd_id FROM kader WHERE opd_id = $1 ORDER BY nama_kader`;
            params = [opd_id];
        } else {
            query = `SELECT kader_id, nama_kader, opd_id FROM kader ORDER BY nama_kader`;
            params = [];
        }

        const result = await executeQueryWithContext(query, params, req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getkaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

