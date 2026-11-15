-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.pengelola_opd
-- ============================================================================
-- Deskripsi : Data 7 Pengelola / PIC Aktif untuk Masing-Masing OPD
-- Urutan    : Jalankan ke-5 (Setelah 03_dml_users.sql dan 04_dml_opd.sql)
-- ============================================================================

BEGIN;

INSERT INTO public.pengelola_opd (user_id, opd_id, jabatan, tanggal_mulai, status_keaktifan, sk_id) VALUES
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800001' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800002' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800003' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800004' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800005' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800006' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800007' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL);

COMMIT;