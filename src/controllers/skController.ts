/*
 * ============================================================
 * SK CONTROLLER — SURAT KEPUTUSAN
 * ============================================================
 * Controller untuk manajemen Surat Keputusan (SK).
 * SK adalah dokumen legal yang menaungi penugasan kader dan relawan.
 *
 * Fitur utama:
 * 1. CRUD SK (Create, Read, Update, Delete)
 * 2. Upload file PDF (disimpan sebagai base64 di database)
 * 3. Auto-assign SK ke kader & relawan (mode ALL atau KADER_SPESIFIK)
 * 4. Filter by OPD (untuk role OPD) atau global (untuk super_admin)
 *
 * Setiap SK terkait dengan:
 * - OPD penerbit
 * - Kader yang tercover
 * - Penugasan relawan yang terikat
 * - File PDF (dokumen SK asli)
 *
 * Mode assignment:
 * - 'ALL': SK berlaku untuk semua kader di OPD tersebut
 * - '[id1,id2,...]': SK hanya berlaku untuk kader tertentu
 * ============================================================
 */

import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../../config/db';

/*
 * ============================================
 * 1. GET ALL SK
 * ============================================
 * Mengambil daftar semua SK.
 * - Super Admin: semua SK dari semua OPD
 * - OPD: hanya SK milik OPD-nya sendiri
 *
 * Jumlah relawan dihitung dari UNION:
 * - penugasan_relawan yang menggunakan SK ini
 * - pic_kader yang menggunakan SK ini
 */
