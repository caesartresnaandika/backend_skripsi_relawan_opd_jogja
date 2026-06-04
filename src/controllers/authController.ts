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

import { Request, Response } from 'express';
import pool from '../../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

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
export const register = async (req: Request, res: Response) => {
    // Validasi Setup Key — hanya admin dengan kunci rahasia bisa daftarkan user
    const setupKey = req.headers['x-setup-key'] as string | undefined;
    if (!setupKey || setupKey !== process.env.SETUP_SECRET_KEY) {
        return res.status(403).json({ message: 'Akses Ditolak! Setup key tidak valid.' });
    }

    const { nik, nama_lengkap, password, role } = req.body;
    
    // Validasi NIK: harus 16 digit angka sesuai format KTP
    if (!nik || !/^\d{16}$/.test(nik)) {
        return res.status(400).json({ message: 'NIK harus terdiri dari tepat 16 digit angka' });
    }

    try {
        // Cek apakah NIK sudah terdaftar (tidak boleh duplikat)
        const userExist = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'NIK sudah terdaftar!' });
        }

        // Enkripsi password dengan bcrypt (12 salt rounds) + pepper rahasia
        // Pepper adalah string rahasia tambahan dari .env yang membuat hash
        // lebih aman meskipun database bocor
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password + process.env.PASSWORD_PEPPER, salt);

        // Simpan user baru ke database
        const newUser = await pool.query(
            'INSERT INTO users (nik, nama_lengkap, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [nik, nama_lengkap, hashedPassword, role]
        );

        res.json({ message: 'Registrasi Berhasil!', user: newUser.rows[0] });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

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
export const login = async (req: Request, res: Response) => {
    const { nik, password } = req.body;

    try {
        // Langkah 1: Cari user berdasarkan NIK
        const userQuery = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);

        if (userQuery.rows.length === 0) {
            return res.status(400).json({ message: 'NIK tidak ditemukan' });
        }

        const user = userQuery.rows[0];

        // Langkah 2: Verifikasi password menggunakan bcrypt.compare
        // Password yang diinput + pepper dibandingkan dengan hash di database
        const validPassword = await bcrypt.compare(password + process.env.PASSWORD_PEPPER, user.password);
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
            const opdQuery = await pool.query(`
                SELECT po.opd_id, o.nama_opd 
                FROM pengelola_opd po
                JOIN opd o ON po.opd_id = o.opd_id
                WHERE po.user_id = $1 AND po.status_keaktifan = 'Aktif'
            `, [user.user_id]);

            if (opdQuery.rows.length > 0) {
                opd_id = opdQuery.rows[0].opd_id;
                nama_opd = opdQuery.rows[0].nama_opd;
            } else {
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
        const token = jwt.sign(
            {
                id: user.user_id,
                role: user.role,
                opd_id: opd_id
            },
            process.env.JWT_SECRET || 'rahasia_skripsi_caesar',
            { expiresIn: '1h' }
        );

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

    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};