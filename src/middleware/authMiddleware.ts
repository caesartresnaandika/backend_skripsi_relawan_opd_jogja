// backend/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import dotenv from 'dotenv';
import pool from '../../config/db';

dotenv.config();

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        opd_id?: number;
        nama_opd?: string;
    };
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
}

const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Akses Ditolak! Butuh Token.' });
        return;
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_skripsi_caesar');
        
        req.user = verified as {
            id: number;
            role: string;
            opd_id?: number;
            nama_opd?: string;
        };

        // ✅ FIXED: Set context untuk RLS (untuk semua user, bukan hanya OPD)
        await pool.query("SET LOCAL app.current_user_id = $1;", [req.user.id]);
        await pool.query("SET LOCAL app.current_user_role = $1;", [req.user.role]);
        
        // Set opd_id jika ada (untuk OPD user)
        if (req.user.opd_id) {
            await pool.query("SET LOCAL app.current_opd_id = $1;", [req.user.opd_id]);
        }

        next();
    } catch (err) {
        res.status(400).json({ message: 'Token Tidak Valid!' });
    }
};

// === MIDDLEWARE KHUSUS RBAC (ROLE-BASED ACCESS CONTROL) ===
export const authorizeRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        // Pastikan verifyToken sudah dijalankan sebelumnya sehingga req.user ada
        if (!req.user || !req.user.role) {
            res.status(403).json({ message: 'Akses Ditolak! Role tidak ditemukan.' });
            return;
        }

        // Cek apakah role user saat ini ada di dalam daftar allowedRoles
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: `Akses Ditolak! Halaman ini hanya untuk role: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next(); // Lanjut ke controller jika role sesuai
    };
};

export default verifyToken;