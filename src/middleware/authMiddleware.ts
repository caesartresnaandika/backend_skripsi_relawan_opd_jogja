// authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Express } from 'express';  // ✅ Import Express type
import dotenv from 'dotenv';

dotenv.config();

// ✅ Custom Type: Request yang membawa data User
export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        opd_id?: number;
        nama_opd?: string;
    };
    file?: Express.Multer.File;  // ✅ Untuk multer single file
    files?: Express.Multer.File[];  // ✅ Untuk multer multiple files
}

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Akses Ditolak! Butuh Token.' });
        return;
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_skripsi_caesar');
        
        // ✅ FIXED: Type assertion untuk JWT payload
        req.user = verified as {
            id: number;
            role: string;
            opd_id?: number;
            nama_opd?: string;
        };
        
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