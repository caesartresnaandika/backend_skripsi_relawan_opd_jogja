//opdRelawanControllers.ts
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import pool from '../../config/db';
import bcrypt from 'bcrypt';

// Helper: set RLS context pada raw client (wajib dipanggil setelah BEGIN)
const setClientContext = async (client: any, user: any, opdId?: number) => {
    const userId = user?.user_id ?? user?.id;
    const role = user?.role;
    await client.query('SET LOCAL app.current_user_id = $1', [userId]);
    await client.query('SET LOCAL app.current_user_role = $1', [role]);
    if (opdId !== undefined) {
        await client.query('SET LOCAL app.current_opd_id = $1', [opdId]);
    }
};

// 1. Dapatkan Daftar Relawan yang bertugas di OPD ini
export const getRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.is_active,
                r.relawan_id, r.jenis_kelamin, r.alamat_ktp, r.kelurahan,
                pr.penugasan_id, pr.jabatan, pr.detail_jabatan,
                pr.status_keaktifan AS status_penugasan,
                pr.opd_id, pr.kader_id,
                o.nama_opd, k.nama_kader
            FROM penugasan_relawan pr
            JOIN relawan r ON pr.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            WHERE pr.opd_id = $1
            ORDER BY u.nama_lengkap ASC
        `, [opdId], req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getRelawanByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 2. Dapatkan Daftar Surat Keputusan (SK) milik OPD ini
export const getSkByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, 
                sk.batas_aktif, sk.status,
                (SELECT COUNT(*) FROM penugasan_relawan pr WHERE pr.sk_id = sk.sk_id) as jumlah_relawan
            FROM surat_keputusan sk
            WHERE sk.opd_id = $1
            ORDER BY sk.tanggal_terbit DESC
        `, [opdId], req.user);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getSkByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 3. Tambah Relawan Manual Khusus OPD (1 Penugasan saja)
