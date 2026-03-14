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
exports.login = exports.register = void 0;
const db_1 = __importDefault(require("../../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// === 1. FITUR REGISTRASI (Untuk bikin user baru dengan password aman) ===
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nik, nama_lengkap, password, role } = req.body;
    try {
        // Cek apakah NIK sudah ada
        const userExist = yield db_1.default.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'NIK sudah terdaftar!' });
        }
        // Enkripsi Password (Hashing)
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Masukkan ke Database
        const newUser = yield db_1.default.query('INSERT INTO users (nik, nama_lengkap, password, role) VALUES ($1, $2, $3, $4) RETURNING *', [nik, nama_lengkap, hashedPassword, role]);
        res.json({ message: 'Registrasi Berhasil!', user: newUser.rows[0] });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.register = register;
// === 2. FITUR LOGIN (Inti Skripsi) ===
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nik, password } = req.body;
    try {
        // 1. Cari user berdasarkan NIK
        const user = yield db_1.default.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'NIK tidak ditemukan' });
        }
        // 2. Cek Password (Bandingkan password input vs password database)
        const validPassword = yield bcrypt_1.default.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah!' });
        }
        // 3. Buat Token (JWT) sebagai tiket masuk
        const token = jsonwebtoken_1.default.sign({ id: user.rows[0].user_id, role: user.rows[0].role }, process.env.JWT_SECRET || 'rahasia_skripsi_caesar', // Pastikan ada di .env
        { expiresIn: '2h' });
        res.json({
            message: 'Login Berhasil!',
            token: token,
            user: {
                nik: user.rows[0].nik,
                nama: user.rows[0].nama_lengkap,
                role: user.rows[0].role
            }
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.login = login;
