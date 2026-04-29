//relawanAdminController
import pool from '../../config/db';
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

/**
 * Set RLS context pada raw client — dipanggil tepat setelah BEGIN.
 * Menggunakan set_config(..., true) agar transaction-local, identik dengan db.ts.
 * req.user.id bukan user_id — sesuai shape AuthRequest dari authMiddleware.ts
 */
const setClientContext = async (client: any, user: NonNullable<AuthRequest['user']>) => {
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [user.id.toString()]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [user.role]);
    await client.query("SELECT set_config('app.current_opd_id', $1, true)", [(user.opd_id ?? 0).toString()]);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dapatkan semua relawan
// ─────────────────────────────────────────────────────────────────────────────
export const getAllRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.no_hp, u.is_active,
                r.relawan_id, r.jenis_kelamin, r.alamat_ktp, r.kelurahan,
                pr.penugasan_id, pr.penugasan, pr.jabatan, pr.detail_jabatan,
                pr.status_keaktifan AS status_penugasan,
                o.nama_opd, k.nama_kader,
                sk.tanggal_terbit, sk.batas_aktif
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            LEFT JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
            WHERE u.role = 'relawan'
            ORDER BY u.created_at DESC
        `, [], req.user);
        res.status(200).json({ success: true, message: 'Berhasil mengambil daftar relawan', data: result.rows });
    } catch (error: any) {
        console.error('Error in getAllRelawan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dapatkan detail seorang relawan
// ─────────────────────────────────────────────────────────────────────────────
export const getRelawanById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.no_hp, u.foto_profil, u.is_active,
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
            WHERE u.user_id = $1 AND u.role = 'relawan'
        `, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data relawan tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Berhasil mengambil detail relawan', data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in getRelawanById:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Daftar antrian pengajuan perubahan data
