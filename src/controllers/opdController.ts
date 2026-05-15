//opdController
import { Response } from 'express';
import pool, { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

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

export const createOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nama_opd, alamat, kontak, nik_pic, nama_pic } = req.body;
    // nama_pic = nama lengkap PIC (opsional, fallback ke nama_opd)

    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }
    if (nama_opd.length < 3) {
        res.status(400).json({ success: false, message: 'Nama OPD minimal 3 karakter' });
        return;
    }
    if (nama_opd.length > 255) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh lebih dari 255 karakter' });
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nama_opd)) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh mengandung angka atau karakter spesial' });
        return;
    }
    if (alamat) {
        if (alamat.length < 5) {
            res.status(400).json({ success: false, message: 'Alamat OPD minimal 5 karakter' });
            return;
        }
        if (/^\d+$/.test(alamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD tidak boleh hanya berisi angka' });
            return;
        }
        if (!/^[a-zA-Z0-9\s.,\-\/]+$/.test(alamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD tidak boleh mengandung karakter spesial yang tidak valid' });
            return;
        }
    }
    if (nama_pic) {
        if (nama_pic.length < 3) {
            res.status(400).json({ success: false, message: 'Nama PIC minimal 3 karakter' });
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
    if (!/^\d{16}$/.test(nik_pic)) {
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
            [nik_pic, nama_pic || nama_opd, kontak, hashedPassword], req.user
        );
        const userId = userRes.rows[0].user_id;

        // 2. Buat OPD 
        const opdRes = await executeQueryWithContext(
            `INSERT INTO opd (nama_opd, alamat) VALUES ($1, $2) RETURNING *;`,
            [nama_opd, alamat || null], req.user
        );
        const opdId = opdRes.rows[0].opd_id;

        // 3. Ikat di pengelola_opd (dengan kolom baru)
        await executeQueryWithContext(
            `INSERT INTO pengelola_opd (user_id, opd_id, jabatan, tanggal_mulai, status)
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
            if (namaOpd.length > 255) {
                errors.push(`"${namaOpd}": Nama OPD melebihi batas 255 karakter`);
                continue;
            }
            if (!nikPic || !/^\d{16}$/.test(nikPic)) {
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
                    [nikPic, pic || namaOpd, kontak, hashedPassword]
                );
                const userId = userRes.rows[0].user_id;

                // Insert OPD (tanpa pic/nik_pic/kontak)
                const opdRes = await client.query(
                    `INSERT INTO opd (nama_opd, alamat, status_keaktifan)
                     VALUES ($1, $2, true) RETURNING opd_id`,
                    [namaOpd, alamat]
                );
                const opdId = opdRes.rows[0].opd_id;

                // Ikat di pengelola_opd (dengan kolom baru)
                await client.query(
                    `INSERT INTO pengelola_opd (user_id, opd_id, jabatan, tanggal_mulai, status)
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

export const updateOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nama_opd, alamat } = req.body;
    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }
    if (nama_opd.length < 3) {
        res.status(400).json({ success: false, message: 'Nama OPD minimal 3 karakter' });
        return;
    }
    if (nama_opd.length > 255) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh lebih dari 255 karakter' });
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nama_opd)) {
        res.status(400).json({ success: false, message: 'Nama OPD tidak boleh mengandung angka atau karakter spesial' });
        return;
    }
    if (alamat) {
        if (alamat.length < 5) {
            res.status(400).json({ success: false, message: 'Alamat OPD minimal 5 karakter' });
            return;
        }
        if (/^\d+$/.test(alamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD tidak boleh hanya berisi angka' });
            return;
        }
        if (!/^[a-zA-Z0-9\s.,\-\/]+$/.test(alamat)) {
            res.status(400).json({ success: false, message: 'Alamat OPD tidak boleh mengandung karakter spesial yang tidak valid' });
            return;
        }
    }
    try {
        const result = await executeQueryWithContext(
            `UPDATE opd SET nama_opd = $1, alamat = $2, updated_at = CURRENT_TIMESTAMP WHERE opd_id = $3 RETURNING *;`,
            [nama_opd, alamat || null, id], req.user
        );
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }
        res.status(200).json({ success: true, message: 'Berhasil memperbarui data OPD', data: result.rows[0] });
    } catch (error: any) {
        console.error('Error in updateOpd:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

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