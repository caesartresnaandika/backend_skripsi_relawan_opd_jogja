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
// === 1. FITUR REGISTRASI (Dilindungi Setup Key) ===
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // ── Validasi Setup Key ──
    // Hanya request dengan header X-Setup-Key yang benar yang diizinkan
    const setupKey = req.headers['x-setup-key'];
    if (!setupKey || setupKey !== process.env.SETUP_SECRET_KEY) {
        return res.status(403).json({ message: 'Akses Ditolak! Setup key tidak valid.' });
    }
    const { nik, nama_lengkap, password, role } = req.body;
    try {
        // Cek apakah NIK sudah ada
        const userExist = yield db_1.default.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'NIK sudah terdaftar!' });
        }
        // Enkripsi Password (Hashing)
        const salt = yield bcrypt_1.default.genSalt(12);
        // Register
        const hashedPassword = yield bcrypt_1.default.hash(password + process.env.PASSWORD_PEPPER, salt);
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
// === 2. FITUR LOGIN ===
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nik, password } = req.body;
    try {
        // 1. Cari user berdasarkan NIK
        const userQuery = yield db_1.default.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userQuery.rows.length === 0) {
            return res.status(400).json({ message: 'NIK tidak ditemukan' });
        }
        const user = userQuery.rows[0];
        // 2. Cek Password
        const validPassword = yield bcrypt_1.default.compare(password + process.env.PASSWORD_PEPPER, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah!' });
        }
        // 3. Penyelidikan Ekstra Khusus OPD
        let opd_id = null;
        let nama_opd = null;
        if (user.role === 'opd') {
            // Cari data instansinya di tabel pengelola_opd dan join ke tabel opd
            const opdQuery = yield db_1.default.query(`
                SELECT po.opd_id, o.nama_opd 
                FROM pengelola_opd po
                JOIN opd o ON po.opd_id = o.opd_id
                WHERE po.user_id = $1 AND po.status = 'Aktif'
            `, [user.user_id]);
            if (opdQuery.rows.length > 0) {
                opd_id = opdQuery.rows[0].opd_id;
                nama_opd = opdQuery.rows[0].nama_opd;
            }
            else {
                // Opsional: Bisa diblokir login-nya jika dia OPD tapi tidak punya instansi
                console.warn(`User ${user.nama_lengkap} (OPD) belum di-assign ke instansi mana pun.`);
            }
        }
        // 4. Buat Token (JWT)
        const token = jsonwebtoken_1.default.sign({
            id: user.user_id,
            role: user.role,
            opd_id: opd_id
        }, process.env.JWT_SECRET || 'rahasia_skripsi_caesar', { expiresIn: '1h' });
        // 5. Kirim Respons Lengkap ke Frontend
        res.json({
            message: 'Login Berhasil!',
            token: token,
            user: {
                nik: user.nik,
                nama: user.nama_lengkap,
                role: user.role,
                opd_id: opd_id,
                nama_opd: nama_opd
            }
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.login = login;
