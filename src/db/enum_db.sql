-- ================================================================
-- DEFINISI TIPE DATA ENUM POSTGRESQL
-- ================================================================
-- Enum digunakan untuk membatasi nilai yang bisa dimasukkan ke kolom
-- tertentu di database, sehingga data tetap konsisten dan valid.
--
-- Daftar ENUM:
--   jabatan        → Posisi dalam kepengurusan kader
--   jenis_kelamin  → L (Laki-laki) atau P (Perempuan)
--   status_keaktifan → Status aktif/nonaktif (berlaku untuk banyak tabel)
--   status_kegiatan  → Status kegiatan program
--   status_pengajuan → Status pengajuan perubahan data
--   status_saran     → Status saran masukan
--   user_role        → Role pengguna sistem
-- ================================================================

-- Jabatan dalam kepengurusan komunitas/kader
CREATE TYPE public.jabatan AS ENUM ('Ketua','Wakil','Sekretaris','Bendahara','Seksi','Anggota');

-- Jenis kelamin (sesuai KTP)
CREATE TYPE public.jenis_kelamin AS ENUM ('L', 'P');

-- Status keaktifan untuk entitas (relawan, kader, OPD, penugasan)
CREATE TYPE public.status_keaktifan AS ENUM ('Aktif', 'Tidak Aktif', 'Cuti');

-- Status kegiatan/program
CREATE TYPE public.status_kegiatan AS ENUM ('Berjalan', 'Selesai', 'Ditunda', 'Dibatalkan');

-- Status pengajuan perubahan data relawan
CREATE TYPE public.status_pengajuan AS ENUM ('Menunggu Review', 'Diterima', 'Ditolak');

-- Status saran/masukan
CREATE TYPE public.status_saran AS ENUM ('Menunggu', 'Selesai');

-- Role pengguna: super_admin (global), opd (per OPD), relawan (individu)
CREATE TYPE public.user_role AS ENUM ('super_admin', 'opd', 'relawan');