export const createRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const opdId = req.opd_id;

    const nama_lengkap = req.body.nama_lengkap || req.body.namaLengkap || req.body.namaRelawan;
    const nik = req.body.nik;
    const alamat_ktp = req.body.alamat_ktp || req.body.alamat;
    const kelurahan = req.body.kelurahan;
    const jenis_kelamin = req.body.jenis_kelamin || req.body.jenisKelamin || 'L';
    const no_hp = req.body.no_hp || req.body.noHp || null;

    const assignment = req.body.assignments && req.body.assignments.length > 0
        ? req.body.assignments[0]
        : req.body;

    const kaderText = assignment.kader || assignment.kader_kader;
    const jabatan = assignment.jabatan || assignment.peran;
    const detail_jabatan = assignment.detail_jabatan || assignment.detail;

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user, opdId); // FIX: set RLS context

        const checkNikQuery = `SELECT user_id FROM users WHERE nik = $1`;
        const checkNikRes = await client.query(checkNikQuery, [nik]);

        if (checkNikRes.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar, silakan gunakan fitur edit.' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nik, salt);

        const userRes = await client.query(
            `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, is_active)
             VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id;`,
            [nik, nama_lengkap, no_hp, hashedPassword]
        );
        const userId = userRes.rows[0].user_id;

        const relawanRes = await client.query(
            `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
             VALUES ($1, $2, $3, $4) RETURNING relawan_id;`,
            [userId, jenis_kelamin, alamat_ktp || '-', kelurahan || '-']
        );
        const relawanId = relawanRes.rows[0].relawan_id;

        let kaderId: number | null = null;
        const namaKader = kaderText ? kaderText.trim() : '';

        if (namaKader && namaKader !== '-') {
            const kaderLookup = await client.query(
                `SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                [namaKader, opdId]
            );
            if (kaderLookup.rows.length > 0) {
                kaderId = kaderLookup.rows[0].kader_id;
            }
        }

        await client.query(
            `INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
             VALUES ($1, $2, $3, $4, $5, 'Aktif')`,
            [relawanId, opdId, kaderId, jabatan || null, detail_jabatan || null]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Berhasil menambahkan data relawan' });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in createRelawanByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menambahkan data relawan' });
    } finally {
        client.release();
    }
};

// 4. Tambah / Update Relawan Excel Khusus OPD (Bulk)
export const createBulkRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const rawData = req.body;
    const opdId = req.opd_id;

    if (!Array.isArray(rawData) || rawData.length === 0) {
        res.status(400).json({ success: false, message: 'Data yang dikirim harus berupa array yang tidak kosong' });
        return;
    }

    const client = await pool.connect();
    let insertedCount = 0;
    let updatedCount = 0;
    let updatedProfileCount = 0;
    const errors: string[] = [];

    try {
        for (let i = 0; i < rawData.length; i++) {
            const rawItem = rawData[i];
            const rowNumber = i + 1;

            const item: Record<string, any> = {};
            for (const key of Object.keys(rawItem)) {
                item[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = rawItem[key];
            }

            const getVal = (possibleKeys: string[]) => {
                for (const key of possibleKeys) {
                    if (item[key] !== undefined && item[key] !== null && item[key] !== '')
                        return String(item[key]);
                }
                return '';
            };

            const nik = getVal(['nik']).trim();
            const namaLengkap = getVal(['namalengkap', 'nama']).trim();
            const jenisKelamin = getVal(['jeniskelamin', 'jk', 'kelamin']).trim().toUpperCase() === 'P' ? 'P' : 'L';
            const alamat = getVal(['alamatktp', 'alamat', 'domisili']).trim() || '-';
            const kelurahan = getVal(['kelurahan', 'desa']).trim() || '-';
            const kaderName = getVal(['kader', 'komunitaskader', 'komunitas']).trim();
            const peran = getVal(['jabatan', 'peran']).trim() || null;
            const detail = getVal(['detailjabatan', 'detail']).trim() || null;
            const noHp = getVal(['nohp', 'nomorhp', 'telepon']).trim() || null;

            if (!nik || !namaLengkap) {
                errors.push(`Baris ${rowNumber} dilewati: NIK atau Nama Lengkap kosong.`);
                continue;
            }

            try {
                await client.query('BEGIN');
                // FIX: Set RLS context di dalam transaksi agar policy berlaku pada client ini.
                // Tanpa ini, INSERT/UPDATE pada tabel ber-RLS akan gagal dan
                // menyebabkan ROLLBACK yang juga membatalkan UPDATE users/relawan.
                await setClientContext(client, req.user, opdId);

                let userId: number;
                let relawanId: number;

                const checkRes = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik]);

                if (checkRes.rows.length > 0) {
                    // ── NIK sudah ada: UPDATE profil ──────────────────────────────
                    userId = checkRes.rows[0].user_id;

                    await client.query(
                        `UPDATE users
                         SET nama_lengkap = $1,
                             no_hp        = COALESCE(NULLIF($2, ''), no_hp),
                             updated_at   = CURRENT_TIMESTAMP
                         WHERE user_id = $3`,
                        [namaLengkap, noHp || null, userId]
                    );

                    const getRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);

                    if (getRelawan.rows.length > 0) {
                        relawanId = getRelawan.rows[0].relawan_id;

                        await client.query(
                            `UPDATE relawan
                             SET jenis_kelamin = $1,
                                 alamat_ktp    = $2,
                                 kelurahan     = $3,
                                 updated_at    = CURRENT_TIMESTAMP
                             WHERE relawan_id = $4`,
                            [jenisKelamin, alamat, kelurahan, relawanId]
                        );
                        updatedProfileCount++;
                    } else {
                        const relawanRes = await client.query(
                            `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                             VALUES ($1, $2, $3, $4) RETURNING relawan_id`,
                            [userId, jenisKelamin, alamat, kelurahan]
                        );
                        relawanId = relawanRes.rows[0].relawan_id;
                    }
                } else {
                    // ── NIK baru: INSERT user + relawan ──────────────────────────
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(nik, salt);

                    const userRes = await client.query(
                        `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, is_active)
                         VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id`,
                        [nik, namaLengkap, noHp, hashedPassword]
                    );
                    userId = userRes.rows[0].user_id;

                    const relawanRes = await client.query(
                        `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                         VALUES ($1, $2, $3, $4) RETURNING relawan_id`,
                        [userId, jenisKelamin, alamat, kelurahan]
                    );
                    relawanId = relawanRes.rows[0].relawan_id;
                }

                // ── Proses Penugasan (khusus OPD ini) ───────────────────────────
                let kaderId: number | null = null;
                if (kaderName && kaderName !== '-') {
                    const kaderLookup = await client.query(
                        `SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                        [kaderName, opdId]
                    );
                    if (kaderLookup.rows.length > 0) kaderId = kaderLookup.rows[0].kader_id;
                }

                const checkPenugasan = await client.query(
                    `SELECT penugasan_id FROM penugasan_relawan 
                     WHERE relawan_id = $1 
                       AND opd_id = $2 
                       AND kader_id IS NOT DISTINCT FROM $3 
                       AND jabatan IS NOT DISTINCT FROM $4`,
                    [relawanId, opdId, kaderId, peran || null]
                );

                if (checkPenugasan.rows.length > 0) {
                    await client.query(
                        `UPDATE penugasan_relawan
                         SET detail_jabatan   = $1,
                             status_keaktifan = $2,
                             updated_at       = CURRENT_TIMESTAMP
                         WHERE penugasan_id = $3`,
                        [detail || null, 'Aktif', checkPenugasan.rows[0].penugasan_id]
                    );
                    updatedCount++;
                } else {
                    await client.query(
                        `INSERT INTO penugasan_relawan
                            (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
                         VALUES ($1, $2, $3, $4, $5, 'Aktif')`,
                        [relawanId, opdId, kaderId, peran || null, detail || null]
                    );
                    insertedCount++;
                }

                await client.query('COMMIT');

            } catch (rowError: any) {
                await client.query('ROLLBACK');
                console.error(`Error processing row ${rowNumber}:`, rowError);
                errors.push(`Baris ${rowNumber} gagal: ${rowError.message}`);
            }
        }

        const parts: string[] = [];
        if (insertedCount > 0) parts.push(`Berhasil menambahkan ${insertedCount} relawan baru.`);
        if (updatedProfileCount > 0) parts.push(`Berhasil memperbarui profil ${updatedProfileCount} relawan yang sudah terdaftar.`);
        if (updatedCount > 0) parts.push(`Berhasil memperbarui ${updatedCount} data penugasan.`);
        if (errors.length > 0) parts.push(`Ada ${errors.length} peringatan/error.`);

        const totalSuccess = insertedCount + updatedProfileCount + updatedCount;

        res.status(totalSuccess > 0 ? 201 : 400).json({
            success: totalSuccess > 0,
            message: parts.join(' ') || 'Tidak ada data yang diproses',
            data: { insertedCount, updatedProfileCount, updatedCount, errors }
        });

    } catch (fatalError: any) {
        console.error('Fatal error in createBulkRelawanByOpd:', fatalError);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem yang fatal.', errorDetail: (fatalError as any).message });
    } finally {
        client.release();
    }
};


