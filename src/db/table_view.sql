-- ================================================================
-- DATABASE VIEWS — Pandangan untuk kemudahan query
-- ================================================================
-- View adalah query yang disimpan sebagai tabel virtual.
-- Berguna untuk menyederhanakan query kompleks yang sering dipakai.
--
-- Daftar View:
-- 1. vw_dashboard_statistik → Ringkasan angka dashboard
-- 2. vw_komunitas_saya      → Data relawan + kader + OPD + SK
-- 3. vw_relawan_per_opd     → Jumlah relawan per OPD
-- 4. vw_riwayat_pengajuan   → Riwayat pengajuan perubahan data
-- 5. vw_statistik_gender    → Demografi gender relawan
-- ================================================================

-- 1. vw_dashboard_statistik
-- Menggabungkan beberapa metrik dashboard dalam satu view:
-- total_opd, total_relawan, total_relawan_aktif, total_pengajuan_pending
-- Menggunakan UNION ALL untuk menggabungkan baris-baris metrik.
CREATE OR REPLACE VIEW public.vw_dashboard_statistik
AS SELECT 'total_opd'::text AS metric,
    count(*)::text AS value
   FROM opd
  WHERE opd.opd_id IS NOT NULL
UNION ALL
 SELECT 'total_relawan'::text AS metric,
    count(*)::text AS value
   FROM relawan r
     JOIN users u ON r.user_id = u.user_id
  WHERE u.status_keaktifan = true AND u.role = 'relawan'::user_role
UNION ALL
 SELECT 'total_relawan_aktif'::text AS metric,
    count(*)::text AS value
   FROM penugasan_relawan pr
  WHERE pr.status_keaktifan = 'Aktif'::status_keaktifan
UNION ALL
 SELECT 'total_pengajuan_pending'::text AS metric,
    count(*)::text AS value
   FROM pengajuan_perubahan_data
  WHERE pengajuan_perubahan_data.status = 'Menunggu Review'::status_pengajuan;


-- 2. vw_komunitas_saya
-- Menampilkan informasi lengkap relawan beserta kader, OPD, dan SK-nya.
-- Filter: hanya relawan dengan role = 'relawan' dan status aktif.
CREATE OR REPLACE VIEW public.vw_komunitas_saya
AS SELECT u.user_id,
    r.relawan_id,
    u.nama_lengkap,
    k.kader_id,
    k.nama_kader,
    o.opd_id,
    o.nama_opd,
    pr.jabatan,
    pr.status_keaktifan,
    pr.nomor_sk_manual,
    sk.nomor_sk AS sk_nomor,
    sk.file_path AS sk_file
   FROM users u
     JOIN relawan r ON u.user_id = r.user_id
     JOIN penugasan_relawan pr ON r.relawan_id = pr.relawan_id
     JOIN kader k ON pr.kader_id = k.kader_id
     JOIN opd o ON pr.opd_id = o.opd_id
     LEFT JOIN surat_keputusan sk ON pr.sk_id = sk.sk_id
  WHERE u.role = 'relawan'::user_role AND u.status_keaktifan = true;

-- 3. vw_relawan_per_opd
-- Menampilkan jumlah relawan per OPD, termasuk yang aktif.
-- LEFT JOIN digunakan agar OPD tanpa relawan tetap muncul.
CREATE OR REPLACE VIEW public.vw_relawan_per_opd
AS SELECT o.opd_id,
    o.nama_opd,
    count(pr.relawan_id) AS jumlah_relawan,
    count(
        CASE
            WHEN pr.status_keaktifan = 'Aktif'::status_keaktifan THEN 1
            ELSE NULL::integer
        END) AS jumlah_relawan_aktif
   FROM opd o
     LEFT JOIN penugasan_relawan pr ON o.opd_id = pr.opd_id
     LEFT JOIN relawan r ON pr.relawan_id = r.relawan_id
     LEFT JOIN users u ON r.user_id = u.user_id
  WHERE u.status_keaktifan = true OR u.status_keaktifan IS NULL
  GROUP BY o.opd_id, o.nama_opd
  ORDER BY (count(pr.relawan_id)) DESC;

-- 4. vw_riwayat_pengajuan
-- Menampilkan riwayat pengajuan perubahan data relawan
-- beserta nama verifikator yang mereview.
CREATE OR REPLACE VIEW public.vw_riwayat_pengajuan
AS SELECT pp.pengajuan_id,
    u.user_id,
    u.nama_lengkap,
    r.relawan_id,
    pp.jenis_perubahan,
    pp.status,
    pp.catatan_relawan,
    pp.catatan_verifikator,
    pp.tanggal_pengajuan,
    pp.tanggal_verifikasi,
    vu.nama_lengkap AS verifikator_nama
   FROM pengajuan_perubahan_data pp
     JOIN relawan r ON pp.relawan_id = r.relawan_id
     JOIN users u ON r.user_id = u.user_id
     LEFT JOIN users vu ON pp.verifikator_id = vu.user_id
  ORDER BY pp.tanggal_pengajuan DESC;

-- 5. vw_statistik_gender
-- Menampilkan demografi gender relawan (jumlah L dan P).
CREATE OR REPLACE VIEW public.vw_statistik_gender
AS SELECT r.jenis_kelamin AS gender,
    count(*) AS jumlah
   FROM relawan r
     JOIN users u ON r.user_id = u.user_id
  WHERE u.status_keaktifan = true
  GROUP BY r.jenis_kelamin;