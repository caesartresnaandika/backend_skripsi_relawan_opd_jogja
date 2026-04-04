//authController
import { Request, Response } from 'express';
import pool from '../../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// === 1. FITUR REGISTRASI ===
export const register = async (req: Request, res: Response) => {
    const { nik, nama_lengkap, password, role } = req.body;

    try {
        // Cek apakah NIK sudah ada
        const userExist = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'NIK sudah terdaftar!' });
        }

        // Enkripsi Password (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Masukkan ke Database
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


// === 2. FITUR LOGIN ===
export const login = async (req: Request, res: Response) => {
    const { nik, password } = req.body;

    try {
        // 1. Cari user berdasarkan NIK
        const userQuery = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);

        if (userQuery.rows.length === 0) {
            return res.status(400).json({ message: 'NIK tidak ditemukan' });
        }

        const user = userQuery.rows[0];

        // 2. Cek Password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah!' });
        }

        // 3. Penyelidikan Ekstra Khusus OPD
        let opd_id = null;
        let nama_opd = null;

        if (user.role === 'opd') {
            // Cari data instansinya di tabel pengelola_opd dan join ke tabel opd
            const opdQuery = await pool.query(`
                SELECT po.opd_id, o.nama_opd 
                FROM pengelola_opd po
                JOIN opd o ON po.opd_id = o.opd_id
                WHERE po.user_id = $1
            `, [user.user_id]);

            if (opdQuery.rows.length > 0) {
                opd_id = opdQuery.rows[0].opd_id;
                nama_opd = opdQuery.rows[0].nama_opd;
            } else {
                // Opsional: Bisa diblokir login-nya jika dia OPD tapi tidak punya instansi
                console.warn(`User ${user.nama_lengkap} (OPD) belum di-assign ke instansi mana pun.`);
            }
        }

        // 4. Buat Token (JWT)
        const token = jwt.sign(
            { 
                id: user.user_id, 
                role: user.role,
                opd_id: opd_id 
            },
            process.env.JWT_SECRET || 'rahasia_skripsi_caesar', 
            { expiresIn: '2h' }
        );

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

    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};