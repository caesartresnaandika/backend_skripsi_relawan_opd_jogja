import { Response } from 'express';
import { executeQueryWithContext } from '../../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../../config/db'; // Dibutuhkan jika ingin handle client Transaction secara manual

// 1. Dapatkan daftar semua SK
export const getAllSK = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif, sk.status, sk.file_path,
                o.nama_opd,
                (SELECT COUNT(*) FROM penugasan_relawan pr WHERE pr.sk_id = sk.sk_id) AS jumlah_relawan
            FROM surat_keputusan sk
            JOIN opd o ON sk.opd_id = o.opd_id
            ORDER BY sk.created_at DESC;
        `;
        const result = await executeQueryWithContext(query, [], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar Surat Keputusan',
            data: result.rows
        });
    } catch (error: any) {
        console.error('Error in getAllSK:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 2. Dapatkan detail SK beserta daftar relawannya
export const getSKById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        // Ambil Data Master SK
        const querySK = `
            SELECT 
                sk.sk_id, sk.nomor_sk, sk.judul_sk, sk.tanggal_terbit, sk.batas_aktif, sk.status, sk.file_path,
                o.nama_opd
            FROM surat_keputusan sk
            JOIN opd o ON sk.opd_id = o.opd_id
            WHERE sk.sk_id = $1;
        `;
        const resultSK = await executeQueryWithContext(querySK, [id], req.user);

        if (resultSK.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Surat Keputusan tidak ditemukan' });
            return;
        }

        const sk_data = resultSK.rows[0];

        // Ambil Daftar Relawan di dalam SK ini
        const queryRelawan = `
            SELECT 
                pr.penugasan_id, pr.status_keaktifan,
                u.nik, u.nama_lengkap, u.no_hp,
                k.nama_komunitas AS nama_kader
            FROM penugasan_relawan pr
            JOIN relawan r ON pr.relawan_id = r.relawan_id
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN komunitas k ON pr.komunitas_id = k.komunitas_id
            WHERE pr.sk_id = $1;
        `;
        const resultRelawan = await executeQueryWithContext(queryRelawan, [id], req.user);

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail SK',
            data: {
                ...sk_data,
                daftar_relawan: resultRelawan.rows
            }
        });
    } catch (error: any) {
        console.error('Error in getSKById:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 3. Endpoint "SAPU JAGAT": Buat SK sekaligus Tugaskan Relawan dari file Excel JSON
// Perhatikan: Karena ini butuh multiple query yang saling berhubungan dengan logic khusus (Looping),
// kita akan meminjam client khusus dan melakukan Transaksi Manual (BEGIN/ROLLBACK) di sni.
export const createSKDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    // Karena pakai FormData, data kompleks seperti array (daftar_relawan) dikirim sebagai string JSON
    const { 
        nomor_sk, judul_sk, tanggal_terbit, batas_aktif, 
        opd_id, komunitas_id, daftar_relawan: daftar_relawan_str
    } = req.body;

    const file = req.file;

    // Parse array daftar_relawan dari string JSON jika ada
    let daftar_relawan: any[] = [];
    if (daftar_relawan_str) {
        try {
            daftar_relawan = JSON.parse(daftar_relawan_str);
        } catch (e) {
            console.error('Failed to parse daftar_relawan json string:', e);
        }
    }

    // Validasi basic
    if (!nomor_sk || !opd_id) {
        res.status(400).json({ success: false, message: 'Nomor SK dan OPD wajib diisi' });
        return;
    }

    // Tentukan URL File
    // UNTUK SEMENTARA: Kita biarkan dummy path atau base64 mock jika tidak terhubung Supabase / Railway Storage
    // Pada implementasi asli, upload file buffer (req.file.buffer) ke Supabase Storage, lalu dapatkan URL-nya
    let fileUrl = 'Diunggah Melalui Sistem Excel JSON';
    if (file) {
        // Contoh implementasi S3 / Supabase Upload (Mocked logic):
        // const { data, error } = await supabase.storage.from('sk-documents').upload(`sk-${Date.now()}-${file.originalname}`, file.buffer);
        // fileUrl = data.publicUrl;
        
        fileUrl = `/uploads/${Date.now()}-${file.originalname}`; // Dummy path
    }

    // Pinjam 1 koneksi khusus untuk transaksi panjang ini
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // MULAI TRANSAKSI KUNCI (All or Nothing)

        // [RLS Context] Set Identitas pengguna (Super Admin) untuk RLS Database
        if (req.user && req.user.id) {
            await client.query("SELECT set_config('app.current_user_id', $1, true);", [req.user.id.toString()]);
            await client.query("SELECT set_config('app.current_user_role', $1, true);", [req.user.role]);
        }

        // TAHAP 1: Simpan Master SK
        const insertSKQuery = `
            INSERT INTO surat_keputusan (nomor_sk, judul_sk, tanggal_terbit, batas_aktif, opd_id, file_path)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING sk_id;
        `;
        const skValues = [
            nomor_sk, judul_sk, tanggal_terbit || null, batas_aktif || null, 
            opd_id, fileUrl 
        ];
        
        const skResult = await client.query(insertSKQuery, skValues);
        const new_sk_id = skResult.rows[0].sk_id;

        // TAHAP 2: Looping Assign Relawan jika ada
        const relawanBerhasil = [];
        const relawanGagalNIK = [];

        if (daftar_relawan && Array.isArray(daftar_relawan) && daftar_relawan.length > 0) {
            
            for (const item of daftar_relawan) {
                // 1. Cari Relawanerdasarkan NIK
                const cariUserQuery = `
                    SELECT r.relawan_id 
                    FROM users u
                    JOIN relawan r ON u.user_id = r.user_id
                    WHERE u.nik = $1 AND u.role = 'relawan'
                `;
                const userRes = await client.query(cariUserQuery, [item.nik]);

                if (userRes.rows.length === 0) {
                    // NIK tdk terdaftar di tabel Relawan = Skip
                    relawanGagalNIK.push(item.nik); 
                    continue; 
                }

                const rlwn_id = userRes.rows[0].relawan_id;

                // 2. Insert Penugasan
                const insertPenugasanQuery = `
                    INSERT INTO penugasan_relawan (relawan_id, opd_id, komunitas_id, sk_id, jabatan)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                // Asumsi: jabatan didapatkan dari nama kader/komunitas
                await client.query(insertPenugasanQuery, [rlwn_id, opd_id, komunitas_id || null, new_sk_id, 'Kader/Relawan']);
                relawanBerhasil.push(item.nik);
            }
        }

        // JIKA SEMUA LANCAR, SIMPAN KE DATABASE SECARA PERMANEN
        await client.query('COMMIT'); 

        res.status(201).json({
            success: true,
            message: 'Berhasil membuat SK dan menugaskan relawan',
            data: {
                sk_id: new_sk_id,
                total_ditugaskan: relawanBerhasil.length,
                gagal_nik_tidak_ditemukan: relawanGagalNIK
            }
        });

    } catch (error: any) {
        // JIKA ADA ERROR SQL (Misal: NIK Duplikat / Relawan sudah ditugaskan di OPD yang sama)
        await client.query('ROLLBACK'); // BATALKAN SEMUA PROSES
        
        console.error('FULL ERROR in createSKDetail:', error);

        let errorMessage = 'Gagal menyimpan data SK.';
        if (error.code === '23505') { // Constraint violation (misal constraint unique penugasan_relawan)
             errorMessage += ' Beberapa relawan mungkin sudah terdaftar di instansi tersebut.';
        } else if (error.code) {
             errorMessage += ` (PG Error: ${error.code}) ${error.detail}`;
        }

        res.status(400).json({ success: false, message: errorMessage, dev_log: error.message });
    } finally {
        client.release(); // KEMBALIKAN KONEKSI KE KOLAM
    }
};

// 4. Update Status SK (Aktif/Nonaktif)
export const updateSKStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        res.status(400).json({ success: false, message: 'Status wajib diisi' });
        return;
    }

    try {
        const query = `
            UPDATE surat_keputusan
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE sk_id = $2
            RETURNING *;
        `;
        const result = await executeQueryWithContext(query, [status, id], req.user);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data SK tidak ditemukan' });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Status SK berhasil diperbarui menjadi ${status}`,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error in updateSKStatus:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
