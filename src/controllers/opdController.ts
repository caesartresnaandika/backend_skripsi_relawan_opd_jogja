/*
 * ============================================================
 * OPD CONTROLLER — MANAJEMEN OPD (Super Admin)
 * ============================================================
 * Controller untuk mengelola data OPD (Organisasi Perangkat Daerah).
 * Hanya Super Admin yang bisa mengakses fitur ini.
 *
 * Fitur:
 * 1. Lihat daftar semua OPD + PIC-nya
 * 2. Lihat detail OPD
 * 3. Tambah OPD baru (sekaligus buat akun admin OPD)
 * 4. Import OPD bulk (Excel)
 * 5. Update data OPD
 * 6. Toggle status OPD (aktif/nonaktif) dengan validasi
 *
 * Saat membuat OPD baru:
 * - Otomatis membuat akun user dengan role 'opd'
 * - Password default = NIK PIC
 * - Mengikat user ke OPD via tabel pengelola_opd
 * ============================================================
 */

import { Response } from 'express';
import pool, { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';
import { REGEX_PATTERNS, cleanPhoneNumber } from '../utils/regex';

/*
 * GET ALL OPD
 * Mengambil daftar semua OPD beserta PIC (Person In Charge) aktif.
 * LEFT JOIN ke pengelola_opd + users untuk mendapatkan data PIC.
 */
export const getAllOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT o.opd_id, o.nama_opd, o.alamat, o.status_keaktifan, o.created_at, o.updated_at,
                   u.nama_lengkap AS pic,
                   u.nik AS nik_pic,
                   u.no_hp AS kontak
            FROM opd o
            LEFT JOIN pengelola_opd po ON o.opd_id = po.opd_id AND po.status_keaktifan = 'Aktif'
            LEFT JOIN users u ON po.user_id = u.user_id
            ORDER BY o.created_at DESC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);
        res.status(200).json({ success: true, message: 'Berhasil mengambil daftar OPD', data: result.rows });
    } catch (error: any) {
        console.error('Error in getAllOpd:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};


/*
 * GET OPD BY ID
 * Mengambil detail satu OPD berdasarkan ID.
 */
export const getOpdById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const query = `
            SELECT o.opd_id, o.nama_opd, o.alamat, o.status_keaktifan, o.created_at, o.updated_at,
                   u.nama_lengkap AS pic,
                   u.nik AS nik_pic,
                   u.no_hp AS kontak
            FROM opd o
            LEFT JOIN pengelola_opd po ON o.opd_id = po.opd_id AND po.status_keaktifan = 'Aktif'
            LEFT JOIN users u ON po.user_id = u.user_id
            WHERE o.opd_id = $1;
        `;
        const result = await executeQueryWithContext(query, [id], req.user);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Berhasil mengambil detail OPD', data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in getOpdById:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

/*
 * CREATE OPD
 * Membuat OPD baru + akun admin OPD + mengikatnya di pengelola_opd.
 *
 * Alur:
 * 1. Validasi input (nama OPD, NIK PIC 16 digit, dll)
 * 2. Cek duplikasi NIK PIC
 * 3. Buat user baru dengan role 'opd' (password = NIK PIC)
 * 4. Buat OPD baru
 * 5. Ikat user ke OPD via tabel pengelola_opd
 *
 * Semua dalam 1 transaksi atomic.
 */
export const createOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nama_opd, alamat, kontak, nik_pic, nama_pic, pic } = req.body;
    const picName = nama_pic || pic;

    if (!nama_opd || !nama_opd.trim()) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }
    const cleanNamaOpd = nama_opd.trim();
    if (cleanNamaOpd.length < 3) {
        res.status(400).json({ success: false, message: 'Nama OPD terlalu pendek, minimal harus 3 karakter (contoh: Bappeda, Dinkes, Disdik)' });
        return;
    }
    if (cleanNamaOpd.length > 100) {
        res.status(400).json({ success: false, message: 'Nama OPD terlalu panjang, maksimal 100 karakter' });
        return;
    }
    if (/\d/.test(cleanNamaOpd)) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh mengandung angka' });
        return;
    }
    if (/[^a-zA-Z\s]/.test(cleanNamaOpd)) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh mengandung karakter spesial (hanya huruf alfabet dan spasi yang diperbolehkan)' });
        return;
    }

    let cleanAlamat = null;
    if (alamat && alamat.trim()) {
        cleanAlamat = alamat.trim();
        if (cleanAlamat.length < 5) {
            res.status(400).json({ success: false, message: 'Alamat OPD terlalu pendek, minimal harus 5 karakter' });
            return;
        }
        if (cleanAlamat.length > 255) {
            res.status(400).json({ success: false, message: 'Alamat OPD terlalu panjang, maksimal 255 karakter' });
            return;
        }
        if (/^\d+$/.test(cleanAlamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD tidak valid (tidak boleh hanya berupa deretan angka)' });
            return;
        }
        if (/[^a-zA-Z0-9\s.,\-\/#]/.test(cleanAlamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD mengandung karakter spesial yang tidak valid (hanya huruf, angka, spasi, serta tanda baca . , - / # yang diperbolehkan)' });
            return;
        }
    }

    if (!picName || !picName.trim()) {
        res.status(400).json({ success: false, message: 'Nama PIC wajib diisi' });
        return;
    }
    const cleanPicName = picName.trim();
    if (cleanPicName.length < 3) {
        res.status(400).json({ success: false, message: 'Nama PIC terlalu pendek, minimal harus 3 karakter' });
        return;
    }
    if (cleanPicName.length > 100) {
        res.status(400).json({ success: false, message: 'Nama PIC terlalu panjang, maksimal 100 karakter' });
        return;
    }
    if (/\d/.test(cleanPicName)) {
        res.status(400).json({ success: false, message: 'Nama PIC tidak boleh mengandung angka' });
        return;
    }
    if (/[^a-zA-Z\s.,'\-]/.test(cleanPicName)) {
        res.status(400).json({ success: false, message: 'Nama PIC mengandung karakter spesial yang tidak valid (hanya huruf, spasi, tanda titik, koma, petik tunggal, dan tanda hubung yang diperbolehkan)' });
        return;
    }

    if (kontak) {
        const cleanKontak = cleanPhoneNumber(kontak);
        if (REGEX_PATTERNS.HAS_LETTERS.test(cleanKontak)) {
            res.status(400).json({ success: false, message: 'Nomor kontak tidak boleh mengandung huruf' });
            return;
        }
        if (!REGEX_PATTERNS.NO_HP.test(cleanKontak)) {
            res.status(400).json({ success: false, message: 'Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)' });
            return;
        }
    }
    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }
    if (!REGEX_PATTERNS.NIK.test(nik_pic)) {
        res.status(400).json({ success: false, message: 'NIK PIC harus terdiri dari tepat 16 digit angka' });
        return;
    }

    try {
        const checkNik = await executeQueryWithContext(`SELECT user_id FROM users WHERE nik = $1`, [nik_pic], req.user);
        if (checkNik.rows.length > 0) {
            res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nik_pic + (process.env.PASSWORD_PEPPER || ''), salt);

        // 1. Buat akun user
        const userRes = await executeQueryWithContext(
            `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
            VALUES ($1, $2, $3, $4, 'opd', true) RETURNING user_id`,
            [nik_pic, cleanPicName, kontak ? cleanPhoneNumber(kontak) : null, hashedPassword], req.user
        );
        const userId = userRes.rows[0].user_id;

        // 2. Buat OPD 
        const opdRes = await executeQueryWithContext(
            `INSERT INTO opd (nama_opd, alamat) VALUES ($1, $2) RETURNING *;`,
            [cleanNamaOpd, cleanAlamat], req.user
        );
        const opdId = opdRes.rows[0].opd_id;

        // 3. Ikat di pengelola_opd (dengan kolom baru)
        await executeQueryWithContext(
            `INSERT INTO pengelola_opd (user_id, opd_id, jabatan, tanggal_mulai, status_keaktifan)
             VALUES ($1, $2, 'Pengelola OPD', CURRENT_DATE, 'Aktif')`,
            [userId, opdId], req.user
        );

        res.status(201).json({
            success: true,
            message: `Berhasil menambahkan OPD baru. Akun login PIC dibuat dengan NIK: ${nik_pic}`,
            data: opdRes.rows[0]
        });
    } catch (error: any) {
        console.error('FULL ERROR in createOpd:', error);
        let errorMessage = 'Terjadi kesalahan pada server';
        if (error.code) errorMessage += ` (Kode PG: ${error.code})`;
        if (error.detail) errorMessage += ` - ${error.detail}`;
        res.status(500).json({ success: false, message: errorMessage, error_dev: error.message });
    }
};

/*
 * CREATE BULK OPD (Excel Import)
 * Import banyak OPD sekaligus. Setiap baris diproses dalam
 * transaksi terpisah (baris gagal tidak menggagalkan baris lain).
 *
 * Normalisasi key: semua key diubah ke uppercase + trim spasi.
 */
export const createBulkOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ success: false, message: 'Data harus berupa array yang tidak kosong' });
        return;
    }

    const inserted: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    try {
        for (const rawItem of data) {
            const item: Record<string, any> = {};
            for (const key of Object.keys(rawItem)) {
                item[key.trim().toUpperCase()] = rawItem[key];
            }

            const namaOpd = (item['NAMAOPD'] || item['NAMA OPD'] || '').trim();
            const nikPic = String(item['NIK PIC'] || item['NIKPIC'] || '').trim();
            const pic = (item['PIC'] || '').trim() || null;
            const alamat = (item['ALAMAT'] || '').trim() || null;
            const kontak = (item['KONTAK'] || item['NOHP'] || '').trim() || null;


            if (!namaOpd) {
                errors.push('Satu baris dilewati: kolom namaOpd kosong');
                continue;
            }
            if (namaOpd.length < 3) {
                errors.push(`"${namaOpd}": Nama OPD terlalu pendek (min 3 karakter)`);
                continue;
            }
            if (namaOpd.length > 100) {
                errors.push(`"${namaOpd}": Nama OPD melebihi batas 100 karakter`);
                continue;
            }
            if (/\d/.test(namaOpd)) {
                errors.push(`"${namaOpd}": Nama OPD tidak boleh mengandung angka`);
                continue;
            }
            if (/[^a-zA-Z\s]/.test(namaOpd)) {
                errors.push(`"${namaOpd}": Nama OPD tidak boleh mengandung karakter spesial`);
                continue;
            }

            let cleanAlamat = null;
            if (alamat) {
                cleanAlamat = alamat;
                if (cleanAlamat.length < 5) {
                    errors.push(`"${namaOpd}": Alamat OPD minimal 5 karakter`);
                    continue;
                }
                if (cleanAlamat.length > 255) {
                    errors.push(`"${namaOpd}": Alamat OPD melebihi batas 255 karakter`);
                    continue;
                }
                if (/^\d+$/.test(cleanAlamat)) {
                    errors.push(`"${namaOpd}": Alamat OPD tidak boleh hanya berupa angka`);
                    continue;
                }
                if (/[^a-zA-Z0-9\s.,\-\/#]/.test(cleanAlamat)) {
                    errors.push(`"${namaOpd}": Alamat OPD mengandung karakter spesial yang tidak valid`);
                    continue;
                }
            }

            if (!pic) {
                errors.push(`"${namaOpd}": Nama PIC kosong`);
                continue;
            }
            if (pic.length < 3) {
                errors.push(`"${namaOpd}": Nama PIC terlalu pendek (min 3 karakter)`);
                continue;
            }
            if (pic.length > 100) {
                errors.push(`"${namaOpd}": Nama PIC melebihi batas 100 karakter`);
                continue;
            }
            if (/\d/.test(pic)) {
                errors.push(`"${namaOpd}": Nama PIC tidak boleh mengandung angka`);
                continue;
            }
            if (/[^a-zA-Z\s.,'\-]/.test(pic)) {
                errors.push(`"${namaOpd}": Nama PIC mengandung karakter spesial yang tidak valid`);
                continue;
            }

            if (kontak) {
                const cleanKontak = cleanPhoneNumber(kontak);
                if (REGEX_PATTERNS.HAS_LETTERS.test(cleanKontak)) {
                    errors.push(`"${namaOpd}": Format kontak "${kontak}" tidak boleh mengandung huruf`);
                    continue;
                }
                if (!REGEX_PATTERNS.NO_HP.test(cleanKontak)) {
                    errors.push(`"${namaOpd}": Format kontak "${kontak}" tidak valid (harus 08... atau +628...)`);
                    continue;
                }
            }
            if (!nikPic || !REGEX_PATTERNS.NIK.test(nikPic)) {
                errors.push(`"${namaOpd}": NIK PIC harus 16 digit angka (diterima: "${nikPic}")`);
                continue;
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Set context
                if (req.user && req.user.id) {
                    await client.query("SELECT set_config('app.current_user_id', $1, true);", [req.user.id.toString()]);
                    await client.query("SELECT set_config('app.current_user_role', $1, true);", [req.user.role]);
                    const opdId = (req.user as any).opd_id;
                    await client.query("SELECT set_config('app.current_opd_id', $1, true);", [(opdId ?? 0).toString()]);
                    if (req.user.ip) {
                        await client.query("SELECT set_config('app.current_user_ip', $1, true);", [req.user.ip]);
                    }
                }

                const checkNik = await client.query(
                    `SELECT user_id FROM users WHERE nik = $1`, [nikPic]
                );
                if (checkNik.rows.length > 0) {
                    skipped.push(`"${namaOpd}" (NIK ${nikPic} sudah terdaftar)`);
                    await client.query('ROLLBACK');
                    client.release();
                    continue;
                }

                // Buat akun user
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(nikPic + (process.env.PASSWORD_PEPPER || ''), salt);
                const userRes = await client.query(
                    `INSERT INTO users (nik, nama_lengkap, no_hp, password, role, status_keaktifan)
                     VALUES ($1, $2, $3, $4, 'opd', true) RETURNING user_id`,
                    [nikPic, pic, kontak ? cleanPhoneNumber(kontak) : null, hashedPassword]
                );
                const userId = userRes.rows[0].user_id;

                // Insert OPD (tanpa pic/nik_pic/kontak)
                const opdRes = await client.query(
                    `INSERT INTO opd (nama_opd, alamat, status_keaktifan)
                     VALUES ($1, $2, true) RETURNING opd_id`,
                    [namaOpd, cleanAlamat]
                );
                const opdId = opdRes.rows[0].opd_id;

                // Ikat di pengelola_opd (dengan kolom baru)
                await client.query(
                    `INSERT INTO pengelola_opd (user_id, opd_id, jabatan, tanggal_mulai, status_keaktifan)
                     VALUES ($1, $2, 'Pengelola OPD', CURRENT_DATE, 'Aktif')`,
                    [userId, opdId]
                );

                await client.query('COMMIT');
                inserted.push(namaOpd);
            } catch (err: any) {
                await client.query('ROLLBACK');
                errors.push(`"${namaOpd}": ${err.message}`);
            } finally {
                client.release();
            }
        }

        const totalOk = inserted.length;
        const parts: string[] = [`Berhasil menambahkan ${totalOk} OPD baru.`];
        if (skipped.length > 0) parts.push(`${skipped.length} baris dilewati (NIK sudah ada).`);
        if (errors.length > 0) parts.push(`${errors.length} baris gagal karena data tidak valid.`);

        res.status(totalOk > 0 ? 201 : (errors.length > 0 ? 400 : 200)).json({
            success: totalOk > 0,
            message: parts.join(' '),
            data: { insertedCount: totalOk, skipped, errors }
        });

    } catch (error: any) {
        console.error('Error in createBulkOpd:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat import Excel', errorDetail: error.message });
    }
};

