import { Request, Response } from 'express';
import pool from '../../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// === 1. FITUR REGISTRASI (Untuk bikin user baru dengan password aman) ===
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


// === 2. FITUR LOGIN (Inti Skripsi) ===
export const login = async (req: Request, res: Response) => {
    const { nik, password } = req.body;

    try {
        // 1. Cari user berdasarkan NIK
        const user = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'NIK tidak ditemukan' });
        }

        // 2. Cek Password (Bandingkan password input vs password database)
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah!' });
        }

        // 3. Buat Token (JWT) sebagai tiket masuk
        const token = jwt.sign(
            { id: user.rows[0].user_id, role: user.rows[0].role },
            process.env.JWT_SECRET || 'rahasia_skripsi_caesar', // Pastikan ada di .env
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login Berhasil!',
            token: token,
            user: {
                nik: user.rows[0].nik,
                nama: user.rows[0].nama_lengkap,
                role: user.rows[0].role
            }
        });

    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};