/*
 * ============================================================
 * KONFIGURASI DATABASE POSTGRESQL + ROW-LEVEL SECURITY (RLS)
 * ============================================================
 * File ini mengatur koneksi ke database PostgreSQL dan menyediakan
 * helper function `executeQueryWithContext` yang digunakan oleh
 * seluruh controller untuk menjalankan query dengan menerapkan
 * kebijakan Row-Level Security (RLS) PostgreSQL.
 *
 * RLS memastikan bahwa setiap user hanya bisa mengakses data
 * yang sesuai dengan role dan OPD-nya masing-masing.
 * ============================================================
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/*
 * MEMBUAT CONNECTION POLL
 * Pool digunakan untuk mengelola banyak koneksi database secara efisien.
 * Koneksi diambil dari pool saat dibutuhkan dan dikembalikan setelah selesai.
 * Konfigurasi diambil dari environment variable (file .env).
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

/**
 * [HELPER RLS]
 * Mengeksekusi query dengan menyertakan konteks User (ID, Role, OPD, IP).
 *
 * CARA KERJA:
 * 1. Membuka transaksi database (BEGIN)
 * 2. Mengirim konteks user ke session PostgreSQL via set_config()
 *    - app.current_user_id  → ID user yang sedang login
 *    - app.current_user_role → role user (super_admin, opd, relawan)
 *    - app.current_opd_id   → OPD tempat user bekerja (khusus role opd)
 *    - app.current_user_ip  → alamat IP user untuk audit trail
 * 3. Mengeksekusi query yang diminta
 * 4. Jika sukses → COMMIT (menyimpan perubahan)
 * 5. Jika gagal → ROLLBACK (membatalkan perubahan)
 * 6. Mengembalikan koneksi ke pool (finally)
 *
 * Mengapa pakai BEGIN/COMMIT?
 * Karena SET LOCAL hanya berlaku dalam transaksi. Setelah COMMIT
 * atau ROLLBACK, koneksi dikembalikan ke pool dalam keadaan bersih.
 *
 * WAJIB digunakan untuk semua tabel yang mengaktifkan RLS!
 * Jika tidak, policy RLS tidak akan tahu siapa user yang mengakses.
 */
export const executeQueryWithContext = async (
    queryText: string,
    params: any[] = [],
    userContext?: { id: number; role: string; opd_id?: number; ip?: string }
) => {
    // Pinjam 1 koneksi dari pool untuk transaksi ini
    const client = await pool.connect();
    try {
        // Mulai transaksi — SET LOCAL hanya berlaku dalam transaksi
        await client.query('BEGIN');

        // Jika ada user yang login, kirim konteksnya ke session PostgreSQL
        if (userContext && userContext.id) {
            // Set variable session agar policy RLS bisa membaca siapa user-nya
            await client.query("SELECT set_config('app.current_user_id', $1, true);", [userContext.id.toString()]);
            await client.query("SELECT set_config('app.current_user_role', $1, true);", [userContext.role]);

            // OPD ID diperlukan untuk policy yang membatasi akses per OPD
            const opdId = (userContext as any).opd_id;
            await client.query("SELECT set_config('app.current_opd_id', $1, true);", [(opdId ?? 0).toString()]);

            // IP user dicatat untuk keperluan audit trail / log
            if (userContext.ip) {
                await client.query("SELECT set_config('app.current_user_ip', $1, true);", [userContext.ip]);
            }
        }

        // Eksekusi query utama yang diminta oleh controller
        const result = await client.query(queryText, params);

        // Commit — simpan perubahan karena tidak ada error
        await client.query('COMMIT');
        return result;
    } catch (err) {
        // Rollback — batalkan semua perubahan jika terjadi error
        await client.query('ROLLBACK');
        throw err;
    } finally {
        /*
         * KEMBALIKAN KONEKSI KE POOL.
         * SET LOCAL otomatis di-reset saat koneksi dikembalikan,
         * jadi koneksi bersih siap dipakai request berikutnya.
         */
        client.release();
    }
};

export default pool;