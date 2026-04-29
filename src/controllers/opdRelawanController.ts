//opRelawanController.ts
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import pool from '../../config/db';
import bcrypt from 'bcrypt';

/**
 * Set RLS context pada raw client — dipanggil tepat setelah BEGIN.
 * Menggunakan set_config(..., true) agar transaction-local, identik dengan db.ts.
 * user.id bukan user_id — sesuai shape AuthRequest dari authMiddleware.ts
 */
const setClientContext = async (client: any, user: NonNullable<OpdAuthRequest['user']>, opdId?: number) => {
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [user.id.toString()]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [user.role]);
    await client.query("SELECT set_config('app.current_opd_id', $1, true)", [(opdId ?? user.opd_id ?? 0).toString()]);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Daftar Relawan milik OPD
// ─────────────────────────────────────────────────────────────────────────────
export const getRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
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
        `, [req.opd_id], req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getRelawanByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Daftar SK milik OPD
// ─────────────────────────────────────────────────────────────────────────────
export const getSkByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit,
                sk.batas_aktif, sk.status,
                (SELECT COUNT(*) FROM penugasan_relawan pr WHERE pr.sk_id = sk.sk_id) AS jumlah_relawan
            FROM surat_keputusan sk
            WHERE sk.opd_id = $1
            ORDER BY sk.tanggal_terbit DESC
        `, [req.opd_id], req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getSkByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Tambah Relawan Manual (1 penugasan, khusus OPD ini)
