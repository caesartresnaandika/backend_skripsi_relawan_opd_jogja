"use strict";
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
// Mengambil settingan dari file .env kamu tadi
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    // Fallback if DATABASE_URL is not provided:
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
const executeQueryWithContext = (queryText_1, ...args_1) => __awaiter(void 0, [queryText_1, ...args_1], void 0, function* (queryText, params = [], userContext) {
    // Pinjam 1 koneksi dari pool
    const client = yield pool.connect();
    try {
        yield client.query('BEGIN'); // Mulai transaksi
        if (userContext && userContext.id) {
            // Gunakan set_config() alih-alih SET LOCAL karena SET LOCAL tidak mendukung parameter binding ($1)
            yield client.query("SELECT set_config('app.current_user_id', $1, true);", [userContext.id.toString()]);
            yield client.query("SELECT set_config('app.current_user_role', $1, true);", [userContext.role]);
        }
        // Eksekusi query aslinya
        const result = yield client.query(queryText, params);
        yield client.query('COMMIT'); // Simpan perubahan jika tidak ada error
        return result;
    }
    catch (err) {
        yield client.query('ROLLBACK'); // Batalkan jika ada error
        throw err;
    }
    finally {
        // SET LOCAL otomatis di-reset saat koneksi dikembalikan ke pool (karena ROLLBACK atau COMMIT)
        client.release();
    }
});
exports.executeQueryWithContext = executeQueryWithContext;
exports.default = pool;
