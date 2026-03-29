//relawanAdminController
import pool from '../../config/db';
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
                pr.penugasan_id, pr.penugasan, pr.jabatan, pr.detail_jabatan, pr.status_keaktifan AS status_penugasan,
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
                pr.penugasan_id, pr.penugasan, pr.jabatan, pr.detail_jabatan,
                pr.status_keaktifan AS status_penugasan, pr.nomor_sk_manual,
                pr.opd_id, pr.kader_id,
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
        await executeQueryWithContext(updatePengajuanQuery, [status, catatan_verifikator || null, req.user!, id], req.user);

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

// 5. Tambah Relawan (Single Form - Multi Penugasan)
export const createRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const nama_lengkap = req.body.nama_lengkap || req.body.namaLengkap;
    const nik = req.body.nik;
    const alamat_ktp = req.body.alamat_ktp || req.body.alamat;
    const kelurahan = req.body.kelurahan;
    const jenis_kelamin = req.body.jenis_kelamin || req.body.jenisKelamin || 'L';
    
    // Tangkap array assignments dari frontend
    const assignmentsToProcess: any[] = req.body.assignments && req.body.assignments.length > 0 
        ? req.body.assignments 
        : [];

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 

        // 0. Cek Duplikasi NIK (Karena ini form Relawan Baru, NIK tidak boleh sudah ada)
        const checkNikQuery = `SELECT user_id FROM users WHERE nik = $1`;
        const checkNikRes = await client.query(checkNikQuery, [nik]);

        if (checkNikRes.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar, silakan gunakan fitur edit untuk menambah penugasan.' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nik, salt);

        // 1. INSERT users
        const userRes = await client.query(`
            INSERT INTO users (nik, nama_lengkap, password, role, is_active)
            VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id;
        `, [nik, nama_lengkap, hashedPassword]);
        const userId = userRes.rows[0].user_id;

        // 2. INSERT relawan
        const relawanRes = await client.query(`
            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
            VALUES ($1, $2, $3, $4) RETURNING relawan_id;
        `, [userId, jenis_kelamin, alamat_ktp || '-', kelurahan || '-']);
        const relawanId = relawanRes.rows[0].relawan_id;

        // 3. LOOP & INSERT Penugasan
        for (const assign of assignmentsToProcess) {
            let opdId: number | null = assign.opd_id || null;
            const namaOpd: string = (assign.opd || '').trim();

            if (!opdId && namaOpd && namaOpd !== '-') {
                const opdLookup = await client.query(
                    `SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`, [namaOpd]
                );
                if (opdLookup.rows.length > 0) opdId = opdLookup.rows[0].opd_id;
            }

            let kaderId: number | null = assign.kader_id || null;
            const namaKader: string = (assign.kader || '').trim();

            if (!kaderId && namaKader && namaKader !== '-') {
                const kaderLookup = await client.query(
                    `SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                    [namaKader, opdId]
                );
                if (kaderLookup.rows.length > 0) {
                    kaderId = kaderLookup.rows[0].kader_id;
                } else {
                    const kaderFallback = await client.query(
                        `SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) LIMIT 1`, [namaKader]
                    );
                    if (kaderFallback.rows.length > 0) kaderId = kaderFallback.rows[0].kader_id;
                }
            }

            await client.query(`
                INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, status_keaktifan)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                relawanId, opdId, kaderId, 
                assign.peran || null, assign.detail || null, 
                assign.penugasan || namaOpd || null, assign.statusKeaktifan || 'Aktif'
            ]);
        }

        await client.query('COMMIT'); 
        res.status(201).json({ success: true, message: 'Berhasil menambahkan data relawan beserta penugasannya' });

    } catch (error: any) {
        await client.query('ROLLBACK'); 
        console.error('Error in createRelawan (Single):', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menambahkan data relawan' });
    } finally {
        client.release(); 
    }
};