/*
 * UPDATE OPD
 * Memperbarui nama dan alamat OPD.
 */
export const updateOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_opd, alamat, kontak, nik_pic, nama_pic, pic } = req.body;
    const picName = nama_pic || pic;

    if (!nama_opd || !nama_opd.trim()) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }
    const cleanNamaOpd = nama_opd.trim();
    if (cleanNamaOpd.length < 3) {
        res.status(400).json({ success: false, message: 'Nama OPD terlalu pendek, minimal harus 3 karakter (contoh: Bappeda, Dinkes, Disdik)' });
        return;
    }
    if (cleanNamaOpd.length > 100) {
        res.status(400).json({ success: false, message: 'Nama OPD terlalu panjang, maksimal 100 karakter' });
        return;
    }
    if (/\d/.test(cleanNamaOpd)) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh mengandung angka' });
        return;
    }
    if (/[^a-zA-Z\s]/.test(cleanNamaOpd)) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh mengandung karakter spesial (hanya huruf alfabet dan spasi yang diperbolehkan)' });
        return;
    }

    let cleanAlamat = null;
    if (alamat && alamat.trim()) {
        cleanAlamat = alamat.trim();
        if (cleanAlamat.length < 5) {
            res.status(400).json({ success: false, message: 'Alamat OPD terlalu pendek, minimal harus 5 karakter' });
            return;
        }
        if (cleanAlamat.length > 255) {
            res.status(400).json({ success: false, message: 'Alamat OPD terlalu panjang, maksimal 255 karakter' });
            return;
        }
        if (/^\d+$/.test(cleanAlamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD tidak valid (tidak boleh hanya berupa deretan angka)' });
            return;
        }
        if (/[^a-zA-Z0-9\s.,\-\/#]/.test(cleanAlamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD mengandung karakter spesial yang tidak valid (hanya huruf, angka, spasi, serta tanda baca . , - / # yang diperbolehkan)' });
            return;
        }
    }

    let cleanPicName = null;
    if (picName !== undefined) {
        if (!picName || !picName.trim()) {
            res.status(400).json({ success: false, message: 'Nama PIC wajib diisi' });
            return;
        }
        cleanPicName = picName.trim();
        if (cleanPicName.length < 3) {
            res.status(400).json({ success: false, message: 'Nama PIC terlalu pendek, minimal harus 3 karakter' });
            return;
        }
        if (cleanPicName.length > 100) {
            res.status(400).json({ success: false, message: 'Nama PIC terlalu panjang, maksimal 100 karakter' });
            return;
        }
        if (/\d/.test(cleanPicName)) {
            res.status(400).json({ success: false, message: 'Nama PIC tidak boleh mengandung angka' });
            return;
        }
        if (/[^a-zA-Z\s.,'\-]/.test(cleanPicName)) {
            res.status(400).json({ success: false, message: 'Nama PIC mengandung karakter spesial yang tidak valid (hanya huruf, spasi, tanda titik, koma, petik tunggal, dan tanda hubung yang diperbolehkan)' });
            return;
        }
    }

    if (kontak) {
        const cleanKontak = cleanPhoneNumber(kontak);
        if (REGEX_PATTERNS.HAS_LETTERS.test(cleanKontak)) {
            res.status(400).json({ success: false, message: 'Nomor kontak tidak boleh mengandung huruf' });
            return;
        }
        if (!REGEX_PATTERNS.NO_HP.test(cleanKontak)) {
            res.status(400).json({ success: false, message: 'Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)' });
            return;
        }
    }

    if (nik_pic && !REGEX_PATTERNS.NIK.test(nik_pic)) {
        res.status(400).json({ success: false, message: 'NIK PIC harus terdiri dari tepat 16 digit angka' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Set context
        if (req.user && req.user.id) {
            await client.query("SELECT set_config('app.current_user_id', $1, true);", [req.user.id.toString()]);
            await client.query("SELECT set_config('app.current_user_role', $1, true);", [req.user.role]);
        }

        const result = await client.query(
            `UPDATE opd SET nama_opd = $1, alamat = $2, updated_at = CURRENT_TIMESTAMP WHERE opd_id = $3 RETURNING *;`,
            [cleanNamaOpd, cleanAlamat, id]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }

        // Update user (PIC) if provided
        if (cleanPicName || nik_pic || kontak) {
            const pengelolaRes = await client.query(
                `SELECT user_id FROM pengelola_opd WHERE opd_id = $1 AND status_keaktifan = 'Aktif' LIMIT 1`,
                [id]
            );
            
            if (pengelolaRes.rows.length > 0) {
                const userId = pengelolaRes.rows[0].user_id;
                
                // If NIK is changed, ensure it's not used by someone else
                if (nik_pic) {
                    const checkNik = await client.query(`SELECT user_id FROM users WHERE nik = $1 AND user_id != $2`, [nik_pic, userId]);
                    if (checkNik.rows.length > 0) {
                        await client.query('ROLLBACK');
                        client.release();
                        res.status(400).json({ success: false, message: 'NIK PIC sudah terdaftar di sistem' });
                        return;
                    }
                }

                const updateFields = [];
                const values = [];
                let paramIndex = 1;

                if (cleanPicName) {
                    updateFields.push(`nama_lengkap = $${paramIndex++}`);
                    values.push(cleanPicName);
                }
                if (nik_pic) {
                    updateFields.push(`nik = $${paramIndex++}`);
                    values.push(nik_pic);
                }
                if (kontak) {
                    updateFields.push(`no_hp = $${paramIndex++}`);
                    values.push(cleanPhoneNumber(kontak));
                }

                if (updateFields.length > 0) {
                    values.push(userId);
                    await client.query(
                        `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}`,
                        values
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Berhasil memperbarui data OPD', data: result.rows[0] });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error in updateOpd:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

/*
 * TOGGLE OPD STATUS
 * Mengaktifkan/menonaktifkan OPD.
 *
 * VALIDASI saat menonaktifkan:
 * 1. Cek apakah masih ada relawan aktif di OPD ini
 * 2. Cek apakah masih ada kader aktif di OPD ini
 * Jika masih ada → tolak penonaktifan dengan pesan yang jelas.
 *
 * Ini untuk mencegah OPD dinonaktifkan saat masih memiliki
 * data aktif yang terkait.
 */
export const toggleOpdStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status_keaktifan } = req.body;

    if (typeof status_keaktifan !== 'boolean') {
        res.status(400).json({ success: false, message: 'Field status_keaktifan wajib diisi dan harus berupa boolean' });
        return;
    }

    try {
        // ── Validasi hanya saat MENONAKTIFKAN ──
        if (!status_keaktifan) {
            // 1. Cek relawan aktif di OPD ini
            const cekRelawan = await executeQueryWithContext(`
                SELECT COUNT(*) as total
                FROM penugasan_relawan pr
                JOIN relawan r ON pr.relawan_id = r.relawan_id
                JOIN users u ON r.user_id = u.user_id
                WHERE pr.opd_id = $1
                  AND pr.status_keaktifan = 'Aktif'
                  AND u.status_keaktifan = true
            `, [id], req.user);

            const totalRelawan = parseInt(cekRelawan.rows[0].total, 10);
            if (totalRelawan > 0) {
                res.status(400).json({
                    success: false,
                    message: `OPD tidak dapat dinonaktifkan karena masih terdapat ${totalRelawan} relawan aktif. Nonaktifkan relawan terlebih dahulu.`
                });
                return;
            }

            // 2. Cek kader aktif di OPD ini
            const cekKader = await executeQueryWithContext(`
                SELECT COUNT(*) as total
                FROM kader
                WHERE opd_id = $1 AND status_keaktifan = true
            `, [id], req.user);

            const totalKader = parseInt(cekKader.rows[0].total, 10);
            if (totalKader > 0) {
                res.status(400).json({
                    success: false,
                    message: `OPD tidak dapat dinonaktifkan karena masih terdapat ${totalKader} kader aktif. Nonaktifkan kader terlebih dahulu.`
                });
                return;
            }
        }

        // ── Update status ──
        const result = await executeQueryWithContext(`
            UPDATE opd SET status_keaktifan = $1, updated_at = CURRENT_TIMESTAMP WHERE opd_id = $2 RETURNING *;
        `, [status_keaktifan, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }

        const statusText = status_keaktifan ? 'diaktifkan' : 'dinonaktifkan';
        res.status(200).json({ success: true, message: `OPD berhasil ${statusText}`, data: result.rows[0] });

    } catch (error: any) {
        console.error('Error in toggleOpdStatus:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};