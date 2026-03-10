import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Mengambil settingan dari file .env kamu tadi
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

/**
 * [HELPER RLS] Mengeksekusi query dengan menyertakan context User (ID dan Role).
 * Wajib digunakan untuk semua tabel yang mengaktifkan Row-Level Security (RLS).
 */
export const executeQueryWithContext = async (
    queryText: string,
    params: any[] = [],
    userContext?: { id: number; role: string }
) => {
    // Pinjam 1 koneksi dari pool
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Mulai transaksi

        if (userContext && userContext.id) {
            // Gunakan set_config() alih-alih SET LOCAL karena SET LOCAL tidak mendukung parameter binding ($1)
            await client.query("SELECT set_config('app.current_user_id', $1, true);", [userContext.id.toString()]);
            await client.query("SELECT set_config('app.current_user_role', $1, true);", [userContext.role]);
        }

        // Eksekusi query aslinya
        const result = await client.query(queryText, params);

        await client.query('COMMIT'); // Simpan perubahan jika tidak ada error
        return result;
    } catch (err) {
        await client.query('ROLLBACK'); // Batalkan jika ada error
        throw err;
    } finally {
        // SET LOCAL otomatis di-reset saat koneksi dikembalikan ke pool (karena ROLLBACK atau COMMIT)
        client.release();
    }
};

export default pool;