// ─────────────────────────────────────────────────────────────────────────────
export const createRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const opdId     = req.opd_id!;
    const nik       = req.body.nik;
    const nama_lengkap  = req.body.nama_lengkap || req.body.namaLengkap || req.body.namaRelawan;
    const alamat_ktp    = req.body.alamat_ktp || req.body.alamat;
    const kelurahan     = req.body.kelurahan;
    const jenis_kelamin = req.body.jenis_kelamin || req.body.jenisKelamin || 'L';
    const no_hp         = req.body.no_hp || req.body.noHp || null;

    const assignment    = req.body.assignments?.length > 0 ? req.body.assignments[0] : req.body;
    const kaderText     = assignment.kader || assignment.kader_kader;
    const jabatan       = assignment.jabatan || assignment.peran;
    const detail_jabatan = assignment.detail_jabatan || assignment.detail;

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user!, opdId);

        const checkNik = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik]);
        if (checkNik.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar, silakan gunakan fitur edit.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(nik + (process.env.PASSWORD_PEPPER || ''), await bcrypt.genSalt(10));
        const userRes = await client.query(`
            INSERT INTO users (nik, nama_lengkap, no_hp, password, role, is_active)
            VALUES ($1,$2,$3,$4,'relawan',true) RETURNING user_id
        `, [nik, nama_lengkap, no_hp, hashedPassword]);
        const userId = userRes.rows[0].user_id;

        const relawanRes = await client.query(`
            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
            VALUES ($1,$2,$3,$4) RETURNING relawan_id
        `, [userId, jenis_kelamin, alamat_ktp || '-', kelurahan || '-']);
        const relawanId = relawanRes.rows[0].relawan_id;

        let kaderId: number | null = null;
        const namaKader = kaderText ? kaderText.trim() : '';
        if (namaKader && namaKader !== '-') {
            const r = await client.query(`SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`, [namaKader, opdId]);
            if (r.rows.length > 0) kaderId = r.rows[0].kader_id;
        }

        await client.query(`
            INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
            VALUES ($1,$2,$3,$4,$5,'Aktif')
        `, [relawanId, opdId, kaderId, jabatan || null, detail_jabatan || null]);

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Berhasil menambahkan data relawan' });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in createRelawanByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Tambah / Update Relawan Bulk Excel (khusus OPD ini)
// ─────────────────────────────────────────────────────────────────────────────
export const createBulkRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const rawData = req.body;
    const opdId   = req.opd_id!;

    if (!Array.isArray(rawData) || rawData.length === 0) {
        res.status(400).json({ success: false, message: 'Data harus berupa array yang tidak kosong' });
        return;
    }

    const client = await pool.connect();
    let insertedCount = 0, updatedCount = 0, updatedProfileCount = 0;
    const errors: string[] = [];

    try {
        for (let i = 0; i < rawData.length; i++) {
            const rawItem = rawData[i];
            const rowNumber = i + 2;

            const flat: Record<string, any> = {};
            for (const key of Object.keys(rawItem)) flat[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = rawItem[key];
            const get = (keys: string[]): string => {
                for (const k of keys) if (flat[k] !== undefined && flat[k] !== null && flat[k] !== '') return String(flat[k]);
                return '';
            };

            const nik          = get(['nik', 'nomorindukkependudukan']).trim();
            const namaLengkap  = get(['namalengkap', 'nama', 'namarelawan']).trim();
            const jenisKelamin = get(['jeniskelamin', 'jk', 'kelamin']).trim().toUpperCase() === 'P' ? 'P' : 'L';
            const alamat       = get(['alamatktp', 'alamat', 'domisili']).trim() || '-';
            const kelurahan    = get(['kelurahan', 'desa']).trim() || '-';
            const kaderName    = get(['kader', 'komunitaskader', 'komunitas']).trim();
            const peran        = get(['jabatan', 'peran', 'jabatanperan']).trim() || null;
            const detail       = get(['detailjabatan', 'detail']).trim() || null;
            const penugasanText = get(['penugasan', 'tugas']).trim() || null;
            const noHp         = get(['nohp', 'nomorhp', 'telepon']).trim() || null;

            if (!nik || !namaLengkap) {
                errors.push(`Baris ${rowNumber} dilewati: NIK atau Nama kosong/tidak terbaca.`);
                continue;
            }

            try {
                await client.query('BEGIN');
                await setClientContext(client, req.user!, opdId);

                let userId: number;
                let relawanId: number;

                const checkRes = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik]);

                if (checkRes.rows.length > 0) {
                    // ── NIK sudah ada → UPDATE profil ─────────────────────────
                    userId = checkRes.rows[0].user_id;

                    // UPDATE users (tabel ini tidak ada RLS, selalu berhasil)
                    await client.query(`
                        UPDATE users
                        SET nama_lengkap = $1,
                            no_hp        = COALESCE(NULLIF($2, ''), no_hp),
                            updated_at   = CURRENT_TIMESTAMP
                        WHERE user_id = $3
                    `, [namaLengkap, noHp, userId]);

                    const relawanCheck = await client.query(
                        `SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]
                    );

                    if (relawanCheck.rows.length > 0) {
                        relawanId = relawanCheck.rows[0].relawan_id;

                        // UPDATE relawan — cek rowCount, bisa 0 jika RLS blocking
                        const updateR = await client.query(`
                            UPDATE relawan
                            SET jenis_kelamin = $1,
                                alamat_ktp   = $2,
                                kelurahan    = $3,
                                updated_at   = CURRENT_TIMESTAMP
                            WHERE relawan_id = $4
                            RETURNING relawan_id
                        `, [jenisKelamin, alamat, kelurahan, relawanId]);

                        if ((updateR.rowCount ?? 0) > 0) {
                            updatedProfileCount++;
                        } else {
                            // RLS masih blocking: coba INSERT fallback tidak masuk akal,
                            // tapi setidaknya laporkan agar tidak silent
                            errors.push(`Baris ${rowNumber} (${namaLengkap}): Profil relawan tidak dapat diperbarui — periksa RLS policy untuk role 'opd'.`);
                        }
                    } else {
                        // User ada tapi relawan belum — buat baru
                        const r = await client.query(`
                            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                            VALUES ($1,$2,$3,$4) RETURNING relawan_id
                        `, [userId, jenisKelamin, alamat, kelurahan]);
                        relawanId = r.rows[0].relawan_id;
                        updatedProfileCount++;
                    }
                } else {
                    // ── NIK baru → INSERT user + relawan ──────────────────────
                    const hashedPassword = await bcrypt.hash(nik + (process.env.PASSWORD_PEPPER || ''), await bcrypt.genSalt(10));
                    const uRes = await client.query(`
                        INSERT INTO users (nik, nama_lengkap, no_hp, password, role, is_active)
                        VALUES ($1,$2,$3,$4,'relawan',true) RETURNING user_id
                    `, [nik, namaLengkap, noHp, hashedPassword]);
                    userId = uRes.rows[0].user_id;

                    const rRes = await client.query(`
                        INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                        VALUES ($1,$2,$3,$4) RETURNING relawan_id
                    `, [userId, jenisKelamin, alamat, kelurahan]);
                    relawanId = rRes.rows[0].relawan_id;
                }

                // ── Penugasan (khusus OPD ini) ─────────────────────────────────
                let kaderId: number | null = null;
                if (kaderName && kaderName !== '-') {
                    const r = await client.query(
                        `SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                        [kaderName, opdId]
                    );
                    if (r.rows.length > 0) kaderId = r.rows[0].kader_id;
                }

                const checkP = await client.query(`
                    SELECT penugasan_id FROM penugasan_relawan
                    WHERE relawan_id = $1 AND opd_id = $2
                    LIMIT 1
                `, [relawanId, opdId]);

                if (checkP.rows.length > 0) {
                    const updateP = await client.query(`
                        UPDATE penugasan_relawan
                        SET kader_id       = $1,
                            jabatan        = $2,
                            detail_jabatan = $3,
                            penugasan      = $4,
                            status_keaktifan = $5,
                            updated_at     = CURRENT_TIMESTAMP
                        WHERE penugasan_id = $6
                        RETURNING penugasan_id
                    `, [kaderId, peran, detail, penugasanText, 'Aktif', checkP.rows[0].penugasan_id]);

                    if ((updateP.rowCount ?? 0) > 0) {
                        updatedCount++;
                    } else {
                        errors.push(`Baris ${rowNumber} (${namaLengkap}): Penugasan tidak dapat diperbarui — periksa RLS policy untuk role 'opd'.`);
                    }
                } else {
                    await client.query(`
                        INSERT INTO penugasan_relawan
                            (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, status_keaktifan)
                        VALUES ($1,$2,$3,$4,$5,$6,'Aktif')
                    `, [relawanId, opdId, kaderId, peran, detail, penugasanText]);
                    insertedCount++;
                }

                await client.query('COMMIT');
            } catch (rowError: any) {
                await client.query('ROLLBACK');
                console.error(`Error row ${rowNumber} (${namaLengkap}):`, rowError);
                errors.push(`Baris ${rowNumber} gagal diproses: ${rowError.message}`);
            }
        }

        const parts: string[] = [];
        if (insertedCount > 0)       parts.push(`${insertedCount} relawan baru ditambahkan.`);
        if (updatedProfileCount > 0) parts.push(`${updatedProfileCount} profil diperbarui.`);
        if (updatedCount > 0)        parts.push(`${updatedCount} penugasan diperbarui.`);
        if (errors.length > 0)       parts.push(`${errors.length} peringatan.`);

        const totalSuccess = insertedCount + updatedProfileCount + updatedCount;
        res.status(totalSuccess > 0 ? 201 : 400).json({
            success: totalSuccess > 0,
            message: parts.join(' ') || 'Tidak ada data yang diproses',
            data: { insertedCount, updatedProfileCount, updatedCount, errors }
        });
    } catch (fatalError: any) {
        console.error('Fatal error in createBulkRelawanByOpd:', fatalError);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.', errorDetail: (fatalError as any).message });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Update Relawan (form edit, khusus OPD ini)
// ─────────────────────────────────────────────────────────────────────────────
export const updateRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const opdId     = req.opd_id!;
    const relawanId = parseInt(req.params.relawan_id as string);
    const { nama_lengkap, alamat_ktp, kelurahan, jenis_kelamin, assignments } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user!, opdId);

        // Pastikan relawan ini memang ada di OPD ini
        const checkAccess = await client.query(
            `SELECT penugasan_id FROM penugasan_relawan WHERE relawan_id = $1 AND opd_id = $2 LIMIT 1`,
            [relawanId, opdId]
        );
        if (checkAccess.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(403).json({ success: false, message: 'Relawan ini tidak terdaftar di instansi Anda' });
            return;
        }

        await client.query(`
            UPDATE relawan SET alamat_ktp = $1, kelurahan = $2, jenis_kelamin = $3, updated_at = CURRENT_TIMESTAMP
            WHERE relawan_id = $4
        `, [alamat_ktp, kelurahan, jenis_kelamin, relawanId]);

        if (nama_lengkap) {
            await client.query(`
                UPDATE users SET nama_lengkap = $1, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = (SELECT user_id FROM relawan WHERE relawan_id = $2)
            `, [nama_lengkap, relawanId]);
        }

        if (Array.isArray(assignments)) {
            for (const assign of assignments) {
                if (assign.penugasan_id) {
                    await client.query(`
                        UPDATE penugasan_relawan
                        SET kader_id = $1, jabatan = $2, detail_jabatan = $3, status_keaktifan = $4, updated_at = CURRENT_TIMESTAMP
                        WHERE penugasan_id = $5 AND opd_id = $6
                    `, [assign.kader_id || null, assign.peran || null, assign.detail || null, assign.statusKeaktifan || 'Aktif', assign.penugasan_id, opdId]);
                } else {
                    await client.query(`
                        INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
                        VALUES ($1,$2,$3,$4,$5,$6)
                    `, [relawanId, opdId, assign.kader_id || null, assign.peran || null, assign.detail || null, assign.statusKeaktifan || 'Aktif']);
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

// ─────────────────────────────────────────────────────────────────────────────
// 6. Hapus Penugasan (khusus OPD ini)
// ─────────────────────────────────────────────────────────────────────────────
export const deletePenugasanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const penugasanId = parseInt(req.params.penugasan_id as string);
    try {
        const result = await executeQueryWithContext(
            `DELETE FROM penugasan_relawan WHERE penugasan_id = $1 AND opd_id = $2 RETURNING penugasan_id`,
            [penugasanId, req.opd_id], req.user
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

// ─────────────────────────────────────────────────────────────────────────────
// 7. Pengajuan Perubahan Data (Khusus OPD)
// ─────────────────────────────────────────────────────────────────────────────
export const getPengajuanPerubahanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                pp.pengajuan_id, pp.jenis_perubahan, pp.status, pp.tanggal_pengajuan,
                pp.catatan_relawan, pp.data_baru, pp.data_lama,
                u.nama_lengkap, u.nik, r.relawan_id
            FROM pengajuan_perubahan_data pp
            JOIN relawan r ON pp.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            WHERE EXISTS (
                SELECT 1 FROM penugasan_relawan pr 
                WHERE pr.relawan_id = r.relawan_id AND pr.opd_id = $1
            )
            ORDER BY pp.tanggal_pengajuan DESC
        `, [req.opd_id], req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getPengajuanPerubahanByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const reviewPengajuanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, catatan_verifikator } = req.body;
    const opdId = req.opd_id;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
        res.status(400).json({ success: false, message: "Status harus 'Disetujui' atau 'Ditolak'" });
        return;
    }

    const statusDB = status === 'Disetujui' ? 'Diterima' : 'Ditolak';

    try {
        // Pastikan pengajuan ada, menunggu review, dan milik relawan di OPD ini
        const pengajuanRes = await executeQueryWithContext(`
            SELECT pp.* FROM pengajuan_perubahan_data pp
            WHERE pp.pengajuan_id = $1 
              AND pp.status = 'Menunggu Review'
              AND EXISTS (
                  SELECT 1 FROM penugasan_relawan pr 
                  WHERE pr.relawan_id = pp.relawan_id AND pr.opd_id = $2
              )
        `, [id, opdId], req.user);

        if (pengajuanRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan, sudah direview, atau bukan milik instansi Anda' });
            return;
        }

        const pengajuan = pengajuanRes.rows[0];
        await executeQueryWithContext(`
            UPDATE pengajuan_perubahan_data 
            SET status = $1, catatan_verifikator = $2,
                tanggal_verifikasi = CURRENT_TIMESTAMP, verifikator_id = $3
            WHERE pengajuan_id = $4
        `, [statusDB, catatan_verifikator || null, req.user!.id, id], req.user);

        if (status === 'Disetujui' && pengajuan.data_baru) {
            const dataBaru = typeof pengajuan.data_baru === 'string'
                ? JSON.parse(pengajuan.data_baru) : pengajuan.data_baru;
            if (dataBaru.nama_lengkap) {
                await executeQueryWithContext(
                    `UPDATE users SET nama_lengkap = $1 WHERE user_id = (SELECT user_id FROM relawan WHERE relawan_id = $2)`,
                    [dataBaru.nama_lengkap, pengajuan.relawan_id], req.user
                );
            }
            if (dataBaru.alamat_ktp) {
                await executeQueryWithContext(
                    `UPDATE relawan SET alamat_ktp = $1 WHERE relawan_id = $2`,
                    [dataBaru.alamat_ktp, pengajuan.relawan_id], req.user
                );
            }
        }

        res.status(200).json({ success: true, message: `Pengajuan berhasil ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}` });
    } catch (error: any) {
        console.error('Error in reviewPengajuanByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};