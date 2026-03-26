//relawanAdminController
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
    const { id } = req.params;
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
    const { id } = req.params;
    const { status, catatan_verifikator } = req.body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
        res.status(400).json({ success: false, message: "Status harus 'Disetujui' atau 'Ditolak'" });
        return;
    }

    try {
        const pengajuanQuery = `SELECT * FROM pengajuan_perubahan_data WHERE pengajuan_id = $1 AND status = 'Menunggu Review'`;
        const pengajuanRes = await executeQueryWithContext(pengajuanQuery, [id], req.user);

        if (pengajuanRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan atau sudah direview' });
            return;
        }

        const pengajuan = pengajuanRes.rows[0];

        const updatePengajuanQuery = `
            UPDATE pengajuan_perubahan_data 
            SET status = $1, catatan_verifikator = $2, tanggal_verifikasi = CURRENT_TIMESTAMP, verifikator_id = $3
            WHERE pengajuan_id = $4
        `;
        await executeQueryWithContext(updatePengajuanQuery, [status, catatan_verifikator || null, req.user.id, id], req.user);

        if (status === 'Disetujui' && pengajuan.data_baru) {
            // IMPLEMENTASI MENDATANG: Eksekusi update dinamis ke tabel Relawan/Users sesuai isi data_baru
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
    const nama_lengkap = req.body.nama || req.body.nama_lengkap;
    const nik = req.body.nik;
    const alamat_ktp = req.body.alamat_ktp;
    const kelurahan = req.body.kelurahan;
    const jabatan = req.body.jabatan;
    const penugasanText = req.body.penugasan || req.body.opd;
    const kaderText = req.body.kader || req.body.kader_kader;
    const jenis_kelamin = req.body.jenis_kelamin || 'L';

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }

    try {
        const checkNikQuery = `SELECT user_id FROM users WHERE nik = $1`;
        const checkNikRes = await executeQueryWithContext(checkNikQuery, [nik], req.user);

        if (checkNikRes.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar, data tidak dapat disimpan' });
            return;
        }

        const defaultPassword = nik;
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

// 6. Tambah Relawan Bulk (dari Excel)
export const createBulkRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const rawData = req.body;

    if (!Array.isArray(rawData) || rawData.length === 0) {
        res.status(400).json({ success: false, message: 'Data yang dikirim harus berupa array yang tidak kosong' });
        return;
    }

    // ── Helper: normalisasi satu baris dari Excel atau form ──────
    const normalizeItem = (raw: any) => {
        // Normalisasi semua key ke UPPERCASE agar case-insensitive
        const r: Record<string, any> = {};
        for (const key of Object.keys(raw)) {
            r[key.trim().toUpperCase()] = raw[key];
        }

        return {
            nik:          String(r['NIK'] || '').trim(),
            namaLengkap:  (r['NAMA LENGKAP'] || r['NAMALENGKAP'] || '').trim(),
            jenisKelamin: (r['JENIS KELAMIN'] || r['JENISKELAMIN'] || 'L').trim().toUpperCase() === 'P' ? 'P' : 'L',
            alamat:       (r['ALAMAT'] || r['ALAMAT KTP'] || '').trim() || '-',
            kelurahan:    (r['KELURAHAN'] || '').trim() || '-',
            opd:          (r['OPD'] || r['PENUGASAN'] || '').trim(),
            kader:        (r['KOMUNITAS/KADER'] || r['KADER'] || '').trim(),
            jabatan:      (r['JABATAN'] || r['PERAN'] || '').trim() || null,
            detailJabatan:(r['DETAIL JABATAN'] || r['DETAILJABATAN'] || '').trim() || null,
            penugasan:    (r['PENUGASAN'] || '').trim() || null,
            assignments:  raw.assignments || null,
        };
    };

    let insertedCount = 0;
    const skippedNIK: string[] = [];
    const errors: string[] = [];

    try {
        for (const rawItem of rawData) {
            const item = normalizeItem(rawItem);

            if (!item.nik || !item.namaLengkap) {
                errors.push(`Baris dilewati: NIK atau Nama Lengkap kosong`);
                continue;
            }

            // ── Cek NIK sudah ada ──
            const checkRes = await executeQueryWithContext(
                `SELECT user_id FROM users WHERE nik = $1`, [item.nik], req.user
            );
            if (checkRes.rows.length > 0) {
                skippedNIK.push(item.nik);
                continue;
            }

            // ── 1. Insert users ──
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(item.nik, salt);
            const userRes = await executeQueryWithContext(
                `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                 VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id`,
                [item.nik, item.namaLengkap, hashedPassword], req.user
            );
            const userId = userRes.rows[0].user_id;

            // ── 2. Insert relawan ──
            const relawanRes = await executeQueryWithContext(
                `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                 VALUES ($1, $2, $3, $4) RETURNING relawan_id`,
                [userId, item.jenisKelamin, item.alamat, item.kelurahan], req.user
            );
            const relawanId = relawanRes.rows[0].relawan_id;

            // ── 3. Siapkan daftar penugasan ──
            // Jika dari form (multi-assignment) → pakai item.assignments
            // Jika dari Excel (single row)       → buat satu assignment dari kolom OPD/Kader
            const assignmentsToProcess: any[] = item.assignments && item.assignments.length > 0
                ? item.assignments
                : [{
                    opd:              item.opd,
                    opd_id:           rawItem.opd_id || null,
                    kader:            item.kader,
                    peran:            item.jabatan,
                    detail:           item.detailJabatan,
                    penugasan:        item.penugasan,
                    statusKeaktifan:  'Aktif',
                }];

            // ── 4. Insert setiap penugasan ──
            for (const assign of assignmentsToProcess) {
                // Resolve opd_id
                let opdId: number | null = assign.opd_id || null;
                const namaOpd: string = (assign.opd || '').trim();

                if (!opdId && namaOpd && namaOpd !== '-') {
                    const opdLookup = await executeQueryWithContext(
                        `SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`,
                        [namaOpd], req.user
                    );
                    if (opdLookup.rows.length > 0) opdId = opdLookup.rows[0].opd_id;
                }

                if (!opdId) continue; // Tidak ada OPD → skip penugasan ini

                // Resolve kader_id
                let kaderId: number | null = assign.kader_id || null;
                const namaKader: string = (assign.kader || '').trim();

                if (!kaderId && namaKader && namaKader !== '-') {
                    const kaderLookup = await executeQueryWithContext(
                        `SELECT kader_id FROM kader
                         WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                        [namaKader, opdId], req.user
                    );
                    if (kaderLookup.rows.length > 0) kaderId = kaderLookup.rows[0].kader_id;
                }

                // ── INSERT penugasan_relawan ──
                // Kolom yang benar sesuai schema: jabatan, penugasan, detail_jabatan ✅
                await executeQueryWithContext(
                    `INSERT INTO penugasan_relawan
                        (relawan_id, opd_id, kader_id, jabatan, penugasan, detail_jabatan, status_keaktifan)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (relawan_id, opd_id) DO UPDATE
                         SET kader_id      = EXCLUDED.kader_id,
                             jabatan       = EXCLUDED.jabatan,
                             penugasan     = EXCLUDED.penugasan,
                             detail_jabatan = EXCLUDED.detail_jabatan,
                             status_keaktifan = EXCLUDED.status_keaktifan,
                             updated_at    = CURRENT_TIMESTAMP`,
                    [
                        relawanId,
                        opdId,
                        kaderId,
                        assign.peran   || null,
                        assign.penugasan || namaOpd || null,
                        assign.detail  || null,
                        assign.statusKeaktifan || 'Aktif',
                    ], req.user
                );
            }

            insertedCount++;
        }

        const parts: string[] = [`Berhasil menambahkan ${insertedCount} relawan baru.`];
        if (skippedNIK.length > 0) parts.push(`${skippedNIK.length} NIK dilewati (sudah terdaftar).`);
        if (errors.length > 0) parts.push(`${errors.length} baris gagal.`);

        res.status(201).json({
            success: true,
            message: parts.join(' '),
            data: { insertedCount, skippedNIK, errors }
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

// 7. Dapatkan daftar kader berdasarkan opd_id (untuk dropdown di form)
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