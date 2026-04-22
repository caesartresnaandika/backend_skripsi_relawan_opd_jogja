-- Tambahan: Definisi Tipe Data ENUM (tidak terekspor otomatis)
CREATE TYPE public.jabatan AS ENUM ('Ketua','Wakil','Sekretaris','Bendahara','Seksi','Anggota');
CREATE TYPE public.jenis_kelamin AS ENUM ('L', 'P');
CREATE TYPE public.status_keaktifan AS ENUM ('Aktif', 'Tidak Aktif', 'Cuti');
CREATE TYPE public.status_kegiatan AS ENUM ('Berjalan', 'Selesai', 'Ditunda', 'Dibatalkan');
CREATE TYPE public.status_pengajuan AS ENUM ('Menunggu Review', 'Diterima', 'Ditolak');
CREATE TYPE public.status_saran AS ENUM ('Menunggu', 'Selesai');
CREATE TYPE public.user_role AS ENUM ('super_admin', 'opd', 'relawan');