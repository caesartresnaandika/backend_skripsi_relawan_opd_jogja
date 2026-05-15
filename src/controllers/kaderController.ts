//kaderController
import pool from '../../config/db';
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { OpdAuthRequest } from '../middleware/opdMiddleware';

// ── RLS context helpers ──────────────────────────────────────────────────────
const setClientContextAdmin = async (client: any, user: NonNullable<AuthRequest['user']>) => {
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [user.id.toString()]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [user.role]);
    await client.query("SELECT set_config('app.current_opd_id', $1, true)", [(user.opd_id ?? 0).toString()]);
};

const setClientContextOpd = async (client: any, user: NonNullable<OpdAuthRequest['user']>, opdId?: number) => {
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [user.id.toString()]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [user.role]);
    await client.query("SELECT set_config('app.current_opd_id', $1, true)", [(opdId ?? user.opd_id ?? 0).toString()]);
};

// ============================================================
// SUPER ADMIN — dipakai via /api/kader (kaderRoutes.ts)
// ============================================================

export const getAllKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id } = req.query;
    try {
        let query: string;
        let params: any[];
        if (opd_id) {
            query = `
                SELECT
                    k.kader_id, k.kader_id AS id, k.nama_kader, k.nama_kader AS nama, k.deskripsi, k.opd_id,
                    k.status_keaktifan, k.sk_id, k.created_at, k.updated_at, o.nama_opd,
                    u.nama_lengkap AS pic_nama,
                    u.nik          AS pic_nik,
                    u.no_hp        AS pic_no_hp,
                    pk.relawan_id  AS pic_relawan_id,
                    pk.tanggal_mulai AS pic_tanggal_mulai
                FROM kader k
                JOIN opd o ON k.opd_id = o.opd_id
                LEFT JOIN pic_kader pk ON k.kader_id = pk.kader_id AND pk.status = 'Aktif'
                LEFT JOIN relawan r  ON pk.relawan_id = r.relawan_id
                LEFT JOIN users u    ON r.user_id = u.user_id
                WHERE k.opd_id = $1
                ORDER BY k.created_at DESC;
            `;
            params = [opd_id];
        } else {
            query = `
                SELECT
                    k.kader_id, k.kader_id AS id, k.nama_kader, k.nama_kader AS nama, k.deskripsi, k.opd_id,
                    k.status_keaktifan, k.sk_id, k.created_at, k.updated_at, o.nama_opd,
                    u.nama_lengkap AS pic_nama,
                    u.nik          AS pic_nik,
                    u.no_hp        AS pic_no_hp,
                    pk.relawan_id  AS pic_relawan_id,
                    pk.tanggal_mulai AS pic_tanggal_mulai
                FROM kader k
                JOIN opd o ON k.opd_id = o.opd_id
                LEFT JOIN pic_kader pk ON k.kader_id = pk.kader_id AND pk.status = 'Aktif'
                LEFT JOIN relawan r  ON pk.relawan_id = r.relawan_id
                LEFT JOIN users u    ON r.user_id = u.user_id
                ORDER BY k.created_at DESC;
            `;
            params = [];
        }
        const result = await executeQueryWithContext(query, params, req.user);
        res.status(200).json({ success: true, message: 'Berhasil mengambil daftar kader', data: result.rows });
    } catch (error: any) {
        console.error('Error in getAllKader:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const getKaderById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                k.kader_id, k.kader_id AS id, k.nama_kader, k.nama_kader AS nama, k.deskripsi, k.opd_id,
                k.status_keaktifan, k.sk_id, k.created_at, k.updated_at, o.nama_opd,
                u.nama_lengkap AS pic_nama,
                u.nik          AS pic_nik,
                u.no_hp        AS pic_no_hp,
                pk.relawan_id  AS pic_relawan_id,
                pk.tanggal_mulai AS pic_tanggal_mulai
            FROM kader k
            JOIN opd o ON k.opd_id = o.opd_id
            LEFT JOIN pic_kader pk ON k.kader_id = pk.kader_id AND pk.status = 'Aktif'
            LEFT JOIN relawan r  ON pk.relawan_id = r.relawan_id
            LEFT JOIN users u    ON r.user_id = u.user_id
            WHERE k.kader_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Berhasil mengambil detail kader', data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in getKaderById:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const createKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { opd_id, nama_kader, deskripsi, nik_pic, nama_pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;

    // Validasi wajib
    if (!opd_id || !nama_kader) {
        res.status(400).json({ success: false, message: 'Field opd_id dan nama_kader wajib diisi' });
        return;
    }
    if (nama_kader.length < 3) {
        res.status(400).json({ success: false, message: 'Nama Kader minimal 3 karakter' });
        return;
    }
    if (nama_kader.length > 100) {
        res.status(400).json({ success: false, message: 'Nama Kader tidak boleh lebih dari 100 karakter' });
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nama_kader)) {
        res.status(400).json({ success: false, message: 'Nama Kader tidak boleh mengandung angka atau karakter spesial' });
        return;
    }
    if (nama_pic) {
        if (nama_pic.length < 3) {
            res.status(400).json({ success: false, message: 'Nama PIC minimal 3 karakter' });
            return;
        }
        if (nama_pic.length > 100) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh lebih dari 100 karakter' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(nama_pic)) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh mengandung angka atau karakter spesial' });
            return;
        }
    }
    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }
    if (!/^\d{16}$/.test(String(nik_pic))) {
        res.status(400).json({ success: false, message: 'NIK PIC harus terdiri dari tepat 16 digit angka' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContextAdmin(client, req.user!);  // ← wajib untuk RLS

        // ── LANGKAH 1: Cari atau buat user + relawan dari NIK PIC ──
        let relawanId: number;

        const checkUser = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik_pic]);

        if (checkUser.rows.length > 0) {
            // NIK sudah ada di users
            const userId = checkUser.rows[0].user_id;
            const checkRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);

            if (checkRelawan.rows.length > 0) {
                // Sudah jadi relawan → pakai langsung
                relawanId = checkRelawan.rows[0].relawan_id;
            } else {
                // Ada di users tapi belum ada di relawan → buat profil relawan
                const relawanRes = await client.query(
                    `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                     VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                    [userId, alamat_pic || '-', kelurahan_pic || '-']
                );
                relawanId = relawanRes.rows[0].relawan_id;
            }
        } else {
            // NIK belum ada → buat user baru + relawan baru
            const bcrypt = await import('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(String(nik_pic) + (process.env.PASSWORD_PEPPER || ''), salt);

            const userRes = await client.query(
                `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                 VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id`,
                [nik_pic, nama_pic || '-', no_hp_pic || null, hashedPassword]
            );
            const userId = userRes.rows[0].user_id;

            const relawanRes = await client.query(
                `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                 VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                [userId, alamat_pic || '-', kelurahan_pic || '-']
            );
            relawanId = relawanRes.rows[0].relawan_id;
        }

        // ── LANGKAH 2: INSERT kader (tanpa kolom PIC) ──
        const kaderRes = await client.query(
            `INSERT INTO kader (opd_id, nama_kader, deskripsi, status_keaktifan) VALUES ($1, $2, $3, true) RETURNING kader_id, nama_kader`,
            [opd_id, nama_kader, deskripsi || null]
        );
        const kaderId = kaderRes.rows[0].kader_id;

        // ── LANGKAH 3: INSERT ke pic_kader ──
        await client.query(
            `INSERT INTO pic_kader (relawan_id, kader_id, tanggal_mulai, status)
             VALUES ($1, $2, CURRENT_DATE, 'Aktif')`,
            [relawanId, kaderId]
        );

        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: `Kader berhasil ditambahkan dengan PIC (NIK: ${nik_pic})`,
            data: kaderRes.rows[0]
        });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('FULL ERROR in createKader:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code === '23505') errorMessage = 'Nama kader sudah digunakan di OPD yang sama';
        if (error.code === '23503') errorMessage = 'OPD yang dipilih tidak ditemukan';
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    } finally {
        client.release();
    }
};