// 6. Tambah Relawan Bulk (dari Excel & Form Manual) - FIXED VERSION
export const createBulkRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const rawData = req.body;

    if (!Array.isArray(rawData) || rawData.length === 0) {
        res.status(400).json({ success: false, message: 'Data yang dikirim harus berupa array yang tidak kosong' });
        return;
    }

    // ── Helper: Normalisasi menangkap format Excel & format Axios Frontend ──────
    const normalizeItem = (raw: any) => {
        const cleanExcelData: Record<string, any> = {};
        for (const key of Object.keys(raw)) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, ''); 
            cleanExcelData[cleanKey] = raw[key];
        }

        const getVal = (frontendKey: string, possibleExcelKeys: string[]) => {
            if (raw[frontendKey] !== undefined) return String(raw[frontendKey]);
            for (const key of possibleExcelKeys) {
                if (cleanExcelData[key] !== undefined) return String(cleanExcelData[key]);
            }
            return '';
        };

        return {
            nik:          getVal('nik', ['nik']).trim(),
            namaLengkap:  getVal('nama_lengkap', ['namalengkap', 'nama']).trim(),
            jenisKelamin: getVal('jenis_kelamin', ['jeniskelamin', 'jk', 'kelamin']).trim().toUpperCase() === 'P' ? 'P' : 'L',
            alamat:       getVal('alamat_ktp', ['alamatktp', 'alamat', 'domisili']).trim() || '-',
            kelurahan:    getVal('kelurahan', ['kelurahan', 'desa']).trim() || '-',
            opd:          getVal('opd', ['opd', 'instansi']).trim(),
            kader:        getVal('kader', ['kader', 'komunitaskader', 'komunitas']).trim(),
            jabatan:      getVal('jabatan', ['jabatan', 'peran']).trim() || null,
            detailJabatan:getVal('detail_jabatan', ['detailjabatan', 'detail']).trim() || null,
            penugasan:    getVal('penugasan', ['penugasan', 'tugas']).trim() || null,
            assignments:  raw.assignments || null,
        };
    };

    const client = await pool.connect();
    let insertedCount = 0;
    const skippedNIK: string[] = [];
    const errors: string[] = [];

    try {
        for (let i = 0; i < rawData.length; i++) {
            const rawItem = rawData[i];
            const item = normalizeItem(rawItem);
            const rowNumber = i + 2; // Excel row number (header = row 1)

            if (!item.nik || !item.namaLengkap) {
                errors.push(`Baris ${rowNumber} dilewati: NIK atau Nama Lengkap kosong.`);
                continue;
            }

            try {
                await client.query('BEGIN');

                let userId: number;
                let relawanId: number;

                // Cek apakah NIK sudah ada
                const checkRes = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [item.nik]);
                
                if (checkRes.rows.length > 0) {
                    // NIK sudah ada - ambil ID-nya
                    userId = checkRes.rows[0].user_id;
                    const getRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);
                    
                    if (getRelawan.rows.length > 0) {
                        relawanId = getRelawan.rows[0].relawan_id;
                    } else {
                        // User ada tapi profil relawan tidak ada - create relawan profile
                        const relawanRes = await client.query(
                            `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                             VALUES ($1, $2, $3, $4) RETURNING relawan_id`,
                            [userId, item.jenisKelamin, item.alamat, item.kelurahan]
                        );
                        relawanId = relawanRes.rows[0].relawan_id;
                    }
                } else {
                    // NIK baru - Buat User dan Relawan baru
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(item.nik, salt);
                    
                    const userRes = await client.query(
                        `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                         VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id`,
                        [item.nik, item.namaLengkap, hashedPassword]
                    );
                    userId = userRes.rows[0].user_id;

                    const relawanRes = await client.query(
                        `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                         VALUES ($1, $2, $3, $4) RETURNING relawan_id`,
                        [userId, item.jenisKelamin, item.alamat, item.kelurahan]
                    );
                    relawanId = relawanRes.rows[0].relawan_id;
                }

                // Setup Penugasan
                const assignmentsToProcess: any[] = item.assignments && item.assignments.length > 0
                    ? item.assignments
                    : [{
                        opd: item.opd,
                        kader: item.kader,
                        peran: item.jabatan,
                        detail: item.detailJabatan,
                        penugasan: item.penugasan,
                        statusKeaktifan: 'Aktif',
                    }];

                for (const assign of assignmentsToProcess) {
                    let opdId: number | null = assign.opd_id || null;
                    const namaOpd: string = (assign.opd || '').trim();

                    // Cari OPD ID jika belum ada
                    if (!opdId && namaOpd && namaOpd !== '-') {
                        const opdLookup = await client.query(
                            `SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`,
                            [namaOpd]
                        );
                        if (opdLookup.rows.length > 0) opdId = opdLookup.rows[0].opd_id;
                    }

                    if (!opdId) {
                        errors.push(`Baris ${rowNumber} (NIK ${item.nik}): OPD "${namaOpd}" tidak ditemukan. Data relawan tersimpan, tapi tanpa penugasan.`);
                        continue; 
                    }

                    // Cari Kader ID
                    let kaderId: number | null = assign.kader_id || null;
                    const namaKader: string = (assign.kader || '').trim();

                    if (!kaderId && namaKader && namaKader !== '-') {
                        const kaderLookup = await client.query(
                            `SELECT kader_id FROM kader 
                            WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                            [namaKader, opdId]
                        );
                        if (kaderLookup.rows.length > 0) {
                            kaderId = kaderLookup.rows[0].kader_id;
                        } else {
                            const kaderFallback = await client.query(
                                `SELECT kader_id FROM kader 
                                WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) LIMIT 1`,
                                [namaKader]
                            );
                            if (kaderFallback.rows.length > 0) {
                                kaderId = kaderFallback.rows[0].kader_id;
                            }
                        }
                    }

                    // ✅ FIXED: Menggunakan assign.peran, assign.detail, assign.penugasan
                    const checkPenugasan = await client.query(
                        `SELECT penugasan_id FROM penugasan_relawan 
                         WHERE relawan_id = $1 
                           AND opd_id = $2 
                           AND (kader_id = $3 OR (kader_id IS NULL AND $3 IS NULL))
                           AND (jabatan = $4 OR (jabatan IS NULL AND $4 IS NULL))`,
                        [relawanId, opdId, kaderId, assign.peran || assign.jabatan || null]
                    );

                    if (checkPenugasan.rows.length > 0) {
                        // UPDATE existing penugasan
                        await client.query(
                            `UPDATE penugasan_relawan
                             SET detail_jabatan = $1,
                                 penugasan = $2,
                                 status_keaktifan = $3,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE penugasan_id = $4`,
                            [
                                assign.detail || assign.detailJabatan || null, 
                                assign.penugasan || namaOpd || null,
                                assign.statusKeaktifan || 'Aktif', 
                                checkPenugasan.rows[0].penugasan_id
                            ]
                        );
                    } else {
                        // INSERT new penugasan
                        await client.query(
                            `INSERT INTO penugasan_relawan
                                (relawan_id, opd_id, kader_id, jabatan, penugasan, detail_jabatan, status_keaktifan)
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [
                                relawanId, 
                                opdId, 
                                kaderId, 
                                assign.peran || assign.jabatan || null, 
                                assign.penugasan || namaOpd || null,
                                assign.detail || assign.detailJabatan || null,
                                assign.statusKeaktifan || 'Aktif'
                            ]
                        );
                    }
            }

                await client.query('COMMIT');
                insertedCount++;

            } catch (rowError: any) {
                await client.query('ROLLBACK');
                console.error(`Error processing row ${rowNumber}:`, rowError);
                errors.push(`Baris ${rowNumber} gagal diproses: ${rowError.message}`);
            }
        }

        const parts: string[] = [`Berhasil menambahkan ${insertedCount} relawan.`];
        if (skippedNIK.length > 0) parts.push(`${skippedNIK.length} NIK dilewati (sudah terdaftar).`);
        if (errors.length > 0) parts.push(`Ada ${errors.length} peringatan/error (cek detail).`);

        res.status(201).json({
            success: true,
            message: parts.join(' '),
            data: { insertedCount, skippedNIK, errors }
        });

    } catch (fatalError: any) {
        console.error('Fatal error in createBulkRelawan:', fatalError);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan sistem yang fatal.',
            errorDetail: fatalError.message
        });
    } finally {
        client.release();
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

// Tambahkan di bagian bawah file (setelah getkaderByOpd)
export const updateRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const relawanId = parseInt(req.params.relawan_id as string);
    const { nama_lengkap, alamat_ktp, kelurahan, jenis_kelamin, assignments } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE relawan SET alamat_ktp = $1, kelurahan = $2, jenis_kelamin = $3, updated_at = CURRENT_TIMESTAMP
             WHERE relawan_id = $4`,
            [alamat_ktp, kelurahan, jenis_kelamin, relawanId]
        );
        if (nama_lengkap) {
            await client.query(
                `UPDATE users SET nama_lengkap = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = (SELECT user_id FROM relawan WHERE relawan_id = $2)`,
                [nama_lengkap, relawanId]
            );
        }

        if (Array.isArray(assignments)) {
            for (const assign of assignments) {
                let opdId: number | null = assign.opd_id || null;
                if (!opdId && assign.opd) {
                    const opd = await client.query(
                        `SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`, [assign.opd]
                    );
                    if (opd.rows.length > 0) opdId = opd.rows[0].opd_id;
                }

                if (assign.penugasan_id) {
                    await client.query(
                        `UPDATE penugasan_relawan
                         SET opd_id = $1, kader_id = $2, jabatan = $3, detail_jabatan = $4,
                             status_keaktifan = $5, updated_at = CURRENT_TIMESTAMP
                         WHERE penugasan_id = $6`,
                        [opdId, assign.kader_id || null, assign.peran || null, assign.detail || null,
                         assign.statusKeaktifan || 'Aktif', assign.penugasan_id]
                    );
                } else {
                    await client.query(
                        `INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [relawanId, opdId, assign.kader_id || null, assign.peran || null,
                         assign.detail || null, assign.statusKeaktifan || 'Aktif']
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Data relawan berhasil diperbarui' });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in updateRelawan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    } finally {
        client.release();
    }
};

export const deletePenugasan = async (req: AuthRequest, res: Response): Promise<void> => {
    const penugasanId = parseInt(req.params.penugasan_id as string);
    try {
        const result = await executeQueryWithContext(
            `DELETE FROM penugasan_relawan WHERE penugasan_id = $1 RETURNING penugasan_id`,
            [penugasanId], req.user
        );
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Penugasan berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deletePenugasan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};