export const getAllSK = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRole = req.user?.role;
        const opdId = (req.user as any)?.opd_id;

        let query = `
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif, sk.status_keaktifan,
                o.nama_opd, o.opd_id,
                (
                    SELECT COUNT(DISTINCT relawan_id) FROM (
                        SELECT relawan_id FROM penugasan_relawan WHERE sk_id = sk.sk_id
                        UNION
                        SELECT relawan_id FROM pic_kader WHERE sk_id = sk.sk_id
                    ) AS gabungan_relawan
                ) AS jumlah_relawan,
                CASE WHEN sk.file_path IS NOT NULL THEN true ELSE false END AS has_file
            FROM surat_keputusan sk
            JOIN opd o ON sk.opd_id = o.opd_id
        `;
        const params: any[] = [];

        if (userRole === 'opd') {
            if (!opdId) {
                res.status(403).json({ success: false, message: 'Akses ditolak: OPD ID tidak ditemukan' });
                return;
            }
            query += ` WHERE sk.opd_id = $1`;
            params.push(opdId);
        }

        query += ` ORDER BY sk.created_at DESC;`;

        const result = await executeQueryWithContext(query, params, req.user);

        console.log(`[getAllSK] role=${userRole}, opd_id=${opdId}, result_count=${result.rows.length}`);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar Surat Keputusan',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getAllSK:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * ============================================
 * 2. GET SK BY ID
 * ============================================
 * Mengambil detail SK beserta daftar relawan yang terdaftar
 * di dalam SK tersebut.
 * - Query 1: Data SK
 * - Query 2: Daftar relawan yang memiliki penugasan dengan SK ini
 *
 * Role OPD: hanya bisa melihat SK milik OPD-nya sendiri.
 */
    const { id } = req.params;
    try {
        const userRole = req.user?.role;
        const opdId = (req.user as any)?.opd_id;

        const querySK = `
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif, sk.status_keaktifan, sk.file_path,
                o.nama_opd, o.opd_id
            FROM surat_keputusan sk
            JOIN opd o ON sk.opd_id = o.opd_id
            WHERE sk.sk_id = $1;
        `;
        const resultSK = await executeQueryWithContext(querySK, [id], req.user);

        if (resultSK.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Surat Keputusan tidak ditemukan' });
            return;
        }

        const sk_data = resultSK.rows[0];

        if (userRole === 'opd' && sk_data.opd_id !== opdId) {
            res.status(403).json({ success: false, message: 'Akses ditolak: Surat Keputusan ini bukan milik OPD Anda' });
            return;
        }

        const queryRelawan = `
            SELECT 
                pr.penugasan_id, pr.status_keaktifan, pr.jabatan,
                u.nik, u.nama_lengkap, u.no_hp,
                k.nama_kader AS nama_kader,
                k.kader_id
            FROM penugasan_relawan pr
            JOIN relawan r ON pr.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            WHERE pr.sk_id = $1
            ORDER BY u.nama_lengkap ASC;
        `;
        const resultRelawan = await executeQueryWithContext(queryRelawan, [id], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail SK',
            data: {
                ...sk_data,
                daftar_relawan: resultRelawan.rows
            }
        });
    } catch (error: any) {
        console.error('Error in getSKById:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * ============================================
 * 3. GET SK PDF
 * ============================================
 * Mengambil file_path (base64 string) dari SK.
 * File PDF disimpan di database sebagai string base64,
 * bukan di file system.
 */
export const getSKPdf = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const userRole = req.user?.role;
        const opdId = (req.user as any)?.opd_id;

        const query = `
            SELECT file_path, nomor_sk, opd_id
            FROM surat_keputusan 
            WHERE sk_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0 || !result.rows[0].file_path) {
            res.status(404).json({ success: false, message: 'File PDF tidak ditemukan' });
            return;
        }

        if (userRole === 'opd' && result.rows[0].opd_id !== opdId) {
            res.status(403).json({ success: false, message: 'Akses ditolak: Surat Keputusan ini bukan milik OPD Anda' });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                file_path: result.rows[0].file_path,
                nomor_sk: result.rows[0].nomor_sk
            }
        });
    } catch (error: any) {
        console.error('Error in getSKPdf:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * ============================================
 * 4. GET OPD LIST (untuk dropdown)
 * ============================================
 * Mengambil daftar OPD yang aktif untuk dropdown
 * di form upload SK pada frontend.
 */
export const getOPDList = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT opd_id, nama_opd, status_keaktifan
            FROM opd
            WHERE status_keaktifan = true
            ORDER BY nama_opd ASC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getOPDList:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * ============================================
 * 5. CREATE SK
 * ============================================
 * Membuat Surat Keputusan baru dengan:
 * - Upload file PDF (wajib, via multer)
 * - Data SK (nomor, judul, tanggal)
 * - Auto-assign ke kader & relawan
 *
 * VALIDASI:
 * 1. File wajib ada
 * 2. OPD harus ada dan aktif
 * 3. Nomor SK harus unik (tidak boleh duplikat)
 *
 * PROSES AUTO-ASSIGN:
 * Mode ALL → SK berlaku untuk SEMUA kader di OPD
 *   - Update sk_id di tabel kader
 *   - Update sk_id di penugasan_relawan
 *   - Insert penugasan baru untuk relawan yang belum punya
 *   - Update sk_id di pic_kader
 *
 * Mode KADER_SPESIFIK → SK hanya untuk kader tertentu
 *   - Sama seperti ALL tapi terbatas pada kader yang dipilih
 *
 * Semua dalam 1 transaksi untuk atomicity.
 */
export const createSK = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        nomor_sk,
        judul_sk,
        tanggal_terbit,
        batas_aktif,
        kader_ids: rawKaderIds  // 'ALL' atau '[1,2,3]'
    } = req.body;

    // ============================================
    // ✅ VALIDASI: File wajib ada (di awal fungsi!)
    // ============================================
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'File PDF SK wajib diunggah',
            error_code: 'MISSING_FILE'
        });
        return;
    }

    const opd_id = req.user?.role === 'opd'
        ? (req.user as any).opd_id
        : req.body.opd_id;

    if (!opd_id) {
        res.status(400).json({
            success: false,
            message: 'OPD ID tidak valid atau tidak disertakan.',
            error_code: 'MISSING_OPD_ID'
        });
        return;
    }

    const client = await pool.connect();

    try {
        // ============================================
        // VALIDASI 1: OPD harus ada
        // ============================================
        const checkOPD = await client.query(
            'SELECT opd_id, nama_opd FROM opd WHERE opd_id = $1 AND status_keaktifan = true',
            [opd_id]
        );

        if (checkOPD.rows.length === 0) {
            res.status(400).json({
                success: false,
                message: 'OPD tidak ditemukan atau tidak aktif',
                error_code: 'OPD_NOT_FOUND',
                hint: {
                    title: 'Solusi:',
                    steps: [
                        'Buka menu "Manajemen OPD"',
                        'Tambahkan OPD baru atau aktifkan OPD yang ada',
                        'Kembali ke halaman ini dan upload SK lagi'
                    ],
                    link: '/manajemen-opd',
                    link_text: 'Buka Manajemen OPD →'
                }
            });
            return;
        }

        // ============================================
        // VALIDASI 2: Nomor SK harus unik
        // ============================================
        const checkNomorSK = await client.query(
            'SELECT sk_id FROM surat_keputusan WHERE nomor_sk = $1',
            [nomor_sk]
        );

        if (checkNomorSK.rows.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Nomor SK sudah terdaftar di sistem',
                error_code: 'DUPLICATE_NOMOR_SK',
                hint: {
                    title: 'Solusi:',
                    steps: [
                        'Periksa kembali nomor SK',
                        'Pastikan tidak ada duplikasi',
                        'Gunakan nomor SK yang berbeda'
                    ]
                }
            });
            return;
        }

        // ============================================
        // PROSES: Simpan SK ke Database
        // ============================================
        await client.query('BEGIN');

        if (req.user && req.user.id) {
            await client.query("SELECT set_config('app.current_user_id', $1, true);", [req.user.id.toString()]);
            await client.query("SELECT set_config('app.current_user_role', $1, true);", [req.user.role]);
        }

        // ✅ FIXED: Gunakan ! operator (setelah null check di atas)
        const base64File = req.file!.buffer.toString('base64');
        const mimeType = req.file!.mimetype;
        const base64String = `data:${mimeType};base64,${base64File}`;


        // Simpan SK
        const insertSKQuery = `
                INSERT INTO surat_keputusan (
                    nomor_sk, judul_sk, tanggal_terbit, batas_aktif, 
                    opd_id, file_path, status_keaktifan
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING sk_id;
            `;
        const skValues = [
            nomor_sk,
            judul_sk || `Surat Keputusan ${nomor_sk}`,
            tanggal_terbit || null,
            batas_aktif || null,
            opd_id,
            base64String,
            'Aktif'
        ];

        const skResult = await client.query(insertSKQuery, skValues);
        const new_sk_id = skResult.rows[0].sk_id;

        // ============================================
        // PROSES: Auto-Assign SK ke Kader & Relawan
        // ============================================
        let kaderUpdated = 0;
        let penugasanUpdated = 0;
        let picUpdated = 0;

        if (rawKaderIds === 'ALL') {
            // === MODE: Semua Kader di OPD ===
            const r1 = await client.query(
                `UPDATE kader SET sk_id = $1 WHERE opd_id = $2`,
                [new_sk_id, opd_id]
            );
            kaderUpdated = r1.rowCount ?? 0;

            const r2 = await client.query(
                `UPDATE penugasan_relawan SET sk_id = $1, status_keaktifan = 'Aktif', updated_at = CURRENT_TIMESTAMP WHERE opd_id = $2 AND sk_id IS NULL`,
                [new_sk_id, opd_id]
            );
            penugasanUpdated = r2.rowCount ?? 0;

            const r2_insert = await client.query(
                `INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, status_keaktifan, sk_id)
                 SELECT DISTINCT ON (relawan_id) relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, 'Aktif', $1
                 FROM penugasan_relawan
                 WHERE opd_id = $2
                   AND sk_id IS NOT NULL
                   AND relawan_id NOT IN (
                       SELECT relawan_id FROM penugasan_relawan WHERE sk_id = $1
                   )
                 ORDER BY relawan_id, created_at DESC`,
                [new_sk_id, opd_id]
            );
            penugasanUpdated += r2_insert.rowCount ?? 0;

            const r3 = await client.query(
                `UPDATE pic_kader SET sk_id = $1 WHERE kader_id IN (SELECT kader_id FROM kader WHERE opd_id = $2) AND sk_id IS NULL`,
                [new_sk_id, opd_id]
            );
            picUpdated = r3.rowCount ?? 0;

            const r3_insert = await client.query(
                `INSERT INTO pic_kader (relawan_id, kader_id, status_keaktifan, sk_id)
                 SELECT DISTINCT ON (relawan_id, kader_id) relawan_id, kader_id, 'Aktif', $1
                 FROM pic_kader
                 WHERE kader_id IN (SELECT kader_id FROM kader WHERE opd_id = $2)
                   AND sk_id IS NOT NULL
                   AND (relawan_id, kader_id) NOT IN (
                       SELECT relawan_id, kader_id FROM pic_kader WHERE sk_id = $1
                   )
                 ORDER BY relawan_id, kader_id, created_at DESC`,
                 [new_sk_id, opd_id]
            );
            picUpdated += r3_insert.rowCount ?? 0;

        } else if (rawKaderIds) {
            // === MODE: Kader Spesifik ===
            const kaderIdsArray: number[] = typeof rawKaderIds === 'string'
                ? JSON.parse(rawKaderIds)
                : rawKaderIds;

            if (Array.isArray(kaderIdsArray) && kaderIdsArray.length > 0) {
                const r1 = await client.query(
                    `UPDATE kader SET sk_id = $1 WHERE kader_id = ANY($2::int[])`,
                    [new_sk_id, kaderIdsArray]
                );
                kaderUpdated = r1.rowCount ?? 0;

                const r2 = await client.query(
                    `UPDATE penugasan_relawan SET sk_id = $1, status_keaktifan = 'Aktif', updated_at = CURRENT_TIMESTAMP WHERE kader_id = ANY($2::int[]) AND sk_id IS NULL`,
                    [new_sk_id, kaderIdsArray]
                );
                penugasanUpdated = r2.rowCount ?? 0;

                const r2_insert = await client.query(
                    `INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, status_keaktifan, sk_id)
                     SELECT DISTINCT ON (relawan_id) relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, 'Aktif', $1
                     FROM penugasan_relawan
                     WHERE kader_id = ANY($2::int[])
                       AND sk_id IS NOT NULL
                       AND relawan_id NOT IN (
                           SELECT relawan_id FROM penugasan_relawan WHERE sk_id = $1
                       )
                     ORDER BY relawan_id, created_at DESC`,
                    [new_sk_id, kaderIdsArray]
                );
                penugasanUpdated += r2_insert.rowCount ?? 0;

                const r3 = await client.query(
                    `UPDATE pic_kader SET sk_id = $1 WHERE kader_id = ANY($2::int[]) AND sk_id IS NULL`,
                    [new_sk_id, kaderIdsArray]
                );
                picUpdated = r3.rowCount ?? 0;

                const r3_insert = await client.query(
                    `INSERT INTO pic_kader (relawan_id, kader_id, status_keaktifan, sk_id)
                     SELECT DISTINCT ON (relawan_id, kader_id) relawan_id, kader_id, 'Aktif', $1
                     FROM pic_kader
                     WHERE kader_id = ANY($2::int[])
                       AND sk_id IS NOT NULL
                       AND (relawan_id, kader_id) NOT IN (
                           SELECT relawan_id, kader_id FROM pic_kader WHERE sk_id = $1
                       )
                     ORDER BY relawan_id, kader_id, created_at DESC`,
                     [new_sk_id, kaderIdsArray]
                );
                picUpdated += r3_insert.rowCount ?? 0;
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Berhasil membuat Surat Keputusan',
            data: {
                sk_id: new_sk_id,
                nomor_sk,
                file_size: `${(req.file!.size / 1024).toFixed(2)} KB`,
                total_kader_terkait: kaderUpdated,
                total_relawan_terkait: penugasanUpdated,
                total_pic_terkait: picUpdated,
                mode: rawKaderIds === 'ALL' ? 'SEMUA_KADER' : 'KADER_SPESIFIK'
            }
        });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('FULL ERROR in createSK:', error);

        let errorMessage = 'Gagal menyimpan data SK.';
        let errorCode = 'UNKNOWN_ERROR';

        if (error.code === '23505') {
            errorMessage = 'Nomor SK sudah terdaftar. Gunakan nomor yang berbeda.';
            errorCode = 'DUPLICATE_NOMOR_SK';
        } else if (error.code === '23503') {
            errorMessage = 'Data referensi tidak ditemukan (OPD/Kader/Relawan).';
            errorCode = 'FOREIGN_KEY_VIOLATION';
        } else if (error.code) {
            errorMessage += ` (PG Error: ${error.code})`;
            errorCode = error.code;
        }

        res.status(400).json({
            success: false,
            message: errorMessage,
            error_code: errorCode,
            dev_log: error.message
        });
    } finally {
        client.release();
    }
};

/*
 * ============================================
 * 6. UPDATE STATUS SK
 * ============================================
 * Mengubah status SK menjadi 'Aktif' atau 'Tidak Aktif'.
 * Role OPD: hanya bisa update SK milik OPD-nya sendiri.
 *
 * Input bisa:
 * - status: 'Aktif' | 'Tidak Aktif' | 'Nonaktif'
 * - status_keaktifan: boolean
 */
export const updateSKStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, status_keaktifan } = req.body;

    let normalizedStatus: 'Aktif' | 'Tidak Aktif' | null = null;
    if (typeof status === 'string') {
        const trimmedStatus = status.trim().toLowerCase();
        if (trimmedStatus === 'aktif') {
            normalizedStatus = 'Aktif';
        } else if (trimmedStatus === 'nonaktif' || trimmedStatus === 'tidak aktif') {
            normalizedStatus = 'Tidak Aktif';
        }
    } else if (typeof status_keaktifan === 'boolean') {
        normalizedStatus = status_keaktifan ? 'Aktif' : 'Tidak Aktif';
    }

    if (!normalizedStatus) {
        res.status(400).json({
            success: false,
            message: 'Status wajib diisi',
            hint: "Gunakan status: 'Aktif' atau 'Tidak Aktif'"
        });
        return;
    }

    try {
        const userRole = req.user?.role;
        const opdId = (req.user as any)?.opd_id;

        if (userRole === 'opd') {
            const checkQuery = `SELECT opd_id FROM surat_keputusan WHERE sk_id = $1`;
            const checkResult = await executeQueryWithContext(checkQuery, [id], req.user);
            
            if (checkResult.rows.length === 0) {
                res.status(404).json({ success: false, message: 'Data SK tidak ditemukan' });
                return;
            }

            if (checkResult.rows[0].opd_id !== opdId) {
                res.status(403).json({ success: false, message: 'Akses ditolak: Surat Keputusan ini bukan milik OPD Anda' });
                return;
            }
        }
        const query = `
            UPDATE surat_keputusan
            SET status_keaktifan = $1, updated_at = CURRENT_TIMESTAMP
            WHERE sk_id = $2
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [normalizedStatus, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data SK tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Status SK berhasil diperbarui menjadi ${normalizedStatus}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateSKStatus:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * ============================================
 * 7. DELETE SK
 * ============================================
 * Menghapus SK. Sebelum dihapus, dicek apakah masih ada
 * relawan yang ditugaskan dengan SK ini.
 * Jika masih ada → tolak penghapusan.
 *
 * Role OPD: hanya bisa hapus SK milik OPD-nya sendiri.
 */
    const { id } = req.params;

    try {
        const userRole = req.user?.role;
        const opdId = (req.user as any)?.opd_id;

        if (userRole === 'opd') {
            const checkQuery = `SELECT opd_id FROM surat_keputusan WHERE sk_id = $1`;
            const checkResult = await executeQueryWithContext(checkQuery, [id], req.user);
            
            if (checkResult.rows.length === 0) {
                res.status(404).json({ success: false, message: 'Data SK tidak ditemukan' });
                return;
            }

            if (checkResult.rows[0].opd_id !== opdId) {
                res.status(403).json({ success: false, message: 'Akses ditolak: Surat Keputusan ini bukan milik OPD Anda' });
                return;
            }
        }
        // Cek apakah SK masih punya relawan yang ditugaskan
        const checkPenugasan = await executeQueryWithContext(
            'SELECT COUNT(*) as count FROM penugasan_relawan WHERE sk_id = $1',
            [id],
            req.user
        );

        if (parseInt(checkPenugasan.rows[0].count) > 0) {
            res.status(400).json({
                success: false,
                message: 'Tidak dapat menghapus SK karena masih ada relawan yang ditugaskan',
                hint: {
                    title: 'Solusi:',
                    steps: [
                        'Buka detail SK ini',
                        'Hapus semua penugasan relawan terlebih dahulu',
                        'Kemudian hapus SK'
                    ]
                }
            });
            return;
        }

        const query = `
            DELETE FROM surat_keputusan
            WHERE sk_id = $1
            RETURNING sk_id;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data SK tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil menghapus Surat Keputusan',
            data: { sk_id: id }
        });
    } catch (error: any) {
        console.error('Error in deleteSK:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * ============================================
 * 8. GET KADER LIST FOR SK DROPDOWN
 * ============================================
 * Mengambil daftar kader aktif berdasarkan OPD.
 * Untuk dropdown "Target Kader" di form upload SK.
 *
 * Role OPD: otomatis menggunakan opd_id dari token
 * Super Admin: menggunakan query parameter ?opd_id=
 */
    try {
        const userRole = req.user?.role;
        const userOpdId = (req.user as any)?.opd_id;

        // Untuk OPD user, paksa pakai opd_id dari token (keamanan)
        // Untuk super_admin, ambil dari query parameter
        let opdId: string | number | undefined;
        if (userRole === 'opd') {
            if (!userOpdId) {
                res.status(403).json({ success: false, message: 'Akses ditolak: OPD ID tidak ditemukan' });
                return;
            }
            opdId = userOpdId;
        } else {
            opdId = req.query.opd_id as string;
        }

        if (!opdId) {
            res.status(400).json({ success: false, message: 'OPD ID wajib disertakan' });
            return;
        }

        const result = await executeQueryWithContext(
            `SELECT kader_id, nama_kader, opd_id, status_keaktifan
             FROM kader
             WHERE opd_id = $1 AND status_keaktifan IS NOT FALSE
             ORDER BY nama_kader ASC`,
            [opdId],
            req.user
        );

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKaderListForSK:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};