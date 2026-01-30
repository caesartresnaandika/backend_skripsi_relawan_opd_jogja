import { Request, Response } from 'express';
import pool from '../../config/db';

// 1. AMBIL SEMUA RELAWAN + PENCARIAN (F-05)
export const getAllRelawan = async (req: Request, res: Response) => {
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

    const result = await pool.query(query);
    res.json({
      message: 'Berhasil mengambil data relawan',
      total: result.rowCount,
      data: result.rows
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 2. DETAIL RELAWAN (GET BY ID)
export const getRelawanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.nama_lengkap, k.nama_komunitas, o.nama_opd
       FROM relawan r 
       JOIN users u ON r.user_id = u.user_id
       JOIN komunitas k ON r.komunitas_id = k.komunitas_id
       JOIN opd o ON k.opd_id = o.opd_id
       WHERE r.relawan_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Relawan tidak ditemukan' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 3. UPDATE DATA RELAWAN (F-01)
export const updateRelawan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { no_hp, alamat_domisili, status_bpjs_aktif } = req.body;

    // Cek dulu apakah data ada
    const check = await pool.query('SELECT * FROM relawan WHERE relawan_id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ message: 'Relawan tidak ditemukan' });
      return;
    }

    const result = await pool.query(
      `UPDATE relawan 
       SET no_hp = $1, alamat_domisili = $2, status_bpjs_aktif = $3, updated_at = NOW()
       WHERE relawan_id = $4 RETURNING *`,
      [no_hp, alamat_domisili, status_bpjs_aktif, id]
    );

    res.json({ message: 'Data berhasil diupdate!', data: result.rows[0] });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 4. HAPUS RELAWAN (F-01)
export const deleteRelawan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM relawan WHERE relawan_id = $1', [id]);
    res.json({ message: 'Relawan berhasil dihapus' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};