export const updateKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_kader, deskripsi } = req.body;
    if (!nama_kader) {
        res.status(400).json({ success: false, message: 'Field nama_kader wajib diisi' });
        return;
    }
    if (nama_kader.length < 3) {
        res.status(400).json({ success: false, message: 'Nama Kader minimal 3 karakter' });
        return;
    }
    if (nama_kader.length > 100) {
        res.status(400).json({ success: false, message: 'Nama Kader tidak boleh lebih dari 100 karakter' });
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nama_kader)) {
        res.status(400).json({ success: false, message: 'Nama Kader tidak boleh mengandung angka atau karakter spesial' });
        return;
    }
    try {
        const result = await executeQueryWithContext(
            `UPDATE kader SET nama_kader = $1, deskripsi = $2, updated_at = CURRENT_TIMESTAMP
             WHERE kader_id = $3 RETURNING kader_id, nama_kader, deskripsi;`,
            [nama_kader, deskripsi || null, id], req.user
        );
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Berhasil memperbarui kader', data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in updateKader:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const deleteKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await executeQueryWithContext(`DELETE FROM kader WHERE kader_id = $1 RETURNING kader_id;`, [id], req.user);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Berhasil menghapus kader' });
    } catch (error: any) {
        console.error('Error in deleteKader:', error.message);
        if (error.code === '23503') {
            res.status(400).json({ success: false, message: 'Kader tidak dapat dihapus karena masih memiliki relawan aktif' });
            return;
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const toggleKaderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status_keaktifan } = req.body;

    if (status_keaktifan === undefined) {
        res.status(400).json({ success: false, message: 'Field status_keaktifan wajib diisi' });
        return;
    }

    try {
        // ── Validasi hanya saat MENONAKTIFKAN ──
        if (!status_keaktifan) {
            // Otomatis menonaktifkan semua penugasan relawan di bawah kader ini
            await executeQueryWithContext(`
                UPDATE penugasan_relawan 
                SET status_keaktifan = 'Tidak Aktif', updated_at = CURRENT_TIMESTAMP
                WHERE kader_id = $1 AND status_keaktifan = 'Aktif'
            `, [id], req.user);
        }

        // ── Update status ──
        const result = await executeQueryWithContext(`
            UPDATE kader SET status_keaktifan = $1, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $2
            RETURNING kader_id, nama_kader, status_keaktifan;
        `, [status_keaktifan, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        const statusText = result.rows[0].status_keaktifan ? 'diaktifkan' : 'dinonaktifkan';
        res.status(200).json({
            success: true,
            message: `Kader ${result.rows[0].nama_kader} berhasil ${statusText}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in toggleKaderStatus:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

export const createBulkKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ success: false, message: 'Data harus berupa array yang tidak kosong' });
        return;
    }

    const inserted: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    // Ambil client khusus untuk eksekusi transaksi
    const client = await pool.connect();

    try {
        for (let i = 0; i < data.length; i++) {
            const rawItem = data[i];
            const rowNumber = i + 1;

            // ── 1. Fuzzy Key Normalization (Menangani spasi & Case Insensitive) ──
            const item: Record<string, any> = {};
            for (const key of Object.keys(rawItem)) {
                const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                item[cleanKey] = rawItem[key];
            }

            const getVal = (possibleKeys: string[]) => {
                for (const key of possibleKeys) {
                    if (item[key] !== undefined) return String(item[key]);
                }
                return '';
            };

            const namaKader = getVal(['namakader', 'kader', 'nama']).trim();
            const namaOpd = getVal(['opd', 'namaopd', 'instansi']).trim();
            const nikPic = getVal(['nikpic', 'nik', 'picnik']).trim();
            const pic = getVal(['pic', 'namapic', 'penanggungjawab']).trim() || null;
            const deskripsi = getVal(['deskripsi', 'keterangan']).trim() || null;
            const noHpPic = getVal(['nohppic', 'nohp', 'notelp']).trim() || null;
            const alamatPic = getVal(['alamatpic', 'alamat']).trim() || null;
            const kelurahanPic = getVal(['kelurahanpic', 'kelurahan']).trim() || null;

            // ── 2. Validasi Dasar ──
            if (!namaKader) {
                errors.push(`Baris ${rowNumber}: Nama Kader kosong`);
                continue;
            }
            if (!namaOpd) {
                errors.push(`Baris ${rowNumber} ("${namaKader}"): OPD kosong`);
                continue;
            }
            if (!nikPic || !/^\d{16}$/.test(nikPic)) {
                errors.push(`Baris ${rowNumber} ("${namaKader}"): NIK PIC harus 16 digit angka (terdeteksi: "${nikPic}")`);
                continue;
            }

            // ── 3. TRANSAKSI DATABASE PER BARIS DIMULAI ──
            try {
                await client.query('BEGIN');
                await setClientContextAdmin(client, req.user!);  // ← wajib untuk RLS

                // Validasi OPD
                const opdCheck = await client.query(
                    `SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) AND status_keaktifan = true LIMIT 1`,
                    [namaOpd]
                );
                if (opdCheck.rows.length === 0) {
                    errors.push(`Baris ${rowNumber} ("${namaKader}"): OPD "${namaOpd}" tidak ditemukan/tidak aktif.`);
                    await client.query('ROLLBACK');
                    continue;
                }
                const opdId = opdCheck.rows[0].opd_id;

                // ── Cari atau buat relawan dari NIK PIC ──
                let relawanId: number;
                const checkUser = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nikPic]);

                if (checkUser.rows.length > 0) {
                    const userId = checkUser.rows[0].user_id;
                    const checkRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);
                    if (checkRelawan.rows.length > 0) {
                        relawanId = checkRelawan.rows[0].relawan_id;
                    } else {
                        const relawanRes = await client.query(
                            `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                             VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                            [userId, alamatPic || '-', kelurahanPic || '-']
                        );
                        relawanId = relawanRes.rows[0].relawan_id;
                    }
                } else {
                    const bcrypt = await import('bcrypt');
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(nikPic + (process.env.PASSWORD_PEPPER || ''), salt);
                    const userRes = await client.query(
                        `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                         VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id`,
                        [nikPic, pic || '-', noHpPic || null, hashedPassword]
                    );
                    const userId = userRes.rows[0].user_id;
                    const relawanRes = await client.query(
                        `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                         VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                        [userId, alamatPic || '-', kelurahanPic || '-']
                    );
                    relawanId = relawanRes.rows[0].relawan_id;
                }

                // ── INSERT kader (tanpa kolom PIC) ──
                const kaderRes = await client.query(
                    `INSERT INTO kader (opd_id, nama_kader, deskripsi, status_keaktifan) VALUES ($1, $2, $3, true) RETURNING kader_id`,
                    [opdId, namaKader, deskripsi]
                );
                const kaderId = kaderRes.rows[0].kader_id;

                // ── INSERT pic_kader ──
                await client.query(
                    `INSERT INTO pic_kader (relawan_id, kader_id, tanggal_mulai, status)
                     VALUES ($1, $2, CURRENT_DATE, 'Aktif')`,
                    [relawanId, kaderId]
                );

                await client.query('COMMIT');
                inserted.push(namaKader);

            } catch (rowError: any) {
                await client.query('ROLLBACK');
                console.error(`Error processing row ${rowNumber}:`, rowError);
                errors.push(`Baris ${rowNumber} ("${namaKader}") gagal: ${rowError.message}`);
            }
        }

        const totalOk = inserted.length;
        const parts: string[] = [`Berhasil menambahkan ${totalOk} kader baru.`];
        if (skipped.length > 0) parts.push(`${skipped.length} baris dilewati (NIK sudah ada).`);
        if (errors.length > 0) parts.push(`${errors.length} baris bermasalah (cek detail).`);

        res.status(totalOk > 0 ? 201 : 400).json({
            success: totalOk > 0,
            message: parts.join(' '),
            data: { insertedCount: totalOk, skipped, errors }
        });

    } catch (fatalError: any) {
        console.error('Error in createBulkKader:', fatalError);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat import Excel', errorDetail: fatalError.message });
    } finally {
        client.release(); // WAJIB kembalikan koneksi ke pool
    }
};

// ============================================================
// OPD ADMIN — dipakai via /api/opd-admin/kader (opdAdminRoutes.ts)
// ============================================================

export const getKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT
                k.kader_id, k.kader_id AS id, k.nama_kader, k.nama_kader AS nama, k.deskripsi, k.opd_id,
                k.status_keaktifan, k.sk_id, k.created_at, k.updated_at, o.nama_opd,
                u.nama_lengkap AS pic_nama,
                u.nik          AS pic_nik,
                u.no_hp        AS pic_no_hp,
                pk.relawan_id  AS pic_relawan_id,
                pk.tanggal_mulai AS pic_tanggal_mulai,
                COUNT(pr.relawan_id) AS jumlah_anggota
            FROM kader k
            JOIN opd o ON k.opd_id = o.opd_id
            LEFT JOIN pic_kader pk ON k.kader_id = pk.kader_id AND pk.status = 'Aktif'
            LEFT JOIN relawan r  ON pk.relawan_id = r.relawan_id
            LEFT JOIN users u    ON r.user_id = u.user_id
            LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id AND pr.status_keaktifan = 'Aktif'
            WHERE k.opd_id = $1
            GROUP BY k.kader_id, o.nama_opd, u.nama_lengkap, u.nik, u.no_hp, pk.relawan_id, pk.tanggal_mulai
            ORDER BY k.nama_kader ASC
        `, [opdId], req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const opdId = req.opd_id;
    const { nama_kader, deskripsi, nik_pic, nama_pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;

    if (!nama_kader) {
        res.status(400).json({ success: false, message: 'Nama kader wajib diisi' });
        return;
    }
    if (nama_kader.length < 3) {
        res.status(400).json({ success: false, message: 'Nama Kader minimal 3 karakter' });
        return;
    }
    if (nama_kader.length > 100) {
        res.status(400).json({ success: false, message: 'Nama Kader tidak boleh lebih dari 100 karakter' });
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nama_kader)) {
        res.status(400).json({ success: false, message: 'Nama Kader tidak boleh mengandung angka atau karakter spesial' });
        return;
    }
    if (nama_pic) {
        if (nama_pic.length < 3) {
            res.status(400).json({ success: false, message: 'Nama PIC minimal 3 karakter' });
            return;
        }
        if (nama_pic.length > 100) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh lebih dari 100 karakter' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(nama_pic)) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh mengandung angka atau karakter spesial' });
            return;
        }
    }
    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }
    if (!/^\d{16}$/.test(String(nik_pic))) {
        res.status(400).json({ success: false, message: 'NIK PIC harus terdiri dari tepat 16 digit angka' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await setClientContextOpd(client, req.user!, opdId);  // ← wajib untuk RLS

        let relawanId: number;
        const checkUser = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik_pic]);

        if (checkUser.rows.length > 0) {
            const userId = checkUser.rows[0].user_id;
            const checkRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);
            if (checkRelawan.rows.length > 0) {
                relawanId = checkRelawan.rows[0].relawan_id;
            } else {
                const relawanRes = await client.query(
                    `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                     VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                    [userId, alamat_pic || '-', kelurahan_pic || '-']
                );
                relawanId = relawanRes.rows[0].relawan_id;
            }
        } else {
            const bcrypt = await import('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(String(nik_pic) + (process.env.PASSWORD_PEPPER || ''), salt);
            const userRes = await client.query(
                `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                 VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id`,
                [nik_pic, nama_pic || '-', no_hp_pic || null, hashedPassword]
            );
            const userId = userRes.rows[0].user_id;
            const relawanRes = await client.query(
                `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                 VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                [userId, alamat_pic || '-', kelurahan_pic || '-']
            );
            relawanId = relawanRes.rows[0].relawan_id;
        }

        // ── INSERT kader (tanpa kolom PIC) ──
        const kaderRes = await client.query(
            `INSERT INTO kader (opd_id, nama_kader, deskripsi, status_keaktifan) VALUES ($1, $2, $3, true) RETURNING kader_id, nama_kader`,
            [opdId, nama_kader, deskripsi || null]
        );
        const kaderId = kaderRes.rows[0].kader_id;

        // ── INSERT pic_kader ──
        await client.query(
            `INSERT INTO pic_kader (relawan_id, kader_id, tanggal_mulai, status)
             VALUES ($1, $2, CURRENT_DATE, 'Aktif')`,
            [relawanId, kaderId]
        );

        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: `Kader berhasil ditambahkan dengan PIC (NIK: ${nik_pic})`,
            data: kaderRes.rows[0]
        });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in createKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error', error_dev: error.message });
    } finally {
        client.release();
    }
};

