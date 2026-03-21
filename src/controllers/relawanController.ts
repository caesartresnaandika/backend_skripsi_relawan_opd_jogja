// import { Request, Response } from 'express';
// import pool from '../../config/db';

// // 1. AMBIL SEMUA RELAWAN + PENCARIAN (F-05)
// export const getAllRelawan = async (req: Request, res: Response) => {
//   try {
//     const { keyword } = req.query; // Ambil parameter ?keyword=nama

//     // Query JOIN Lengkap (User + Relawan + kader + OPD)
//     let query = `
//       SELECT 
//         r.relawan_id, r.nik, u.nama_lengkap, 
//         r.jenis_kelamin, r.no_hp, r.status_bpjs_aktif,
//         k.nama_kader, o.nama_opd 
//       FROM relawan r
//       JOIN users u ON r.user_id = u.user_id
//       JOIN kader k ON r.kader_id = k.kader_id
//       JOIN opd o ON k.opd_id = o.opd_id
//     `;

//     // Logika Filter Pencarian
//     if (keyword) {
//       query += ` WHERE u.nama_lengkap ILIKE '%${keyword}%' OR r.nik ILIKE '%${keyword}%'`;
//     }

//     const result = await pool.query(query);
//     res.json({
//       message: 'Berhasil mengambil data relawan',
//       total: result.rowCount,
//       data: result.rows
//     });
//   } catch (err: any) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// };

// // 2. DETAIL RELAWAN (GET BY ID)
// export const getRelawanById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query(
//       `SELECT r.*, u.nama_lengkap, k.nama_kader, o.nama_opd
//        FROM relawan r 
//        JOIN users u ON r.user_id = u.user_id
//        JOIN kader k ON r.kader_id = k.kader_id
//        JOIN opd o ON k.opd_id = o.opd_id
//        WHERE r.relawan_id = $1`,
//       [id]
//     );

//     if (result.rows.length === 0) {
//       res.status(404).json({ message: 'Relawan tidak ditemukan' });
//       return;
//     }
//     res.json(result.rows[0]);
//   } catch (err: any) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// };

// // 3. UPDATE DATA RELAWAN (F-01)
// export const updateRelawan = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { no_hp, alamat_domisili, status_bpjs_aktif } = req.body;

//     // Cek dulu apakah data ada
//     const check = await pool.query('SELECT * FROM relawan WHERE relawan_id = $1', [id]);
//     if (check.rows.length === 0) {
//       res.status(404).json({ message: 'Relawan tidak ditemukan' });
//       return;
//     }

//     const result = await pool.query(
//       `UPDATE relawan 
//        SET no_hp = $1, alamat_domisili = $2, status_bpjs_aktif = $3, updated_at = NOW()
//        WHERE relawan_id = $4 RETURNING *`,
//       [no_hp, alamat_domisili, status_bpjs_aktif, id]
//     );

//     res.json({ message: 'Data berhasil diupdate!', data: result.rows[0] });
//   } catch (err: any) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// };

// // 4. HAPUS RELAWAN (F-01)
// export const deleteRelawan = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     await pool.query('DELETE FROM relawan WHERE relawan_id = $1', [id]);
//     res.json({ message: 'Relawan berhasil dihapus' });
//   } catch (err) {
//     res.status(500).send('Server Error');
//   }
// };


import { Request, Response } from 'express';
import pool from '../../config/db';

// 1. AMBIL SEMUA RELAWAN + PENCARIAN (F-05)
export const getAllRelawan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword } = req.query; // Ambil parameter ?keyword=nama

    // Perbaikan Query JOIN Lengkap: 
    // Lewati penugasan_relawan dulu, gunakan LEFT JOIN agar relawan tanpa penugasan tetap muncul
    let query = `
      SELECT 
        r.relawan_id, r.nik, u.nama_lengkap, 
        r.jenis_kelamin, u.no_hp, r.alamat_domisili,
        o.nama_opd, k.nama_kader, pr.jabatan, pr.penugasan, pr.detail_penugasan
      FROM relawan r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
      LEFT JOIN kader k ON pr.kader_id = k.kader_id
      LEFT JOIN opd o ON pr.opd_id = o.opd_id
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
    console.error('Error getAllRelawan:', err.message);
    res.status(500).send('Server Error');
  }
};

// 2. DETAIL RELAWAN (GET BY ID)
export const getRelawanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Perbaikan Query JOIN: Sama seperti getAllRelawan
    const result = await pool.query(
      `SELECT 
        r.*, u.nama_lengkap, u.no_hp, u.email,
        o.nama_opd, k.nama_kader, pr.jabatan, pr.penugasan, pr.detail_penugasan, pr.status_keaktifan
       FROM relawan r 
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
       LEFT JOIN kader k ON pr.kader_id = k.kader_id
       LEFT JOIN opd o ON pr.opd_id = o.opd_id
       WHERE r.relawan_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Relawan tidak ditemukan' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error getRelawanById:', err.message);
    res.status(500).send('Server Error');
  }
};

// 3. UPDATE DATA RELAWAN (F-01)
export const updateRelawan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { no_hp, alamat_domisili, status_bpjs_aktif } = req.body;

    // Cek dulu apakah data ada
    const check = await pool.query('SELECT user_id FROM relawan WHERE relawan_id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ message: 'Relawan tidak ditemukan' });
      return;
    }

    const userId = check.rows[0].user_id;

    // Catatan: Jika field no_hp ada di tabel users, Anda mungkin perlu melakukan 2 query update (users dan relawan)
    // Di bawah ini saya membiarkan logika update tabel relawan sesuai rancangan awal Anda, 
    // pastikan field di tabel sesuai.
    const result = await pool.query(
      `UPDATE relawan 
       SET alamat_domisili = $1, updated_at = NOW()
       WHERE relawan_id = $2 RETURNING *`,
      [alamat_domisili, id]
    );

    // Jika Anda ingin mengupdate no_hp di tabel users:
    if (no_hp) {
      await pool.query(
        `UPDATE users SET no_hp = $1, updated_at = NOW() WHERE user_id = $2`,
        [no_hp, userId]
      );
    }

    res.json({ message: 'Data berhasil diupdate!', data: result.rows[0] });
  } catch (err: any) {
    console.error('Error updateRelawan:', err.message);
    res.status(500).send('Server Error');
  }
};

// 4. HAPUS RELAWAN (F-01)
export const deleteRelawan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM relawan WHERE relawan_id = $1', [id]);
    res.json({ message: 'Relawan berhasil dihapus' });
  } catch (err: any) {
    console.error('Error deleteRelawan:', err.message);
    res.status(500).send('Server Error');
  }
};