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
exports.deleteRelawan = exports.updateRelawan = exports.getRelawanById = exports.getAllRelawan = void 0;
const db_1 = __importDefault(require("../../config/db"));
// 1. AMBIL SEMUA RELAWAN + PENCARIAN (F-05)
const getAllRelawan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword } = req.query; // Ambil parameter ?keyword=nama
        // Perbaikan Query JOIN Lengkap: 
        // Lewati penugasan_relawan dulu, gunakan LEFT JOIN agar relawan tanpa penugasan tetap muncul
        let query = `
      SELECT 
        r.relawan_id, r.nik, u.nama_lengkap, 
        r.jenis_kelamin, u.no_hp, r.alamat_domisili,
        o.nama_opd, k.nama_kader, pr.jabatan, pr.penugasan, pr.detail_penugasan
      FROM relawan r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
      LEFT JOIN kader k ON pr.kader_id = k.kader_id
      LEFT JOIN opd o ON pr.opd_id = o.opd_id
    `;
        // Logika Filter Pencarian
        if (keyword) {
            query += ` WHERE u.nama_lengkap ILIKE '%${keyword}%' OR r.nik ILIKE '%${keyword}%'`;
        }
        const result = yield db_1.default.query(query);
        res.json({
            message: 'Berhasil mengambil data relawan',
            total: result.rowCount,
            data: result.rows
        });
    }
    catch (err) {
        console.error('Error getAllRelawan:', err.message);
        res.status(500).send('Server Error');
    }
});
exports.getAllRelawan = getAllRelawan;
// 2. DETAIL RELAWAN (GET BY ID)
const getRelawanById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Perbaikan Query JOIN: Sama seperti getAllRelawan
        const result = yield db_1.default.query(`SELECT 
        r.*, u.nama_lengkap, u.no_hp,
        o.nama_opd, k.nama_kader, pr.jabatan, pr.penugasan, pr.detail_penugasan, pr.status_keaktifan
       FROM relawan r 
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
       LEFT JOIN kader k ON pr.kader_id = k.kader_id
       LEFT JOIN opd o ON pr.opd_id = o.opd_id
       WHERE r.relawan_id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Relawan tidak ditemukan' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error getRelawanById:', err.message);
        res.status(500).send('Server Error');
    }
});
exports.getRelawanById = getRelawanById;
// 3. UPDATE DATA RELAWAN (F-01)
const updateRelawan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { no_hp, alamat_domisili, status_bpjs_aktif } = req.body;
        // Cek dulu apakah data ada
        const check = yield db_1.default.query('SELECT user_id FROM relawan WHERE relawan_id = $1', [id]);
        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Relawan tidak ditemukan' });
            return;
        }
        const userId = check.rows[0].user_id;
        // Catatan: Jika field no_hp ada di tabel users, Anda mungkin perlu melakukan 2 query update (users dan relawan)
        // Di bawah ini saya membiarkan logika update tabel relawan sesuai rancangan awal Anda, 
        // pastikan field di tabel sesuai.
        const result = yield db_1.default.query(`UPDATE relawan 
       SET alamat_domisili = $1, updated_at = NOW()
       WHERE relawan_id = $2 RETURNING *`, [alamat_domisili, id]);
        // Jika Anda ingin mengupdate no_hp di tabel users:
        if (no_hp) {
            yield db_1.default.query(`UPDATE users SET no_hp = $1, updated_at = NOW() WHERE user_id = $2`, [no_hp, userId]);
        }
        res.json({ message: 'Data berhasil diupdate!', data: result.rows[0] });
    }
    catch (err) {
        console.error('Error updateRelawan:', err.message);
        res.status(500).send('Server Error');
    }
});
exports.updateRelawan = updateRelawan;
// 4. HAPUS RELAWAN (F-01)
const deleteRelawan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield db_1.default.query('DELETE FROM relawan WHERE relawan_id = $1', [id]);
        res.json({ message: 'Relawan berhasil dihapus' });
    }
    catch (err) {
        console.error('Error deleteRelawan:', err.message);
        res.status(500).send('Server Error');
    }
});
exports.deleteRelawan = deleteRelawan;
