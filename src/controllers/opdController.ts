//opdController
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';

export const getAllOpd = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT opd_id, nama_opd, alamat, kontak, pic, nik_pic, is_active, created_at, updated_at
            FROM opd
            ORDER BY created_at DESC;
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
            SELECT opd_id, nama_opd, alamat, kontak, pic, nik_pic, is_active, created_at, updated_at
            FROM opd WHERE opd_id = $1;
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
    const { nama_opd, alamat, kontak, pic, nik_pic } = req.body;

    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }
    if (!nik_pic) {
        res.status(400).json({ success: false, message: 'NIK PIC wajib diisi' });
        return;
    }
    if (nik_pic.length !== 16) {
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
        const hashedPassword = await bcrypt.hash(nik_pic, salt);

        const userRes = await executeQueryWithContext(
            `INSERT INTO users (nik, nama_lengkap, password, role, is_active) VALUES ($1, $2, $3, 'opd', true) RETURNING user_id;`,
            [nik_pic, pic || nama_opd, hashedPassword], req.user
        );
        const userId = userRes.rows[0].user_id;

        const opdRes = await executeQueryWithContext(
            `INSERT INTO opd (nama_opd, alamat, kontak, pic, nik_pic) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
            [nama_opd, alamat || null, kontak || null, pic || null, nik_pic], req.user
        );
        const opdId = opdRes.rows[0].opd_id;

        await executeQueryWithContext(`INSERT INTO pengelola_opd (user_id, opd_id) VALUES ($1, $2)`, [userId, opdId], req.user);

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
            const nikPic  = String(item['NIK PIC'] || item['NIKPIC'] || '').trim();
            const pic     = (item['PIC'] || '').trim() || null;
            const alamat  = (item['ALAMAT'] || '').trim() || null;
            const kontak  = (item['KONTAK'] || '').trim() || null;

            // ── Validasi per baris ──
            if (!namaOpd) {
                errors.push('Satu baris dilewati: kolom namaOpd kosong');
                continue;
            }
            if (!nikPic || nikPic.length !== 16) {
                errors.push(`"${namaOpd}": NIK PIC harus 16 digit (diterima: "${nikPic}")`);
                continue;
            }

            // ── Cek NIK sudah ada ──
            const checkNik = await executeQueryWithContext(
                `SELECT user_id FROM users WHERE nik = $1`, [nikPic], req.user
            );
            if (checkNik.rows.length > 0) {
                skipped.push(`"${namaOpd}" (NIK ${nikPic} sudah terdaftar)`);
                continue;
            }

            // ── Buat akun user dengan role 'opd' ──
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(nikPic, salt);
            const userRes = await executeQueryWithContext(
                `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                 VALUES ($1, $2, $3, 'opd', true) RETURNING user_id`,
                [nikPic, pic || namaOpd, hashedPassword], req.user
            );
            const userId = userRes.rows[0].user_id;

            // ── Insert OPD ──
            const opdRes = await executeQueryWithContext(
                `INSERT INTO opd (nama_opd, alamat, kontak, pic, nik_pic, is_active)
                 VALUES ($1, $2, $3, $4, $5, true) RETURNING opd_id`,
                [namaOpd, alamat, kontak, pic, nikPic], req.user
            );
            const opdId = opdRes.rows[0].opd_id;

            // ── Ikat user ke OPD di pengelola_opd ──
            await executeQueryWithContext(
                `INSERT INTO pengelola_opd (user_id, opd_id) VALUES ($1, $2)`,
                [userId, opdId], req.user
            );

            inserted.push(namaOpd);
        }

        const totalOk = inserted.length;
        const parts: string[] = [`Berhasil menambahkan ${totalOk} OPD baru.`];
        if (skipped.length > 0) parts.push(`${skipped.length} baris dilewati (NIK sudah ada).`);
        if (errors.length > 0) parts.push(`${errors.length} baris gagal karena data tidak valid.`);

        res.status(totalOk > 0 ? 201 : 400).json({
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
    const { nama_opd, alamat, kontak, pic } = req.body;
    if (!nama_opd) {
        res.status(400).json({ success: false, message: 'Field nama_opd wajib diisi' });
        return;
    }
    try {
        const result = await executeQueryWithContext(
            `UPDATE opd SET nama_opd = $1, alamat = $2, kontak = $3, pic = $4, updated_at = CURRENT_TIMESTAMP WHERE opd_id = $5 RETURNING *;`,
            [nama_opd, alamat || null, kontak || null, pic || null, id], req.user
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
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        res.status(400).json({ success: false, message: 'Field is_active wajib diisi dan harus berupa boolean' });
        return;
    }

    try {
        // ── Validasi hanya saat MENONAKTIFKAN ──
        if (!is_active) {
            // 1. Cek relawan aktif di OPD ini
            const cekRelawan = await executeQueryWithContext(`
                SELECT COUNT(*) as total
                FROM penugasan_relawan pr
                JOIN relawan r ON pr.relawan_id = r.relawan_id
                JOIN users u ON r.user_id = u.user_id
                WHERE pr.opd_id = $1
                  AND pr.status_keaktifan = 'Aktif'
                  AND u.is_active = true
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
                WHERE opd_id = $1 AND is_active = true
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
            UPDATE opd SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE opd_id = $2 RETURNING *;
        `, [is_active, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data OPD tidak ditemukan' });
            return;
        }

        const statusText = is_active ? 'diaktifkan' : 'dinonaktifkan';
        res.status(200).json({ success: true, message: `OPD berhasil ${statusText}`, data: result.rows[0] });

    } catch (error: any) {
        console.error('Error in toggleOpdStatus:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};