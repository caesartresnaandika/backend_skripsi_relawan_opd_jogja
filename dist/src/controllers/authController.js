"use strict";
/*
 * ============================================================
 * AUTH CONTROLLER — REGISTRASI & LOGIN
 * ============================================================
 * Menangani proses registrasi akun baru dan login user.
 *
 * Fitur:
 * 1. Registrasi: Membuat user baru (super_admin, opd, atau relawan)
 *    dengan proteksi SETUP_SECRET_KEY agar tidak sembarang orang
 *    bisa mendaftar.
 * 2. Login: Memverifikasi NIK dan password, lalu mengeluarkan
 *    token JWT yang berisi identitas user (termasuk opd_id untuk role OPD).
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
exports.login = exports.register = void 0;
const db_1 = __importDefault(require("../../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const regex_1 = require("../utils/regex");
dotenv_1.default.config();
/*
 * ============================================
 * 1. FUNGSI REGISTRASI
 * ============================================
 * Membuat user baru di sistem. Dilindungi oleh SETUP_SECRET_KEY
 * yang harus dikirim via header X-Setup-Key. Ini memastikan hanya
 * admin yang tahu kunci rahasia yang bisa mendaftarkan akun baru.
 *
 * Alur:
 * 1. Validasi Setup Key dari header
 * 2. Validasi NIK (16 digit angka)
 * 3. Cek duplikasi NIK
 * 4. Hash password dengan bcrypt + pepper
 * 5. Simpan user ke database
 * ============================================
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validasi Setup Key — hanya admin dengan kunci rahasia bisa daftarkan user
    const setupKey = req.headers['x-setup-key'];
    if (!setupKey || setupKey !== process.env.SETUP_SECRET_KEY) {
        return res.status(403).json({ message: 'Akses Ditolak! Setup key tidak valid.' });
    }
    const { nik, nama_lengkap, password, role } = req.body;
    // Validasi NIK: harus 16 digit angka sesuai format KTP
    if (!nik || !regex_1.REGEX_PATTERNS.NIK.test(nik)) {
        return res.status(400).json({ message: 'NIK harus terdiri dari tepat 16 digit angka' });
    }
    if (nama_lengkap) {
        if (nama_lengkap.trim().length < 3) {
            return res.status(400).json({ message: 'Nama lengkap minimal 3 karakter' });
        }
        if (!regex_1.REGEX_PATTERNS.NAMA_RELAWAN.test(nama_lengkap)) {
            return res.status(400).json({ message: 'Nama lengkap tidak boleh mengandung angka atau karakter spesial selain tanda baca nama' });
        }
    }
    try {
        // Cek apakah NIK sudah terdaftar (tidak boleh duplikat)
        const userExist = yield db_1.default.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'NIK sudah terdaftar!' });
        }
        // Enkripsi password dengan bcrypt (12 salt rounds) + pepper rahasia
        // Pepper adalah string rahasia tambahan dari .env yang membuat hash
        // lebih aman meskipun database bocor
        const salt = yield bcrypt_1.default.genSalt(12);
        const hashedPassword = yield bcrypt_1.default.hash(password + process.env.PASSWORD_PEPPER, salt);
        // Simpan user baru ke database
        const newUser = yield db_1.default.query('INSERT INTO users (nik, nama_lengkap, password, role) VALUES ($1, $2, $3, $4) RETURNING *', [nik, nama_lengkap, hashedPassword, role]);
        res.json({ message: 'Registrasi Berhasil!', user: newUser.rows[0] });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.register = register;
/*
 * ============================================
 * 2. FUNGSI LOGIN
 * ============================================
 * Memverifikasi kredensial user (NIK & password) dan mengeluarkan
 * token JWT yang berisi data identitas untuk akses selanjutnya.
 *
 * Alur:
 * 1. Cari user berdasarkan NIK
 * 2. Verifikasi password (bcrypt compare + pepper)
 * 3. Khusus role OPD: cari data instansi (opd_id) dari tabel pengelola_opd
 * 4. Generate token JWT dengan payload {id, role, opd_id}
 * 5. Kirim token + data user ke frontend
 *
 * Token JWT berlaku selama 1 jam (expiresIn: '1h')
 * ============================================
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nik, password } = req.body;
    try {
        // Langkah 1: Cari user berdasarkan NIK
        const userQuery = yield db_1.default.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userQuery.rows.length === 0) {
            return res.status(400).json({ message: 'NIK tidak ditemukan' });
        }
        const user = userQuery.rows[0];
        // Langkah 2: Verifikasi password menggunakan bcrypt.compare
        // Password yang diinput + pepper dibandingkan dengan hash di database
        const validPassword = yield bcrypt_1.default.compare(password + process.env.PASSWORD_PEPPER, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah!' });
        }
        /*
         * Langkah 3: Khusus role OPD — cari instansinya
         * Jika user adalah admin OPD, kita perlu mencari OPD tempat
         * dia bekerja dari tabel pengelola_opd. Data ini akan disimpan
         * di token JWT agar tidak perlu query ulang setiap request.
         */
        let opd_id = null;
        let nama_opd = null;
        if (user.role === 'opd') {
            // Join tabel pengelola_opd dengan opd untuk mendapatkan nama OPD
            const opdQuery = yield db_1.default.query(`
                SELECT po.opd_id, o.nama_opd 
                FROM pengelola_opd po
                JOIN opd o ON po.opd_id = o.opd_id
                WHERE po.user_id = $1 AND po.status_keaktifan = 'Aktif'
            `, [user.user_id]);
            if (opdQuery.rows.length > 0) {
                opd_id = opdQuery.rows[0].opd_id;
                nama_opd = opdQuery.rows[0].nama_opd;
            }
            else {
                // Jika OPD tidak punya instansi, login tetap diizinkan tapi tanpa opd_id
                console.warn(`User ${user.nama_lengkap} (OPD) belum di-assign ke instansi mana pun.`);
            }
        }
        /*
         * Langkah 4: Generate token JWT
         * Token berisi: id, role, dan opd_id (khusus OPD)
         * Token ini akan dikirim di setiap request selanjutnya
         * di header Authorization: Bearer <token>
         */
        const token = jsonwebtoken_1.default.sign({
            id: user.user_id,
            role: user.role,
            opd_id: opd_id
        }, process.env.JWT_SECRET || 'rahasia_skripsi_caesar', { expiresIn: '1h' });
        // Langkah 5: Kirim response lengkap ke frontend
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