export const updateKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);
        const { nama_kader, deskripsi } = req.body;

        if (!nama_kader) {
            res.status(400).json({ success: false, message: 'Nama kader wajib diisi' });
            return;
        }
        if (nama_kader.length < 3) {
            res.status(400).json({ success: false, message: 'Nama Kader minimal 3 karakter' });
            return;
        }
        if (nama_kader.length > 100) {
            res.status(400).json({ success: false, message: 'Nama Kader tidak boleh lebih dari 100 karakter' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(nama_kader)) {
            res.status(400).json({ success: false, message: 'Nama Kader tidak boleh mengandung angka atau karakter spesial' });
            return;
        }

        const findQuery = await executeQueryWithContext(
            `SELECT kader_id FROM kader WHERE kader_id = $1 AND opd_id = $2`, [kaderId, opdId], req.user
        );
        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan di instansi Anda' });
            return;
        }

        const result = await executeQueryWithContext(`
            UPDATE kader SET nama_kader = $1, deskripsi = $2, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $3 RETURNING kader_id, nama_kader, deskripsi
        `, [nama_kader, deskripsi || null, kaderId], req.user);

        res.status(200).json({ success: true, message: 'Data kader berhasil diperbarui', data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in updateKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);

        const findQuery = await executeQueryWithContext(
            `SELECT kader_id FROM kader WHERE kader_id = $1 AND opd_id = $2`, [kaderId, opdId], req.user
        );
        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        await executeQueryWithContext(`DELETE FROM kader WHERE kader_id = $1 AND opd_id = $2`, [kaderId, opdId], req.user);
        res.status(200).json({ success: true, message: 'Kader berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deleteKaderByOpd:', error);
        if (error.code === '23503') {
            res.status(400).json({ success: false, message: 'Kader tidak dapat dihapus karena masih memiliki relawan aktif' });
            return;
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================================
// BULK CREATE OPD — dipakai via /api/opd-admin/kader/bulk
// ============================================================

export const createBulkKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const data = req.body;
    const opdId = req.opd_id;

    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ success: false, message: 'Data harus berupa array yang tidak kosong' });
        return;
    }

    const inserted: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];
    const client = await pool.connect();

    try {
        // ✨ FIXED: Cari tahu apa nama asli OPD yang sedang login ini
        const opdInfo = await client.query(`SELECT nama_opd FROM opd WHERE opd_id = $1`, [opdId]);
        const actualOpdName = opdInfo.rows[0].nama_opd.toLowerCase().replace(/[^a-z0-9]/g, '');

        for (let i = 0; i < data.length; i++) {
            const rawItem = data[i];
            const rowNumber = i + 1;

            // ── 1. Fuzzy Key Normalization (PINDAHKAN KE ATAS!) ──
            const item: Record<string, any> = {};
            for (const key of Object.keys(rawItem)) {
                item[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = rawItem[key];
            }

            // ✅ FIXED: PINDAHKAN getVal KE SINI (sebelum dipakai)
            const getVal = (possibleKeys: string[]) => {
                for (const key of possibleKeys) {
                    if (item[key] !== undefined) return String(item[key]);
                }
                return '';
            };

            // ── Sekarang aman pakai getVal ──
            const namaKader = getVal(['namakader', 'kader', 'nama']).trim();
            const namaOpd = getVal(['opd', 'namaopd', 'instansi']).trim();
            const namaOpdClean = namaOpd.toLowerCase().replace(/[^a-z0-9]/g, '');
            const nikPic = getVal(['nikpic', 'nik', 'picnik']).trim();
            const pic = getVal(['pic', 'namapic', 'penanggungjawab']).trim() || null;
            const deskripsi = getVal(['deskripsi', 'keterangan']).trim() || null;
            const noHpPic = getVal(['nohppic', 'nohp', 'notelp']).trim() || null;
            const alamatPic = getVal(['alamatpic', 'alamat']).trim() || null;
            const kelurahanPic = getVal(['kelurahanpic', 'kelurahan']).trim() || null;

            // ✨ FIXED: Validasi OPD
            if (namaOpdClean && namaOpdClean !== actualOpdName) {
                errors.push(`Baris ${rowNumber} ("${namaKader}"): Ditolak. Anda tidak diizinkan mengunggah data untuk Instansi "${namaOpd}".`);
                continue;
            }

            if (!namaKader) {
                errors.push(`Baris ${rowNumber}: Nama Kader kosong`);
                continue;
            }
            if (!nikPic || !/^\d{16}$/.test(nikPic)) {
                errors.push(`Baris ${rowNumber} ("${namaKader}"): NIK PIC harus 16 digit angka`);
                continue;
            }

            try {
                await client.query('BEGIN');
                await setClientContextOpd(client, req.user!, opdId);  // ← wajib untuk RLS

                // ── Cari atau buat relawan dari NIK PIC ──
                let relawanId: number;
                const checkUser = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nikPic]);

                if (checkUser.rows.length > 0) {
                    const userId = checkUser.rows[0].user_id;
                    const checkRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);
                    if (checkRelawan.rows.length > 0) {
                        relawanId = checkRelawan.rows[0].relawan_id;
                    } else {
                        const relawanRes = await client.query(
                            `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                             VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                            [userId, alamatPic || '-', kelurahanPic || '-']
                        );
                        relawanId = relawanRes.rows[0].relawan_id;
                    }
                } else {
                    const bcrypt = await import('bcrypt');
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(nikPic + (process.env.PASSWORD_PEPPER || ''), salt);
                    const userRes = await client.query(
                        `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                         VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id`,
                        [nikPic, pic || '-', noHpPic || null, hashedPassword]
                    );
                    const userId = userRes.rows[0].user_id;
                    const relawanRes = await client.query(
                        `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                         VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                        [userId, alamatPic || '-', kelurahanPic || '-']
                    );
                    relawanId = relawanRes.rows[0].relawan_id;
                }

                // ── INSERT kader (tanpa kolom PIC) ──
                const kaderRes = await client.query(
                    `INSERT INTO kader (opd_id, nama_kader, deskripsi, status_keaktifan) VALUES ($1, $2, $3, true) RETURNING kader_id`,
                    [opdId, namaKader, deskripsi]
                );
                const kaderId = kaderRes.rows[0].kader_id;

                // ── INSERT pic_kader ──
                await client.query(
                    `INSERT INTO pic_kader (relawan_id, kader_id, tanggal_mulai, status)
                     VALUES ($1, $2, CURRENT_DATE, 'Aktif')`,
                    [relawanId, kaderId]
                );

                await client.query('COMMIT');
                inserted.push(namaKader);
            } catch (rowError: any) {
                await client.query('ROLLBACK');
                errors.push(`Baris ${rowNumber} ("${namaKader}") gagal: ${rowError.message}`);
            }
        }

        const totalOk = inserted.length;
        const parts: string[] = [`Berhasil menambahkan ${totalOk} kader.`];
        if (skipped.length > 0) parts.push(`${skipped.length} dilewati (NIK ada).`);
        if (errors.length > 0) parts.push(`${errors.length} bermasalah.`);

        res.status(totalOk > 0 ? 201 : 400).json({
            success: totalOk > 0,
            message: parts.join(' '),
            data: { insertedCount: totalOk, skipped, errors }
        });
    } catch (fatalError: any) {
        console.error('Error in createBulkKaderByOpd:', fatalError);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat import Excel' });
    } finally {
        client.release();
    }
};