// ─────────────────────────────────────────────────────────────────────────────
export const getPengajuanPerubahanDaftar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                pp.pengajuan_id, pp.jenis_perubahan, pp.status, pp.tanggal_pengajuan,
                pp.catatan_relawan, pp.data_baru, pp.data_lama,
                u.nama_lengkap, u.nik, r.relawan_id
            FROM pengajuan_perubahan_data pp
            JOIN relawan r ON pp.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            ORDER BY pp.tanggal_pengajuan DESC
        `, [], req.user);
        res.status(200).json({ success: true, message: 'Berhasil mengambil antrian pengajuan', data: result.rows });
    } catch (error: any) {
        console.error('Error in getPengajuanPerubahanDaftar:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Review Pengajuan (Approve / Reject)
// ─────────────────────────────────────────────────────────────────────────────
export const reviewPengajuan = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, catatan_verifikator } = req.body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
        res.status(400).json({ success: false, message: "Status harus 'Disetujui' atau 'Ditolak'" });
        return;
    }

    const statusDB = status === 'Disetujui' ? 'Diterima' : 'Ditolak';

    try {
        const pengajuanRes = await executeQueryWithContext(
            `SELECT * FROM pengajuan_perubahan_data WHERE pengajuan_id = $1 AND status = 'Menunggu Review'`,
            [id], req.user
        );
        if (pengajuanRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan atau sudah direview' });
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
        console.error('Error in reviewPengajuan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Tambah Relawan (Single Form)
// ─────────────────────────────────────────────────────────────────────────────
export const createRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const nik           = req.body.nik;
    const nama_lengkap  = req.body.nama_lengkap || req.body.namaLengkap;
    const alamat_ktp    = req.body.alamat_ktp || req.body.alamat;
    const kelurahan     = req.body.kelurahan;
    const jenis_kelamin = req.body.jenis_kelamin || req.body.jenisKelamin || 'L';
    const no_hp         = req.body.no_hp || req.body.noHp || null;
    const assignmentsToProcess: any[] = req.body.assignments?.length > 0 ? req.body.assignments : [];

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user!);

        const checkNik = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik]);
        if (checkNik.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar.' });
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

        for (const assign of assignmentsToProcess) {
            let opdId: number | null = assign.opd_id || null;
            const namaOpd = (assign.opd || '').trim();
            if (!opdId && namaOpd && namaOpd !== '-') {
                const r = await client.query(`SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`, [namaOpd]);
                if (r.rows.length > 0) opdId = r.rows[0].opd_id;
            }
            let kaderId: number | null = assign.kader_id || null;
            const namaKader = (assign.kader || '').trim();
            if (!kaderId && namaKader && namaKader !== '-') {
                const r = await client.query(`SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`, [namaKader, opdId]);
                if (r.rows.length > 0) kaderId = r.rows[0].kader_id;
                else {
                    const fb = await client.query(`SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) LIMIT 1`, [namaKader]);
                    if (fb.rows.length > 0) kaderId = fb.rows[0].kader_id;
                }
            }
            await client.query(`
                INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, penugasan, status_keaktifan)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
            `, [relawanId, opdId, kaderId, assign.peran || null, assign.detail || null, assign.penugasan || namaOpd || null, assign.statusKeaktifan || 'Aktif']);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Berhasil menambahkan data relawan' });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in createRelawan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Tambah / Update Relawan Bulk (Excel)
// ─────────────────────────────────────────────────────────────────────────────
export const createBulkRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const rawData = req.body;
    if (!Array.isArray(rawData) || rawData.length === 0) {
        res.status(400).json({ success: false, message: 'Data harus berupa array yang tidak kosong' });
        return;
    }

    const normalizeItem = (raw: any) => {
        const flat: Record<string, any> = {};
        for (const key of Object.keys(raw)) flat[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = raw[key];
        const get = (direct: string, excelKeys: string[]): string => {
            if (raw[direct] !== undefined && raw[direct] !== null && raw[direct] !== '') return String(raw[direct]);
            for (const k of excelKeys) if (flat[k] !== undefined && flat[k] !== null && flat[k] !== '') return String(flat[k]);
            return '';
        };
        return {
            nik:           get('nik',           ['nik', 'nomorindukkependudukan']).trim(),
            namaLengkap:   get('nama_lengkap',  ['namalengkap', 'nama', 'namarelawan']).trim(),
            jenisKelamin:  get('jenis_kelamin', ['jeniskelamin', 'jk', 'kelamin']).trim().toUpperCase() === 'P' ? 'P' : 'L',
            alamat:        get('alamat_ktp',    ['alamatktp', 'alamat', 'domisili']).trim() || '-',
            kelurahan:     get('kelurahan',     ['kelurahan', 'desa']).trim() || '-',
            opd:           get('opd',           ['opd', 'instansi', 'opdinstansi']).trim(),
            kader:         get('kader',         ['kader', 'komunitaskader', 'komunitas']).trim(),
            jabatan:       get('jabatan',       ['jabatan', 'peran', 'jabatanperan']).trim() || null,
            detailJabatan: get('detail_jabatan',['detailjabatan', 'detail']).trim() || null,
            penugasan:     get('penugasan',     ['penugasan', 'tugas']).trim() || null,
            noHp:          get('no_hp',         ['nohp', 'nomorhp', 'telepon']).trim() || null,
            assignments:   raw.assignments || null,
        };
    };

    const client = await pool.connect();
    let insertedCount = 0, updatedCount = 0, updatedProfileCount = 0;
    const errors: string[] = [];

    try {
        for (let i = 0; i < rawData.length; i++) {
            const item = normalizeItem(rawData[i]);
            const rowNumber = i + 2;

            if (!item.nik || !item.namaLengkap) {
                errors.push(`Baris ${rowNumber} dilewati: NIK atau Nama kosong/tidak terbaca.`);
                continue;
            }

            try {
                await client.query('BEGIN');
                // Bypass RLS: set role super_admin agar INSERT & UPDATE tidak diblokir policy
                await client.query("SELECT set_config('app.current_user_id', $1, true)", [req.user!.id.toString()]);
                await client.query("SELECT set_config('app.current_user_role', 'super_admin', true)");
                await client.query("SELECT set_config('app.current_opd_id', $1, true)", [(req.user!.opd_id ?? 0).toString()]);

                let userId: number;
                let relawanId: number;

                const checkRes = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [item.nik]);
                if (checkRes.rows.length > 0) {
                    // ── NIK sudah ada → UPDATE profil ──────────────────────────
                    userId = checkRes.rows[0].user_id;

                    // UPDATE users — tidak ada RLS di tabel ini, selalu berhasil
                    await client.query(`
                        UPDATE users
                        SET nama_lengkap = $1,
                            no_hp        = COALESCE(NULLIF($2, ''), no_hp),
                            updated_at   = CURRENT_TIMESTAMP
                        WHERE user_id = $3
                    `, [item.namaLengkap, item.noHp, userId]);

                    const relawanCheck = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);

                    if (relawanCheck.rows.length > 0) {
                        relawanId = relawanCheck.rows[0].relawan_id;

                        // UPDATE relawan — super_admin punya full RLS access, ini selalu berhasil
                        const updateR = await client.query(`
                            UPDATE relawan
                            SET jenis_kelamin = $1,
                                alamat_ktp   = $2,
                                kelurahan    = $3,
                                updated_at   = CURRENT_TIMESTAMP
                            WHERE relawan_id = $4
                            RETURNING relawan_id
                        `, [item.jenisKelamin, item.alamat, item.kelurahan, relawanId]);

                        if ((updateR.rowCount ?? 0) > 0) {
                            updatedProfileCount++;
                        } else {
                            errors.push(`Baris ${rowNumber}: Profil '${item.namaLengkap}' gagal diperbarui (RLS/permission).`);
                        }
                    } else {
                        const r = await client.query(`
                            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                            VALUES ($1,$2,$3,$4) RETURNING relawan_id
                        `, [userId, item.jenisKelamin, item.alamat, item.kelurahan]);
                        relawanId = r.rows[0].relawan_id;
                        updatedProfileCount++;
                    }
                } else {
                    // ── NIK baru → INSERT user + relawan ───────────────────────
                    const hashedPassword = await bcrypt.hash(item.nik + (process.env.PASSWORD_PEPPER || ''), await bcrypt.genSalt(10));
                    const uRes = await client.query(`
                        INSERT INTO users (nik, nama_lengkap, no_hp, password, role, is_active)
                        VALUES ($1,$2,$3,$4,'relawan',true) RETURNING user_id
                    `, [item.nik, item.namaLengkap, item.noHp, hashedPassword]);
                    userId = uRes.rows[0].user_id;

                    const rRes = await client.query(`
                        INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                        VALUES ($1,$2,$3,$4) RETURNING relawan_id
                    `, [userId, item.jenisKelamin, item.alamat, item.kelurahan]);
                    relawanId = rRes.rows[0].relawan_id;
                }

                // ── Proses Penugasan ───────────────────────────────────────────
                const assignmentsToProcess: any[] = item.assignments?.length > 0
                    ? item.assignments
                    : [{ opd: item.opd, kader: item.kader, peran: item.jabatan, detail: item.detailJabatan, penugasan: item.penugasan, statusKeaktifan: 'Aktif' }];

                let penugasanProcessed = false;
                for (const assign of assignmentsToProcess) {
                    let opdId: number | null = assign.opd_id || null;
                    const namaOpd = (assign.opd || '').trim();
                    if (!opdId && namaOpd && namaOpd !== '-') {
                        const r = await client.query(`SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`, [namaOpd]);
                        if (r.rows.length > 0) opdId = r.rows[0].opd_id;
                    }
                    if (!opdId) {
                        if (namaOpd) errors.push(`Baris ${rowNumber} (NIK ${item.nik}): OPD "${namaOpd}" tidak ditemukan. Profil tersimpan, penugasan dilewati.`);
                        continue;
                    }

                    let kaderId: number | null = assign.kader_id || null;
                    const namaKader = (assign.kader || '').trim();
                    if (!kaderId && namaKader && namaKader !== '-') {
                        const r = await client.query(`SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`, [namaKader, opdId]);
                        if (r.rows.length > 0) kaderId = r.rows[0].kader_id;
                        else {
                            const fb = await client.query(`SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) LIMIT 1`, [namaKader]);
                            if (fb.rows.length > 0) kaderId = fb.rows[0].kader_id;
                        }
                    }

                    const jabatan = assign.peran || assign.jabatan || null;
                    const checkP = await client.query(`
                        SELECT penugasan_id FROM penugasan_relawan
                        WHERE relawan_id = $1 AND opd_id = $2
                        LIMIT 1
                    `, [relawanId, opdId]);

                    if (checkP.rows.length > 0) {
                        await client.query(`
                            UPDATE penugasan_relawan
                            SET kader_id = $1, jabatan = $2, detail_jabatan = $3, penugasan = $4, status_keaktifan = $5, updated_at = CURRENT_TIMESTAMP
                            WHERE penugasan_id = $6
                        `, [kaderId, jabatan, assign.detail || assign.detailJabatan || null, assign.penugasan || namaOpd || null, assign.statusKeaktifan || 'Aktif', checkP.rows[0].penugasan_id]);
                        updatedCount++;
                    } else {
                        await client.query(`
                            INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, penugasan, detail_jabatan, status_keaktifan)
                            VALUES ($1,$2,$3,$4,$5,$6,$7)
                        `, [relawanId, opdId, kaderId, jabatan, assign.penugasan || namaOpd || null, assign.detail || assign.detailJabatan || null, assign.statusKeaktifan || 'Aktif']);
                        insertedCount++;
                    }
                    penugasanProcessed = true;
                }

                // Hitung profil yang diperbarui (hanya jika NIK sudah ada sebelumnya)
                if (checkRes.rows.length === 0 && !penugasanProcessed) {
                    insertedCount++;
                }
                await client.query('COMMIT');
                
            } catch (rowError: any) {
                await client.query('ROLLBACK');
                console.error(`Error row ${rowNumber} (${item.namaLengkap}):`, rowError);
                errors.push(`Baris ${rowNumber} gagal diproses: ${rowError.message}`);
            }
        }

        const parts: string[] = [];
        if (insertedCount > 0)       parts.push(`${insertedCount} data baru ditambahkan.`);
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
        console.error('Fatal error in createBulkRelawan:', fatalError);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.', errorDetail: fatalError.message });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Kader by OPD (dropdown)
// ─────────────────────────────────────────────────────────────────────────────
export const getkaderByOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        const result = opd_id
            ? await executeQueryWithContext(`SELECT kader_id, nama_kader, opd_id, is_active FROM kader WHERE opd_id = $1 ORDER BY nama_kader`, [opd_id], req.user)
            : await executeQueryWithContext(`SELECT kader_id, nama_kader, opd_id, is_active FROM kader ORDER BY nama_kader`, [], req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getkaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Update Relawan (form edit)
// ─────────────────────────────────────────────────────────────────────────────
export const updateRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const relawanId = parseInt(req.params.relawan_id as string);
    const { nama_lengkap, alamat_ktp, kelurahan, jenis_kelamin, assignments } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user!);

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
                let opdId: number | null = assign.opd_id || null;
                if (!opdId && assign.opd) {
                    const r = await client.query(`SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) LIMIT 1`, [assign.opd]);
                    if (r.rows.length > 0) opdId = r.rows[0].opd_id;
                }

                // ✨ Mapping status "Nonaktif" -> "Tidak Aktif" (sesuai ENUM DB)
                let statusKeaktifan = assign.statusKeaktifan || 'Aktif';
                if (statusKeaktifan === 'Nonaktif') {
                    statusKeaktifan = 'Tidak Aktif';
                }

                if (assign.penugasan_id) {
                    await client.query(`
                        UPDATE penugasan_relawan
                        SET opd_id = $1, kader_id = $2, jabatan = $3, detail_jabatan = $4, status_keaktifan = $5, updated_at = CURRENT_TIMESTAMP
                        WHERE penugasan_id = $6
                    `, [opdId, assign.kader_id || null, assign.peran || null, assign.detail || null, statusKeaktifan, assign.penugasan_id]);
                } else {
                    await client.query(`
                        INSERT INTO penugasan_relawan (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
                        VALUES ($1,$2,$3,$4,$5,$6)
                    `, [relawanId, opdId, assign.kader_id || null, assign.peran || null, assign.detail || null, statusKeaktifan]);
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

// ─────────────────────────────────────────────────────────────────────────────
// 9. Hapus Penugasan
// ─────────────────────────────────────────────────────────────────────────────
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