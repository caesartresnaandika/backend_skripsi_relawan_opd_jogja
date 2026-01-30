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
        // Query JOIN Lengkap (User + Relawan + Komunitas + OPD)
        let query = `
      SELECT 
        r.relawan_id, r.nik, u.nama_lengkap, 
        r.jenis_kelamin, r.no_hp, r.status_bpjs_aktif,
        k.nama_komunitas, o.nama_opd 
      FROM relawan r
      JOIN users u ON r.user_id = u.user_id
      JOIN komunitas k ON r.komunitas_id = k.komunitas_id
      JOIN opd o ON k.opd_id = o.opd_id
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.getAllRelawan = getAllRelawan;
// 2. DETAIL RELAWAN (GET BY ID)
const getRelawanById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield db_1.default.query(`SELECT r.*, u.nama_lengkap, k.nama_komunitas, o.nama_opd
       FROM relawan r 
       JOIN users u ON r.user_id = u.user_id
       JOIN komunitas k ON r.komunitas_id = k.komunitas_id
       JOIN opd o ON k.opd_id = o.opd_id
       WHERE r.relawan_id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Relawan tidak ditemukan' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err.message);
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
        const check = yield db_1.default.query('SELECT * FROM relawan WHERE relawan_id = $1', [id]);
        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Relawan tidak ditemukan' });
            return;
        }
        const result = yield db_1.default.query(`UPDATE relawan 
       SET no_hp = $1, alamat_domisili = $2, status_bpjs_aktif = $3, updated_at = NOW()
       WHERE relawan_id = $4 RETURNING *`, [no_hp, alamat_domisili, status_bpjs_aktif, id]);
        res.json({ message: 'Data berhasil diupdate!', data: result.rows[0] });
    }
    catch (err) {
        console.error(err.message);
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
        res.status(500).send('Server Error');
    }
});
exports.deleteRelawan = deleteRelawan;
