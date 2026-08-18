/*
 * ============================================================
 * RELAWAN ADMIN CONTROLLER (Super Admin)
 * ============================================================
 * Controller untuk manajemen relawan oleh Super Admin.
 * Super Admin memiliki akses penuh ke semua data relawan
 * di semua OPD.
 *
 * Fitur:
 * 1. Lihat daftar semua relawan
 * 2. Lihat detail relawan + penugasannya
 * 3. Review pengajuan perubahan data relawan
 * 4. Tambah relawan (manual single form)
 * 5. Import/update relawan bulk (Excel)
 * 6. Update relawan (form edit)
 * 7. Hapus penugasan relawan
 *
 * Strategi Bulk Import (createBulkRelawan):
 * - NIK sudah ada di database → UPDATE profil (nama, no_hp, alamat)
 * - NIK baru → INSERT user + relawan baru
 * - Password default saat insert = NIK (yang nanti bisa diubah relawan)
 * ============================================================
 */

import pool from '../../config/db';
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

/**
 * Set RLS context pada raw client — dipanggil tepat setelah BEGIN.
 * Menggunakan set_config(..., true) agar transaction-local, identik dengan db.ts.
 * req.user.id sesuai shape AuthRequest dari authMiddleware.ts
 */
const setClientContext = async (client: any, user: NonNullable<AuthRequest['user']>) => {
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [user.id.toString()]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [user.role]);
    await client.query("SELECT set_config('app.current_opd_id', $1, true)", [(user.opd_id ?? 0).toString()]);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET ALL RELAWAN (Nested Response, Search, Filter & Pagination)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limitParam = req.query.limit ? parseInt(req.query.limit as string) : null;
        const limit = limitParam && limitParam > 0 ? limitParam : null;
        const offset = limit ? (page - 1) * limit : 0;

        const search = req.query.q as string;
        const kemantren = req.query.kemantren as string;
        const kelurahan = req.query.kelurahan as string;
        const opdId = req.query.opd_id as string;
        const kaderId = req.query.kader_id as string;
        const sort = (req.query.sort as string) || 'created_at';
        const order = ((req.query.order as string) || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let whereClause = `WHERE u.role = 'relawan'`;
        const values: any[] = [];
        let paramIndex = 1;

        if (search && search.trim() !== '') {
            whereClause += ` AND (u.nama_lengkap ILIKE $${paramIndex} OR u.nik ILIKE $${paramIndex} OR u.no_hp ILIKE $${paramIndex})`;
            values.push(`%${search.trim()}%`);
            paramIndex++;
        }

        if (kemantren && kemantren.trim() !== '') {
            whereClause += ` AND r.kemantren ILIKE $${paramIndex}`;
            values.push(kemantren.trim());
            paramIndex++;
        }

        if (kelurahan && kelurahan.trim() !== '') {
            whereClause += ` AND r.kelurahan ILIKE $${paramIndex}`;
            values.push(kelurahan.trim());
            paramIndex++;
        }

        if (opdId && !isNaN(parseInt(opdId, 10))) {
            whereClause += ` AND EXISTS (SELECT 1 FROM penugasan_relawan p_sub WHERE p_sub.relawan_id = r.relawan_id AND p_sub.opd_id = $${paramIndex})`;
            values.push(parseInt(opdId, 10));
            paramIndex++;
        }

        if (kaderId && !isNaN(parseInt(kaderId, 10))) {
            whereClause += ` AND EXISTS (SELECT 1 FROM penugasan_relawan p_sub WHERE p_sub.relawan_id = r.relawan_id AND p_sub.kader_id = $${paramIndex})`;
            values.push(parseInt(kaderId, 10));
            paramIndex++;
        }

        // Tentukan kolom sort aman
        let sortColumn = 'u.created_at';
        if (sort === 'nama' || sort === 'nama_lengkap') sortColumn = 'u.nama_lengkap';
        else if (sort === 'nik') sortColumn = 'u.nik';
        else if (sort === 'kemantren') sortColumn = 'r.kemantren';
        else if (sort === 'kelurahan') sortColumn = 'r.kelurahan';

        // Hitung total relawan unik untuk pagination
        const countQuery = `
            SELECT COUNT(DISTINCT r.relawan_id) as total
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            ${whereClause}
        `;
        const countResult = await executeQueryWithContext(countQuery, values, req.user);
        const totalRecords = parseInt(countResult.rows[0]?.total || '0', 10);
        const totalPages = limit ? Math.ceil(totalRecords / limit) : 1;

        // Query utama dengan aggregasi nested JSON penugasan
        let mainQuery = `
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.no_hp, u.status_keaktifan,
                r.relawan_id, r.relawan_id AS id, r.jenis_kelamin, r.alamat_ktp, r.kemantren, r.kelurahan,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'penugasan_id', pr.penugasan_id,
                            'penugasan', pr.penugasan,
                            'jabatan', pr.jabatan,
                            'detail_jabatan', pr.detail_jabatan,
                            'status_penugasan', pr.status_keaktifan,
                            'status_keaktifan', pr.status_keaktifan,
                            'opd_id', pr.opd_id,
                            'nama_opd', o.nama_opd,
                            'kader_id', pr.kader_id,
                            'nama_kader', k.nama_kader,
                            'sk_id', pr.sk_id,
                            'nomor_sk', sk.nomor_sk,
                            'tanggal_terbit', sk.tanggal_terbit,
                            'batas_aktif', sk.batas_aktif
                        ) ORDER BY pr.penugasan_id DESC
                    ) FILTER (WHERE pr.penugasan_id IS NOT NULL), '[]'
                ) AS assignments
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            LEFT JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
            ${whereClause}
            GROUP BY u.user_id, r.relawan_id
            ORDER BY ${sortColumn} ${order}
        `;

        if (limit) {
            mainQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            values.push(limit, offset);
        }

        const result = await executeQueryWithContext(mainQuery, values, req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar relawan',
            data: result.rows,
            pagination: {
                total_records: totalRecords,
                total_pages: totalPages,
                current_page: page,
                limit_per_page: limit || totalRecords,
                has_next_page: limit ? page < totalPages : false,
                has_prev_page: page > 1
            }
        });
    } catch (error: any) {
        console.error('Error in getAllRelawan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1b. GET RELAWAN FILTER OPTIONS (Metadata Dropdown Filter)
// ─────────────────────────────────────────────────────────────────────────────
export const getRelawanFilterOptions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT json_build_object(
                'kemantren', (SELECT COALESCE(json_agg(DISTINCT kemantren) FILTER (WHERE kemantren IS NOT NULL AND kemantren != '-' AND kemantren != ''), '[]') FROM relawan),
                'kelurahan', (SELECT COALESCE(json_agg(DISTINCT kelurahan) FILTER (WHERE kelurahan IS NOT NULL AND kelurahan != '-' AND kelurahan != ''), '[]') FROM relawan),
                'opd', (SELECT COALESCE(json_agg(json_build_object('opd_id', opd_id, 'nama_opd', nama_opd) ORDER BY nama_opd), '[]') FROM opd WHERE status_keaktifan = true),
                'kader', (SELECT COALESCE(json_agg(json_build_object('kader_id', kader_id, 'nama_kader', nama_kader, 'opd_id', opd_id) ORDER BY nama_kader), '[]') FROM kader WHERE status_keaktifan = true)
            ) AS filter_options;
        `;
        const result = await executeQueryWithContext(query, [], req.user);
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil opsi filter relawan',
            data: result.rows[0]?.filter_options || { kemantren: [], kelurahan: [], opd: [], kader: [] }
        });
    } catch (error: any) {
        console.error('Error in getRelawanFilterOptions:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat opsi filter' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET RELAWAN BY ID
// ─────────────────────────────────────────────────────────────────────────────
export const getRelawanById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await executeQueryWithContext(`
            SELECT 
                u.user_id, u.nik, u.nama_lengkap, u.no_hp, u.foto_profil, u.status_keaktifan,
                r.relawan_id, r.jenis_kelamin, r.alamat_ktp, r.kemantren, r.kelurahan,
                pr.penugasan_id, pr.penugasan, pr.jabatan, pr.detail_jabatan,
                pr.status_keaktifan AS status_penugasan, pr.sk_id,
                pr.opd_id, pr.kader_id,
                o.nama_opd, k.nama_kader,
                sk.nomor_sk
            FROM users u
            JOIN relawan r ON u.user_id = r.user_id
            LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
            LEFT JOIN opd o ON pr.opd_id = o.opd_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            LEFT JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
            WHERE (u.user_id = $1 OR r.relawan_id = $1) AND u.role = 'relawan'
        `, [id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data relawan tidak ditemukan' });
            return;
        }

        const baseData = {
            id: result.rows[0].relawan_id,
            user_id: result.rows[0].user_id,
            nik: result.rows[0].nik,
            nama_lengkap: result.rows[0].nama_lengkap,
            no_hp: result.rows[0].no_hp,
            foto_profil: result.rows[0].foto_profil,
            status_keaktifan: result.rows[0].status_keaktifan,
            relawan_id: result.rows[0].relawan_id,
            jenis_kelamin: result.rows[0].jenis_kelamin,
            alamat_ktp: result.rows[0].alamat_ktp,
            kemantren: result.rows[0].kemantren,
            kelurahan: result.rows[0].kelurahan,
            assignments: [] as any[]
        };

        for (const row of result.rows) {
            if (row.penugasan_id) {
                baseData.assignments.push({
                    penugasan_id: row.penugasan_id,
                    penugasan: row.penugasan,
                    jabatan: row.jabatan,
                    detail_jabatan: row.detail_jabatan,
                    status_keaktifan: row.status_penugasan,
                    nomor_sk: row.nomor_sk,
                    sk_id: row.sk_id,
                    opd_id: row.opd_id,
                    kader_id: row.kader_id,
                    nama_opd: row.nama_opd,
                    nama_kader: row.nama_kader
                });
            }
        }

        res.status(200).json({ success: true, message: 'Berhasil mengambil detail relawan', data: baseData });
    } catch (error: any) {
        console.error('Error in getRelawanById:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET PENGAJUAN PERUBAHAN DATA (Antrian Review Prioritas)
// ─────────────────────────────────────────────────────────────────────────────
export const getPengajuanPerubahanDaftar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limitParam = req.query.limit ? parseInt(req.query.limit as string) : null;
        const limit = limitParam && limitParam > 0 ? limitParam : null;
        const offset = limit ? (page - 1) * limit : 0;
        const statusFilter = req.query.status as string;
        const search = req.query.q as string;

        let whereClause = `WHERE 1=1`;
        const values: any[] = [];
        let paramIndex = 1;

        if (statusFilter && statusFilter.trim() !== '') {
            whereClause += ` AND pp.status_pengajuan = $${paramIndex}`;
            values.push(statusFilter.trim());
            paramIndex++;
        }

        if (search && search.trim() !== '') {
            whereClause += ` AND (u.nama_lengkap ILIKE $${paramIndex} OR u.nik ILIKE $${paramIndex} OR pp.jenis_perubahan ILIKE $${paramIndex})`;
            values.push(`%${search.trim()}%`);
            paramIndex++;
        }

        const countQuery = `
            SELECT COUNT(*) as total
            FROM pengajuan_perubahan_data pp
            JOIN relawan r ON pp.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            ${whereClause}
        `;
        const countResult = await executeQueryWithContext(countQuery, values, req.user);
        const totalRecords = parseInt(countResult.rows[0]?.total || '0', 10);
        const totalPages = limit ? Math.ceil(totalRecords / limit) : 1;

        let query = `
            SELECT 
                pp.pengajuan_id, pp.jenis_perubahan, pp.status_pengajuan, pp.tanggal_pengajuan,
                pp.catatan_relawan, pp.data_baru, pp.data_lama,
                u.nama_lengkap, u.nik, r.relawan_id
            FROM pengajuan_perubahan_data pp
            JOIN relawan r ON pp.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            ${whereClause}
            ORDER BY 
                CASE WHEN pp.status_pengajuan = 'Menunggu Review' THEN 0 ELSE 1 END,
                pp.tanggal_pengajuan DESC
        `;

        if (limit) {
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            values.push(limit, offset);
        }

        const result = await executeQueryWithContext(query, values, req.user);
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil antrian pengajuan',
            data: result.rows,
            pagination: {
                total_records: totalRecords,
                total_pages: totalPages,
                current_page: page,
                limit_per_page: limit || totalRecords,
                has_next_page: limit ? page < totalPages : false,
                has_prev_page: page > 1
            }
        });
    } catch (error: any) {
        console.error('Error in getPengajuanPerubahanDaftar:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. REVIEW PENGAJUAN (Approve / Reject)
// Alur:
// 1. Ambil data pengajuan yang statusnya 'Menunggu Review'
// 2. Jika Disetujui:
//    a. Parse data_baru (JSON)
//    b. Update nama_lengkap di tabel users
//    c. Update alamat_ktp di tabel relawan
// 3. Update status pengajuan di tabel pengajuan_perubahan_data
// ─────────────────────────────────────────────────────────────────────────────
export const reviewPengajuan = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, catatan_verifikator } = req.body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
        res.status(400).json({ success: false, message: "Status harus 'Disetujui' atau 'Ditolak'" });
        return;
    }

    const statusDB = status === 'Disetujui' ? 'Diterima' : 'Ditolak';
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await setClientContext(client, req.user!);

        const pengajuanRes = await client.query(
            `SELECT * FROM pengajuan_perubahan_data WHERE pengajuan_id = $1 AND status_pengajuan = 'Menunggu Review'`,
            [id]
        );
        if (pengajuanRes.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan atau sudah direview' });
            return;
        }

        const pengajuan = pengajuanRes.rows[0];

        let dataBaru = null;
        if (status === 'Disetujui' && pengajuan.data_baru) {
            try {
                dataBaru = typeof pengajuan.data_baru === 'string'
                    ? JSON.parse(pengajuan.data_baru) : pengajuan.data_baru;
            } catch (parseError) {
                await client.query('ROLLBACK');
                res.status(400).json({ success: false, message: 'Data perubahan (data_baru) rusak atau tidak valid' });
                return;
            }
        }

        await client.query(`
            UPDATE pengajuan_perubahan_data 
            SET status_pengajuan = $1, catatan_verifikator = $2,
                tanggal_verifikasi = CURRENT_TIMESTAMP, verifikator_id = $3
            WHERE pengajuan_id = $4
        `, [statusDB, catatan_verifikator || null, req.user!.id, id]);

        if (status === 'Disetujui' && dataBaru) {
            if (dataBaru.nama_lengkap) {
                await client.query(
                    `UPDATE users SET nama_lengkap = $1 WHERE user_id = (SELECT user_id FROM relawan WHERE relawan_id = $2)`,
                    [dataBaru.nama_lengkap, pengajuan.relawan_id]
                );
            }
            if (dataBaru.alamat_ktp) {
                await client.query(
                    `UPDATE relawan SET alamat_ktp = $1 WHERE relawan_id = $2`,
                    [dataBaru.alamat_ktp, pengajuan.relawan_id]
                );
            }
            if (dataBaru.kemantren) {
                await client.query(
                    `UPDATE relawan SET kemantren = $1 WHERE relawan_id = $2`,
                    [dataBaru.kemantren, pengajuan.relawan_id]
                );
            }
            if (dataBaru.kelurahan) {
                await client.query(
                    `UPDATE relawan SET kelurahan = $1 WHERE relawan_id = $2`,
                    [dataBaru.kelurahan, pengajuan.relawan_id]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: `Pengajuan berhasil ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}` });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in reviewPengajuan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. CREATE RELAWAN (Single Form)
// Membuat relawan baru beserta penugasannya dalam satu transaksi.
// Password default = NIK (untuk login pertama)
// ─────────────────────────────────────────────────────────────────────────────
export const createRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const nik           = req.body.nik;
    const nama_lengkap  = req.body.nama_lengkap || req.body.namaLengkap;
    const alamat_ktp    = req.body.alamat_ktp || req.body.alamat;
    const kemantren     = req.body.kemantren;
    const kelurahan     = req.body.kelurahan;
    const jenis_kelamin = req.body.jenis_kelamin || req.body.jenisKelamin || 'L';
    const no_hp         = req.body.no_hp || req.body.noHp || null;
    const assignmentsToProcess: any[] = req.body.assignments?.length > 0 ? req.body.assignments : [];

    if (!nik || !nama_lengkap) {
        res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
        return;
    }
    if (!/^\d{16}$/.test(nik)) {
        res.status(400).json({ success: false, message: 'NIK harus terdiri dari tepat 16 digit angka' });
        return;
    }
    if (nama_lengkap.length < 3) {
        res.status(400).json({ success: false, message: 'Nama Lengkap minimal 3 karakter' });
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nama_lengkap)) {
        res.status(400).json({ success: false, message: 'Nama Lengkap tidak boleh mengandung angka atau karakter spesial' });
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
            INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
            VALUES ($1,$2,$3,$4,'relawan',true) RETURNING user_id
        `, [nik, nama_lengkap, no_hp, hashedPassword]);
        const userId = userRes.rows[0].user_id;

        const relawanRes = await client.query(`
            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kemantren, kelurahan)
            VALUES ($1,$2,$3,$4,$5) RETURNING relawan_id
        `, [userId, jenis_kelamin, alamat_ktp || '-', kemantren || '-', kelurahan || '-']);
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
// 6. CREATE / UPDATE BULK RELAWAN (Excel Import)
//
// Strategi Upsert:
// - NIK sudah ada di users → UPDATE profil user + relawan
//   - UPDATE nama_lengkap, no_hp di tabel users
//   - UPDATE jenis_kelamin, alamat_ktp, kelurahan di tabel relawan
// - NIK baru → INSERT user + relawan baru
//   - Password default = NIK (di-hash dengan bcrypt + pepper)
//
// Penugasan:
// - Jika relawan sudah punya penugasan di OPD yang sama → UPDATE
// - Jika belum → INSERT penugasan baru
//
// Setiap baris Excel diproses dalam transaksi terpisah.
// Baris gagal tidak mempengaruhi baris lain.
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
            kemantren:     get('kemantren',     ['kemantren', 'kecamatan']).trim() || '-',
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
            if (!/^\d{16}$/.test(item.nik)) {
                errors.push(`Baris ${rowNumber} dilewati: NIK "${item.nik}" harus 16 digit angka.`);
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
                                kemantren    = $3,
                                kelurahan    = $4,
                                updated_at   = CURRENT_TIMESTAMP
                            WHERE relawan_id = $5
                            RETURNING relawan_id
                        `, [item.jenisKelamin, item.alamat, item.kemantren, item.kelurahan, relawanId]);

                        if ((updateR.rowCount ?? 0) > 0) {
                            updatedProfileCount++;
                        } else {
                            errors.push(`Baris ${rowNumber}: Profil '${item.namaLengkap}' gagal diperbarui (RLS/permission).`);
                        }
                    } else {
                        const r = await client.query(`
                            INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kemantren, kelurahan)
                            VALUES ($1,$2,$3,$4,$5) RETURNING relawan_id
                        `, [userId, item.jenisKelamin, item.alamat, item.kemantren, item.kelurahan]);
                        relawanId = r.rows[0].relawan_id;
                        updatedProfileCount++;
                    }
                } else {
                    // ── NIK baru → INSERT user + relawan ───────────────────────
                    const hashedPassword = await bcrypt.hash(item.nik + (process.env.PASSWORD_PEPPER || ''), await bcrypt.genSalt(10));
                    const uRes = await client.query(`
                        INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                        VALUES ($1,$2,$3,$4,'relawan',true) RETURNING user_id
                    `, [item.nik, item.namaLengkap, item.noHp, hashedPassword]);
                    userId = uRes.rows[0].user_id;

                    const rRes = await client.query(`
                        INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kemantren, kelurahan)
                        VALUES ($1,$2,$3,$4,$5) RETURNING relawan_id
                    `, [userId, item.jenisKelamin, item.alamat, item.kemantren, item.kelurahan]);
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
        if (errors.length > 0) {
            const examples = errors.slice(0, 2).join(' | ');
            parts.push(`${errors.length} peringatan. Contoh: ${examples}${errors.length > 2 ? ' | ...' : ''}`);
        }

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
// 7. GET KADER BY OPD (untuk dropdown di form)
// Mengambil daftar kader. Filter by opd_id opsional.
// ─────────────────────────────────────────────────────────────────────────────
export const getkaderByOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        const result = opd_id
            ? await executeQueryWithContext(`SELECT kader_id, kader_id AS id, nama_kader, nama_kader AS nama, opd_id, status_keaktifan, sk_id FROM kader WHERE opd_id = $1 ORDER BY nama_kader`, [opd_id], req.user)
            : await executeQueryWithContext(`SELECT kader_id, kader_id AS id, nama_kader, nama_kader AS nama, opd_id, status_keaktifan, sk_id FROM kader ORDER BY nama_kader`, [], req.user);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getkaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. UPDATE RELAWAN (Form Edit)
// Memperbarui data relawan (nama, alamat, jenis kelamin) dan
// penugasannya (tambah/edit/hapus assignment).
// ─────────────────────────────────────────────────────────────────────────────
export const updateRelawan = async (req: AuthRequest, res: Response): Promise<void> => {
    const relawanId = parseInt(req.params.relawan_id as string);
    if (isNaN(relawanId)) {
        res.status(400).json({ success: false, message: 'ID Relawan tidak valid.' });
        return;
    }
    const { nama_lengkap, alamat_ktp, kemantren, kelurahan, jenis_kelamin, assignments } = req.body;

    const client = await pool.connect();
    try {
        if (nama_lengkap) {
            if (nama_lengkap.length < 3) {
                res.status(400).json({ success: false, message: 'Nama Lengkap minimal 3 karakter' });
                return;
            }
            if (!/^[a-zA-Z\s]+$/.test(nama_lengkap)) {
                res.status(400).json({ success: false, message: 'Nama Lengkap tidak boleh mengandung angka atau karakter spesial' });
                return;
            }
        }
        await client.query('BEGIN');
        await setClientContext(client, req.user!);

        await client.query(`
            UPDATE relawan SET alamat_ktp = $1, kemantren = $2, kelurahan = $3, jenis_kelamin = $4, updated_at = CURRENT_TIMESTAMP
            WHERE relawan_id = $5
        `, [alamat_ktp, kemantren, kelurahan, jenis_kelamin, relawanId]);

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
// 9. DELETE PENUGASAN
// Menghapus penugasan relawan (bukan menghapus relawan-nya).
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