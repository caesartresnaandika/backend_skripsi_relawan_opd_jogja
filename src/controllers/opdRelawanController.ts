//opdRelawanControllers.ts
import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { OpdAuthRequest } from '../middleware/opdMiddleware';
import pool from '../../config/db';
import bcrypt from 'bcrypt';

// 1. Dapatkan Daftar Relawan yang bertugas di OPD ini
export const getRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    try {
        const opdId = req.opd_id;

        const result = await executeQueryWithContext(`
            SELECT 
                r.relawan_id, u.nama_lengkap, u.nik, r.alamat_ktp, r.kelurahan,
                k.nama_kader as kader, pr.status_keaktifan
            FROM penugasan_relawan pr
            JOIN relawan r ON pr.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN kader k ON pr.kader_id = k.kader_id
            WHERE pr.opd_id = $1
            ORDER BY u.nama_lengkap ASC
        `, [opdId], req.user);

        res.status(200).json({
            success: true,
            data: result.rows
        });
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
                sk.batas_aktif, sk.status, sk.file_path,
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
    const opdId = req.opd_id; // 🔒 Paksa gunakan OPD ID dari token

    const nama_lengkap = req.body.nama_lengkap || req.body.namaLengkap || req.body.namaRelawan;
    const nik = req.body.nik;
    const alamat_ktp = req.body.alamat_ktp || req.body.alamat;
    const kelurahan = req.body.kelurahan;
    const jenis_kelamin = req.body.jenis_kelamin || req.body.jenisKelamin || 'L';

    // Tangkap data penugasan dari frontend
    // Frontend mungkin mengirim array 'assignments', ambil index [0] saja
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

        // 0. Cek Duplikasi NIK
        const checkNikQuery = `SELECT user_id FROM users WHERE nik = $1`;
        const checkNikRes = await client.query(checkNikQuery, [nik]);

        if (checkNikRes.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'NIK sudah terdaftar, silakan gunakan fitur edit.' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nik, salt);

        // 1. INSERT users
        const userRes = await client.query(
            `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
             VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id;`,
            [nik, nama_lengkap, hashedPassword]
        );
        const userId = userRes.rows[0].user_id;

        // 2. INSERT relawan
        const relawanRes = await client.query(
            `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
             VALUES ($1, $2, $3, $4) RETURNING relawan_id;`,
            [userId, jenis_kelamin, alamat_ktp || '-', kelurahan || '-']
        );
        const relawanId = relawanRes.rows[0].relawan_id;

        // 3. Resolve Kader ID (Hanya mencari di dalam instansi OPD ini)
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

        // 4. INSERT Penugasan (Paksa opd_id dari token)
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

// 4. Tambah Relawan Excel Khusus OPD (Bulk - Upsert Logic)
export const createBulkRelawanByOpd = async (req: OpdAuthRequest, res: Response): Promise<void> => {
    const rawData = req.body;
    const opdId = req.opd_id; // 🔒 Paksa gunakan OPD ID dari token

    if (!Array.isArray(rawData) || rawData.length === 0) {
        res.status(400).json({ success: false, message: 'Data yang dikirim harus berupa array yang tidak kosong' });
        return;
    }

    const client = await pool.connect();
    let insertedCount = 0;
    const errors: string[] = [];

    try {
        for (let i = 0; i < rawData.length; i++) {
            const rawItem = rawData[i];
            const rowNumber = i + 1;

            // Fuzzy Key Normalization
            const item: Record<string, any> = {};
            for (const key of Object.keys(rawItem)) {
                item[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = rawItem[key];
            }

            const getVal = (possibleKeys: string[]) => {
                for (const key of possibleKeys) {
                    if (item[key] !== undefined) return String(item[key]);
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

            if (!nik || !namaLengkap) {
                errors.push(`Baris ${rowNumber} dilewati: NIK atau Nama Lengkap kosong.`);
                continue;
            }

            try {
                await client.query('BEGIN');

                let userId: number;
                let relawanId: number;

                // --- UPSERT LOGIC (Cek NIK) ---
                const checkRes = await client.query(`SELECT user_id FROM users WHERE nik = $1`, [nik]);
                
                if (checkRes.rows.length > 0) {
                    userId = checkRes.rows[0].user_id;
                    const getRelawan = await client.query(`SELECT relawan_id FROM relawan WHERE user_id = $1`, [userId]);
                    if (getRelawan.rows.length > 0) {
                        relawanId = getRelawan.rows[0].relawan_id;
                    } else {
                        throw new Error(`Data Corrupt: NIK ditemukan tapi profil relawan tidak ada.`);
                    }
                } else {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(nik, salt);
                    
                    const userRes = await client.query(
                        `INSERT INTO users (nik, nama_lengkap, password, role, is_active)
                         VALUES ($1, $2, $3, 'relawan', true) RETURNING user_id`,
                        [nik, namaLengkap, hashedPassword]
                    );
                    userId = userRes.rows[0].user_id;

                    const relawanRes = await client.query(
                        `INSERT INTO relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
                         VALUES ($1, $2, $3, $4) RETURNING relawan_id`,
                        [userId, jenisKelamin, alamat, kelurahan]
                    );
                    relawanId = relawanRes.rows[0].relawan_id;
                }

                // --- SETUP PENUGASAN (KHUSUS OPD INI SAJA) ---
                let kaderId: number | null = null;
                if (kaderName && kaderName !== '-') {
                    const kaderLookup = await client.query(
                        `SELECT kader_id FROM kader WHERE LOWER(TRIM(nama_kader)) = LOWER(TRIM($1)) AND opd_id = $2 LIMIT 1`,
                        [kaderName, opdId]
                    );
                    if (kaderLookup.rows.length > 0) kaderId = kaderLookup.rows[0].kader_id;
                }

                // Insert/Update Penugasan
                await client.query(
                    `INSERT INTO penugasan_relawan
                        (relawan_id, opd_id, kader_id, jabatan, detail_jabatan, status_keaktifan)
                     VALUES ($1, $2, $3, $4, $5, 'Aktif')
                     ON CONFLICT (relawan_id, opd_id) DO UPDATE
                         SET kader_id = EXCLUDED.kader_id,
                             jabatan = EXCLUDED.jabatan,
                             detail_jabatan = EXCLUDED.detail_jabatan,
                             status_keaktifan = EXCLUDED.status_keaktifan,
                             updated_at = CURRENT_TIMESTAMP`,
                    [relawanId, opdId, kaderId, peran, detail]
                );

                await client.query('COMMIT');
                insertedCount++;

            } catch (rowError: any) {
                await client.query('ROLLBACK');
                console.error(`Error processing row ${rowNumber}:`, rowError);
                errors.push(`Baris ${rowNumber} gagal: ${rowError.message}`);
            }
        }

        const parts: string[] = [`Berhasil menambahkan/memperbarui ${insertedCount} penugasan relawan.`];
        if (errors.length > 0) parts.push(`Ada ${errors.length} peringatan/error (cek detail).`);

        res.status(insertedCount > 0 ? 201 : 400).json({
            success: insertedCount > 0,
            message: parts.join(' '),
            data: { insertedCount, errors }
        });

    } catch (fatalError: any) {
        console.error('Fatal error in createBulkRelawanByOpd:', fatalError);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem yang fatal.', errorDetail: fatalError.message });
    } finally {
        client.release();
    }
};