// ============================================================
// ASSIGN PIC & HISTORI — dipakai oleh super_admin & opd
// ============================================================

export const assignPicKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const kaderId = parseInt(req.params.id as string);
    const { nik_pic, nama_pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;

    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }
    if (nama_pic) {
        if (nama_pic.length < 3) {
            res.status(400).json({ success: false, message: 'Nama PIC minimal 3 karakter' });
            return;
        }
        if (nama_pic.length > 100) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh lebih dari 100 karakter' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(nama_pic)) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh mengandung angka atau karakter spesial' });
            return;
        }
    }
    if (!/^\d{16}$/.test(String(nik_pic))) {
        res.status(400).json({ success: false, message: 'NIK PIC harus terdiri dari tepat 16 digit angka' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cek kader ada
        const kaderCheck = await client.query(`SELECT kader_id FROM kader WHERE kader_id = $1`, [kaderId]);
        if (kaderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        // ── Cari atau buat relawan dari NIK PIC ──
        let relawanId: number;
        const checkUser = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik_pic]);

        if (checkUser.rows.length > 0) {
            const userId = checkUser.rows[0].user_id;
            const checkRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);
            if (checkRelawan.rows.length > 0) {
                relawanId = checkRelawan.rows[0].relawan_id;
            } else {
                const relawanRes = await client.query(
                    `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                     VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                    [userId, alamat_pic || '-', kelurahan_pic || '-']
                );
                relawanId = relawanRes.rows[0].relawan_id;
            }
        } else {
            const bcrypt = await import('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(String(nik_pic) + (process.env.PASSWORD_PEPPER || ''), salt);
            const userRes = await client.query(
                `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                 VALUES ($1, $2, $3, $4, 'relawan', true) RETURNING user_id`,
                [nik_pic, nama_pic || '-', no_hp_pic || null, hashedPassword]
            );
            const userId = userRes.rows[0].user_id;
            const relawanRes = await client.query(
                `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                 VALUES ($1, 'L', $2, $3) RETURNING relawan_id`,
                [userId, alamat_pic || '-', kelurahan_pic || '-']
            );
            relawanId = relawanRes.rows[0].relawan_id;
        }

        // ── Nonaktifkan PIC lama ──
        await client.query(
            `UPDATE pic_kader
             SET status = 'Tidak Aktif', tanggal_selesai = CURRENT_DATE
             WHERE kader_id = $1 AND status = 'Aktif'`,
            [kaderId]
        );

        // ── Insert PIC baru ──
        await client.query(
            `INSERT INTO pic_kader (relawan_id, kader_id, tanggal_mulai, status)
             VALUES ($1, $2, CURRENT_DATE, 'Aktif')`,
            [relawanId, kaderId]
        );

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: `PIC kader berhasil diganti (NIK baru: ${nik_pic})` });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in assignPicKader:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', error_dev: error.message });
    } finally {
        client.release();
    }
};

export const getPicKaderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    const kaderId = parseInt(req.params.id as string);
    try {
        let query = `
            SELECT
                pk.pic_kader_id,
                pk.kader_id,
                pk.relawan_id,
                pk.tanggal_mulai,
                pk.tanggal_selesai,
                pk.status,
                pk.created_at,
                u.nama_lengkap  AS pic_nama,
                u.nik           AS pic_nik,
                u.no_hp         AS pic_no_hp
            FROM pic_kader pk
            JOIN relawan r ON pk.relawan_id = r.relawan_id
            JOIN users u   ON r.user_id = u.user_id
            JOIN kader k   ON pk.kader_id = k.kader_id
            WHERE pk.kader_id = $1
        `;
        const params: any[] = [kaderId];

        if (req.user?.role === 'opd') {
            const opdId = (req as any).opd_id || (req.user as any).opd_id;
            query += ` AND k.opd_id = $2`;
            params.push(opdId);
        }

        query += ` ORDER BY pk.created_at DESC`;

        const result = await executeQueryWithContext(query, params, req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getPicKaderHistory:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};