//skController.ts
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../../config/db';

// 1. Dapatkan daftar semua SK
export const getAllSK = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif, sk.status,
                o.nama_opd, o.opd_id,
                (SELECT COUNT(*) FROM penugasan_relawan pr WHERE pr.sk_id = sk.sk_id) AS jumlah_relawan,
                CASE WHEN sk.file_path IS NOT NULL THEN true ELSE false END AS has_file
            FROM surat_keputusan sk
            JOIN opd o ON sk.opd_id = o.opd_id
            ORDER BY sk.created_at DESC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);

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

// 2. Dapatkan detail SK beserta daftar relawannya
export const getSKById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const querySK = `
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif, sk.status, sk.file_path,
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

// 3. Endpoint untuk mendapatkan PDF file (sebagai base64)
export const getSKPdf = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `
            SELECT file_path, nomor_sk 
            FROM surat_keputusan 
            WHERE sk_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);

        if (result.rows.length === 0 || !result.rows[0].file_path) {
            res.status(404).json({ success: false, message: 'File PDF tidak ditemukan' });
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

// 4. Endpoint untuk mendapatkan list OPD (untuk dropdown di upload modal)
export const getOPDList = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT opd_id, nama_opd, is_active
            FROM opd
            WHERE is_active = true
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

// 5. Buat SK dengan Upload PDF (Base64) + Validasi Lengkap
export const createSK = async (req: AuthRequest, res: Response): Promise<void> => {
    // Tangkap data dari body
    const { 
        nomor_sk, 
        judul_sk, 
        tanggal_terbit, 
        batas_aktif, 
        daftar_relawan 
    } = req.body;

    // ✨ FIXED: Logika Penentuan OPD (Role-Aware)
    // Jika Super Admin, ambil dari req.body. Jika OPD Admin, PAKSA ambil dari req.user.opd_id (Token)
    const opd_id = req.user?.role === 'opd' ? (req as any).opd_id : req.body.opd_id;

    if (!opd_id) {
        res.status(400).json({ success: false, message: 'OPD ID tidak valid atau tidak disertakan.' });
        return;
    }

    const client = await pool.connect();

    try {
        // ============================================
        // VALIDASI 1: OPD harus ada
        // ============================================
        const checkOPD = await client.query(
            'SELECT opd_id, nama_opd FROM opd WHERE opd_id = $1 AND is_active = true', 
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
        // VALIDASI 3: File PDF wajib ada
        // ============================================
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'File PDF SK wajib diunggah',
                error_code: 'MISSING_FILE'
            });
            return;
        }

        // ============================================
        // VALIDASI 4: Relawan harus terdaftar (jika ada)
        // ============================================
        const validationErrors = [];
        const validRelawan = [];

        if (daftar_relawan && Array.isArray(daftar_relawan) && daftar_relawan.length > 0) {
            for (const item of daftar_relawan) {
                // Cek apakah relawan terdaftar berdasarkan NIK
                const checkRelawan = await client.query(`
                    SELECT r.relawan_id, u.user_id, u.nama_lengkap, u.nik
                    FROM relawan r
                    JOIN users u ON r.user_id = u.user_id
                    WHERE u.nik = $1 AND u.role = 'relawan' AND u.is_active = true
                `, [item.nik]);

                if (checkRelawan.rows.length === 0) {
                    validationErrors.push({
                        nik: item.nik,
                        nama: item.nama_lengkap || 'Tidak diketahui',
                        error: 'Relawan tidak terdaftar di sistem'
                    });
                } else {
                    // Cek apakah kader yang dipilih valid (jika ada)
                    if (item.kader_id) {
                        const checkKader = await client.query(`
                            SELECT kader_id, nama_kader, opd_id
                            FROM kader
                            WHERE kader_id = $1 AND is_active = true
                        `, [item.kader_id]);

                        if (checkKader.rows.length === 0) {
                            validationErrors.push({
                                nik: item.nik,
                                nama: checkRelawan.rows[0].nama_lengkap,
                                error: `Kader ID ${item.kader_id} tidak ditemukan atau tidak aktif`
                            });
                            continue;
                        }

                        // Pastikan kader belong to the same OPD
                        if (checkKader.rows[0].opd_id !== parseInt(opd_id)) {
                            validationErrors.push({
                                nik: item.nik,
                                nama: checkRelawan.rows[0].nama_lengkap,
                                error: `Kader "${checkKader.rows[0].nama_kader}" tidak bernaung di OPD ini`
                            });
                            continue;
                        }
                    }

                    validRelawan.push({
                        relawan_id: checkRelawan.rows[0].relawan_id,
                        kader_id: item.kader_id || null,
                        jabatan: item.jabatan || null,
                        nik: item.nik,
                        nama: checkRelawan.rows[0].nama_lengkap
                    });
                }
            }
        }

        // Jika ada relawan yang tidak valid, return error dengan detail
        if (validationErrors.length > 0) {
            res.status(400).json({
                success: false,
                message: `${validationErrors.length} relawan tidak valid`,
                error_code: 'INVALID_RELAWAN',
                data: {
                    total_valid: validRelawan.length,
                    total_invalid: validationErrors.length,
                    relawan_gagal: validationErrors
                },
                hint: {
                    title: 'Solusi:',
                    steps: [
                        'Pastikan semua relawan sudah terdaftar di menu "Data Relawan"',
                        'Pastikan NIK yang dimasukkan benar',
                        'Jika relawan belum terdaftar, tambahkan terlebih dahulu'
                    ],
                    link: '/data-relawan',
                    link_text: 'Buka Data Relawan →'
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

        // Convert file buffer ke Base64
        const base64File = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const base64String = `${mimeType};base64,${base64File}`;

        // Simpan SK
        const insertSKQuery = `
            INSERT INTO surat_keputusan (
                nomor_sk, judul_sk, tanggal_terbit, batas_aktif, 
                opd_id, file_path, status
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
        // PROSES: Tugaskan Relawan ke SK ini
        // ============================================
        // ============================================
        // PROSES: Tugaskan Relawan ke SK ini
        // ============================================
        const penugasanBerhasil = [];
        const penugasanGagal = [];

        for (const rlwn of validRelawan) {
            try {
                // ✅ FIXED: Cek apakah relawan sudah punya penugasan ini (OPD + Kader + Jabatan)
                const checkPenugasan = await client.query(
                    `SELECT penugasan_id FROM penugasan_relawan 
                     WHERE relawan_id = $1 
                       AND opd_id = $2 
                       AND kader_id IS NOT DISTINCT FROM $3 
                       AND jabatan IS NOT DISTINCT FROM $4`,
                    [rlwn.relawan_id, opd_id, rlwn.kader_id, rlwn.jabatan || null]
                );

                let currentPenugasanId;

                if (checkPenugasan.rows.length > 0) {
                    // JIKA PENUGASAN SUDAH ADA: Update saja dengan menempelkan sk_id baru
                    currentPenugasanId = checkPenugasan.rows[0].penugasan_id;
                    await client.query(
                        `UPDATE penugasan_relawan 
                         SET sk_id = $1, 
                             status_keaktifan = 'Aktif', 
                             updated_at = CURRENT_TIMESTAMP
                         WHERE penugasan_id = $2`,
                        [new_sk_id, currentPenugasanId]
                    );
                } else {
                    // JIKA PENUGASAN BELUM ADA: Insert sebagai penugasan baru yang langsung ber-SK
                    const insertRes = await client.query(
                        `INSERT INTO penugasan_relawan (
                            relawan_id, opd_id, kader_id, sk_id, jabatan, status_keaktifan
                        )
                         VALUES ($1, $2, $3, $4, $5, 'Aktif')
                         RETURNING penugasan_id`,
                        [rlwn.relawan_id, opd_id, rlwn.kader_id, new_sk_id, rlwn.jabatan || null]
                    );
                    currentPenugasanId = insertRes.rows[0].penugasan_id;
                }

                penugasanBerhasil.push({
                    nik: rlwn.nik,
                    nama: rlwn.nama,
                    penugasan_id: currentPenugasanId
                });

            } catch (error: any) {
                penugasanGagal.push({
                    nik: rlwn.nik,
                    nama: rlwn.nama,
                    error: error.message
                });
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Berhasil membuat Surat Keputusan',
            data: {
                sk_id: new_sk_id,
                nomor_sk,
                file_size: `${(req.file.size / 1024).toFixed(2)} KB`,
                total_relawan_ditugaskan: penugasanBerhasil.length,
                relawan_berhasil: penugasanBerhasil,
                relawan_gagal: penugasanGagal
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

// 6. Update Status SK
export const updateSKStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        res.status(400).json({ success: false, message: 'Status wajib diisi' });
        return;
    }

    try {
        const query = `
            UPDATE surat_keputusan
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE sk_id = $2
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [status, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data SK tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Status SK berhasil diperbarui menjadi ${status}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateSKStatus:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 7. Delete SK
export const deleteSK = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
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