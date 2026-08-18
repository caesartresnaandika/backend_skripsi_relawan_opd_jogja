"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQueryWithContext = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/*
 * MEMBUAT CONNECTION POLL
 * Pool digunakan untuk mengelola banyak koneksi database secara efisien.
 * Koneksi diambil dari pool saat dibutuhkan dan dikembalikan setelah selesai.
 * Konfigurasi diambil dari environment variable (file .env).
 */
const poolConfig = {};
if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
}
else {
    poolConfig.user = process.env.DB_USER;
    poolConfig.host = process.env.DB_HOST;
    poolConfig.database = process.env.DB_NAME;
    poolConfig.password = process.env.DB_PASSWORD;
    poolConfig.port = Number(process.env.DB_PORT) || 5432;
}
const pool = new pg_1.Pool(poolConfig);
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
const executeQueryWithContext = (queryText_1, ...args_1) => __awaiter(void 0, [queryText_1, ...args_1], void 0, function* (queryText, params = [], userContext) {
    // Pinjam 1 koneksi dari pool untuk transaksi ini
    const client = yield pool.connect();
    try {
        // Mulai transaksi — SET LOCAL hanya berlaku dalam transaksi
        yield client.query('BEGIN');
        // Jika ada user yang login, kirim konteksnya ke session PostgreSQL
        if (userContext && userContext.id) {
            // Set variable session agar policy RLS bisa membaca siapa user-nya
            yield client.query("SELECT set_config('app.current_user_id', $1, true);", [userContext.id.toString()]);
            yield client.query("SELECT set_config('app.current_user_role', $1, true);", [userContext.role]);
            // OPD ID diperlukan untuk policy yang membatasi akses per OPD
            const opdId = userContext.opd_id;
            yield client.query("SELECT set_config('app.current_opd_id', $1, true);", [(opdId !== null && opdId !== void 0 ? opdId : 0).toString()]);
            // IP user dicatat untuk keperluan audit trail / log
            if (userContext.ip) {
                yield client.query("SELECT set_config('app.current_user_ip', $1, true);", [userContext.ip]);
            }
        }
        // Eksekusi query utama yang diminta oleh controller
        const result = yield client.query(queryText, params);
        // Commit — simpan perubahan karena tidak ada error
        yield client.query('COMMIT');
        return result;
    }
    catch (err) {
        // Rollback — batalkan semua perubahan jika terjadi error
        yield client.query('ROLLBACK');
        throw err;
    }
    finally {
        /*
         * KEMBALIKAN KONEKSI KE POOL.
         * SET LOCAL otomatis di-reset saat koneksi dikembalikan,
         * jadi koneksi bersih siap dipakai request berikutnya.
         */
        client.release();
    }
});
exports.executeQueryWithContext = executeQueryWithContext;
exports.default = pool;
