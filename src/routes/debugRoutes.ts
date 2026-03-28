import { Router, Request, Response } from 'express';
import pool from '../../config/db';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/db-test', async (req: Request, res: Response) => {
    try {
        const { nik, nama_lengkap, password, role } = req.body;
        
        const timeRes = await pool.query('SELECT NOW()');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123', salt);
        
        const newUser = await pool.query(
            'INSERT INTO users (nik, nama_lengkap, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [nik || '1234567890999999', nama_lengkap || 'Debug User', hashedPassword, role || 'super_admin']
        );
        
        res.json({
            status: "SUCCESS",
            db_time: timeRes.rows[0],
            user_inserted: newUser.rows[0]
        });
        
    } catch (error: any) {
        res.status(500).json({
            status: "FAILED_DATABASE_ERROR",
            error_message: error.message,
            error_detail: error.detail,
            error_code: error.code,
            full_error: error
        });
    }
});

export default router;