export const updateRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const opdId = req.opd_id;
    const relawanId = parseInt(req.params.relawan_id as string);
    const { nama_lengkap, alamat_ktp, kelurahan, jenis_kelamin, assignments } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user, opdId); // FIX: set RLS context

        const checkAccess = await client.query(
            `SELECT pr.penugasan_id FROM penugasan_relawan pr
             WHERE pr.relawan_id = $1 AND pr.opd_id = $2 LIMIT 1`,
            [relawanId, opdId]
        );
        if (checkAccess.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Relawan ini tidak terdaftar di instansi Anda' });
            return;
        }

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
                if (assign.penugasan_id) {
                    await client.query(
                        `UPDATE penugasan_relawan
                         SET kader_id = $1, jabatan = $2, detail_jabatan = $3, status_keaktifan = $4, updated_at = CURRENT_TIMESTAMP
                         WHERE penugasan_id = $5 AND opd_id = $6`,
                        [assign.kader_id || null, assign.peran || null, assign.detail || null,
                        assign.statusKeaktifan || 'Aktif', assign.penugasan_id, opdId]
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
        console.error('Error in updateRelawanByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    } finally {
        client.release();
    }
};

export const deletePenugasanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const opdId = req.opd_id;
    const penugasanId = parseInt(req.params.penugasan_id as string);
    try {
        const result = await executeQueryWithContext(
            `DELETE FROM penugasan_relawan WHERE penugasan_id = $1 AND opd_id = $2 RETURNING penugasan_id`,
            [penugasanId, opdId], req.user
        );
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Penugasan berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deletePenugasanByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};