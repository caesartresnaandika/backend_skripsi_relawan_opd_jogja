//db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Mengambil settingan dari file .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

/**
 * [HELPER RLS] Mengeksekusi query dengan menyertakan context User (ID dan Role).
 * Wajib digunakan untuk semua tabel yang mengaktifkan Row-Level Security (RLS).
 */
export const executeQueryWithContext = async (
    queryText: string,
    params: any[] = [],
    userContext?: { id: number; role: string; opd_id?: number; ip?: string }
) => {
    // Pinjam 1 koneksi dari pool
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Mulai transaksi
        if (userContext && userContext.id) {
            await client.query("SELECT set_config('app.current_user_id', $1, true);", [userContext.id.toString()]);
            await client.query("SELECT set_config('app.current_user_role', $1, true);", [userContext.role]);
            // Tambah baris ini untuk mendukung policy opd_access_kader:
            const opdId = (userContext as any).opd_id;
            await client.query("SELECT set_config('app.current_opd_id', $1, true);", [(opdId ?? 0).toString()]);

            if (userContext.ip) {
                await client.query("SELECT set_config('app.current_user_ip', $1, true);", [userContext.ip]);
            }
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