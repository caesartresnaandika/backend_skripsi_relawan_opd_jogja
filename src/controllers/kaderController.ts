//kaderController
import pool from '../../config/db';
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import bcrypt from 'bcrypt';

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
                SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic,
                       k.opd_id, k.is_active, k.created_at, k.updated_at, o.nama_opd,k.no_hp_pic, k.alamat_pic, k.kelurahan_pic
                FROM kader k JOIN opd o ON k.opd_id = o.opd_id
                WHERE k.opd_id = $1 ORDER BY k.created_at DESC;
            `;
            params = [opd_id];
        } else {
            query = `
                SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic,
                       k.opd_id, k.is_active, k.created_at, k.updated_at, o.nama_opd
                FROM kader k JOIN opd o ON k.opd_id = o.opd_id
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
            SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic,
                   k.opd_id, k.is_active, k.created_at, k.updated_at, o.nama_opd,k.no_hp_pic, k.alamat_pic, k.kelurahan_pic
            FROM kader k JOIN opd o ON k.opd_id = o.opd_id
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
    const { opd_id, nama_kader, deskripsi, pic, nik_pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;

    if (!opd_id || !nama_kader) {
        res.status(400).json({ success: false, message: 'Field opd_id dan nama_kader wajib diisi' });
        return;
    }
    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }
    if (String(nik_pic).length !== 16) {
        res.status(400).json({ success: false, message: 'NIK PIC harus 16 digit' });
        return;
    }

    try {
        const checkNik = await executeQueryWithContext(`SELECT user_id FROM users WHERE nik = $1`, [nik_pic], req.user);
        if (checkNik.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(nik_pic), salt);

        const userRes = await executeQueryWithContext(
            `INSERT INTO users (nik, nama_lengkap, password, role, is_active) VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id;`,
            [nik_pic, pic || nama_kader, hashedPassword], req.user
        );
        const userId = userRes.rows[0].user_id;

        const result = await executeQueryWithContext(
            `INSERT INTO kader (opd_id, nama_kader, deskripsi, pic, nik_pic, user_id, no_hp_pic, alamat_pic, kelurahan_pic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`,
            [opd_id, nama_kader, deskripsi || null, pic || null, nik_pic, userId, no_hp_pic || null, alamat_pic || null, kelurahan_pic || null], req.user
        );

        res.status(201).json({
            success: true,
            message: `Kader berhasil ditambahkan. Akun login PIC dibuat dengan NIK: ${nik_pic}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('FULL ERROR in createKader:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code === '23505') errorMessage = 'Nama kader sudah digunakan di OPD yang sama';
        if (error.code === '23503') errorMessage = 'OPD yang dipilih tidak ditemukan';
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    }
};

export const updateKader = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_kader, deskripsi, pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;
    if (!nama_kader) {
        res.status(400).json({ success: false, message: 'Field nama_kader wajib diisi' });
        return;
    }
    try {
        const result = await executeQueryWithContext(
            `UPDATE kader SET nama_kader = $1, deskripsi = $2, pic = $3, no_hp_pic = $4, alamat_pic = $5, kelurahan_pic = $6, updated_at = CURRENT_TIMESTAMP WHERE kader_id = $7 RETURNING *;`,
            [nama_kader, deskripsi || null, pic || null, no_hp_pic || null, alamat_pic || null, kelurahan_pic || null, id], req.user
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
    const { is_active } = req.body;

    if (is_active === undefined) {
        res.status(400).json({ success: false, message: 'Field is_active wajib diisi' });
        return;
    }

    try {
        // ── Validasi hanya saat MENONAKTIFKAN ──
        if (!is_active) {
            const cekRelawan = await executeQueryWithContext(`
                SELECT COUNT(*) as total
                FROM penugasan_relawan pr
                JOIN relawan r ON pr.relawan_id = r.relawan_id
                JOIN users u ON r.user_id = u.user_id
                WHERE pr.kader_id = $1
                  AND pr.status_keaktifan = 'Aktif'
                  AND u.is_active = true
            `, [id], req.user);

            const totalRelawan = parseInt(cekRelawan.rows[0].total, 10);
            if (totalRelawan > 0) {
                res.status(400).json({
                    success: false,
                    message: `Kader tidak dapat dinonaktifkan karena masih terdapat ${totalRelawan} relawan aktif di kader ini. Nonaktifkan relawan terlebih dahulu.`
                });
                return;
            }
        }

        // ── Update status ──
        const result = await executeQueryWithContext(`
            UPDATE kader SET is_active = $1, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $2
            RETURNING kader_id, nama_kader, is_active;
        `, [is_active, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        const statusText = result.rows[0].is_active ? 'diaktifkan' : 'dinonaktifkan';
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
            if (!nikPic || nikPic.length !== 16) {
                errors.push(`Baris ${rowNumber} ("${namaKader}"): NIK PIC harus 16 digit (terdeteksi: "${nikPic}")`);
                continue;
            }

            // ── 3. TRANSAKSI DATABASE PER BARIS DIMULAI ──
            try {
                await client.query('BEGIN');

                // Validasi OPD
                const opdCheck = await client.query(
                    `SELECT opd_id FROM opd WHERE LOWER(TRIM(nama_opd)) = LOWER(TRIM($1)) AND is_active = true LIMIT 1`,
                    [namaOpd]
                );

                if (opdCheck.rows.length === 0) {
                    errors.push(`Baris ${rowNumber} ("${namaKader}"): OPD "${namaOpd}" tidak ditemukan/tidak aktif.`);
                    await client.query('ROLLBACK');
                    continue;
                }
                const opdId = opdCheck.rows[0].opd_id;

                // Cek NIK
                const checkNik = await client.query(
                    `SELECT user_id FROM users WHERE nik = $1`, [nikPic]
                );
                if (checkNik.rows.length > 0) {
                    skipped.push(`"${namaKader}" (NIK PIC ${nikPic} sudah terdaftar)`);
                    await client.query('ROLLBACK');
                    continue;
                }

                // Insert users
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(nikPic, salt);
                const userRes = await client.query(
                    `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                     VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id`,
                    [nikPic, pic || namaKader, hashedPassword]
                );
                const userId = userRes.rows[0].user_id;

                // Insert kader
                await client.query(
                    `INSERT INTO kader (opd_id, nama_kader, deskripsi, pic, nik_pic, user_id, is_active, no_hp_pic, alamat_pic, kelurahan_pic)
                     VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)`,
                    [opdId, namaKader, deskripsi, pic, nikPic, userId, noHpPic, alamatPic, kelurahanPic]
                );

                await client.query('COMMIT'); // Simpan permanen jika sukses semua
                inserted.push(namaKader);

            } catch (rowError: any) {
                await client.query('ROLLBACK'); // Batalkan khusus baris ini jika ada tabel yang gagal
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
        const opdId = req.opd_id; // ✨ PASTIKAN BARIS INI ADA DI SINI

        const result = await executeQueryWithContext(`
            SELECT k.kader_id, k.nama_kader, k.deskripsi, k.pic, k.nik_pic, k.is_active, 
                   k.created_at, k.updated_at, o.nama_opd,k.no_hp_pic, k.alamat_pic, k.kelurahan_pic,
                   COUNT(pr.relawan_id) as jumlah_anggota
            FROM kader k
            JOIN opd o ON k.opd_id = o.opd_id
            LEFT JOIN penugasan_relawan pr ON k.kader_id = pr.kader_id AND pr.status_keaktifan = 'Aktif'
            WHERE k.opd_id = $1
            GROUP BY k.kader_id, o.nama_opd
            ORDER BY k.nama_kader ASC
        `, [opdId], req.user);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error in getKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const { nama_kader, deskripsi, pic, nik_pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;

        if (!nama_kader) {
            res.status(400).json({ success: false, message: 'Nama kader wajib diisi' });
            return;
        }
        if (!nik_pic) {
            res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
            return;
        }
        if (String(nik_pic).length !== 16) {
            res.status(400).json({ success: false, message: 'NIK PIC harus 16 digit' });
            return;
        }

        const checkNik = await executeQueryWithContext(`SELECT user_id FROM users WHERE nik = $1`, [nik_pic], req.user);
        if (checkNik.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(nik_pic), salt);

        const userRes = await executeQueryWithContext(
            `INSERT INTO users (nik, nama_lengkap, password, role, is_active) VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id;`,
            [nik_pic, pic || nama_kader, hashedPassword], req.user
        );
        const userId = userRes.rows[0].user_id;

        const result = await executeQueryWithContext(`
            INSERT INTO kader (opd_id, nama_kader, deskripsi, pic, nik_pic, user_id, no_hp_pic, alamat_pic, kelurahan_pic)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [opdId, nama_kader, deskripsi || null, pic || null, nik_pic, userId, no_hp_pic || null, alamat_pic || null, kelurahan_pic || null], req.user);

        res.status(201).json({
            success: true,
            message: `Kader berhasil ditambahkan. Akun login PIC dibuat dengan NIK: ${nik_pic}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in createKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error', error_dev: error.message });
    }
};

export const updateKaderByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;
        const kaderId = parseInt(req.params.id as string);
        const { nama_kader, deskripsi, pic, no_hp_pic, alamat_pic, kelurahan_pic } = req.body;

        const findQuery = await executeQueryWithContext(
            `SELECT * FROM kader WHERE kader_id = $1 AND opd_id = $2`, [kaderId, opdId], req.user
        );
        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan di instansi Anda' });
            return;
        }

        const result = await executeQueryWithContext(`
            UPDATE kader SET nama_kader = $1, deskripsi = $2, pic = $3, no_hp_pic = $4, alamat_pic = $5, kelurahan_pic = $6, updated_at = CURRENT_TIMESTAMP
            WHERE kader_id = $7 RETURNING *
        `, [nama_kader, deskripsi || null, pic || null, no_hp_pic || null, alamat_pic || null, kelurahan_pic || null, kaderId], req.user);

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
            `SELECT user_id FROM kader WHERE kader_id = $1 AND opd_id = $2`, [kaderId, opdId], req.user
        );
        if (findQuery.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
            return;
        }

        await executeQueryWithContext(`DELETE FROM kader WHERE kader_id = $1 AND opd_id = $2`, [kaderId, opdId], req.user);
        res.status(200).json({ success: true, message: 'Kader berhasil dihapus' });
    } catch (error: any) {
        console.error('Error in deleteKaderByOpd:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Pastikan bcrypt dan pool (db) sudah di-import di atas file ini

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
            if (!nikPic || nikPic.length !== 16) {
                errors.push(`Baris ${rowNumber} ("${namaKader}"): NIK PIC harus 16 digit`);
                continue;
            }

            try {
                await client.query('BEGIN');

                const checkNik = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nikPic]);
                if (checkNik.rows.length > 0) {
                    skipped.push(`"${namaKader}" (NIK PIC sudah terdaftar)`);
                    await client.query('ROLLBACK');
                    continue;
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(nikPic, salt);
                const userRes = await client.query(
                    `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                     VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id`,
                    [nikPic, pic || namaKader, hashedPassword]
                );
                const userId = userRes.rows[0].user_id;

                await client.query(
                    `INSERT INTO kader (opd_id, nama_kader, deskripsi, pic, nik_pic, user_id, is_active, no_hp_pic, alamat_pic, kelurahan_pic)
                     VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)`,
                    [opdId, namaKader, deskripsi, pic, nikPic, userId, noHpPic, alamatPic, kelurahanPic]
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