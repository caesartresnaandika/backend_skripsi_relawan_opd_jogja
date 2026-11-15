-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.opd
-- ============================================================================
-- Deskripsi : Data 7 Instansi Organisasi Perangkat Daerah (OPD) Pemerintah Kota Yogyakarta
-- Urutan    : Jalankan ke-4 (Induk untuk pengelola_opd, kader, dan penugasan_relawan)
-- ============================================================================

BEGIN;

INSERT INTO public.opd (nama_opd, alamat, status_keaktifan) VALUES
    ('Badan Perencanaan Pembangunan Daerah', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Kesehatan', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Sosial Tenaga Kerja dan Transmigrasi', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Badan Penanggulangan Bencana Daerah', 'Jl. Ipda Tut Harsono No. 14, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Lingkungan Hidup', 'Jl. Bimasakti No. 1, Demangan, Gondokusuman, Yogyakarta', true),
    ('Dinas Pemadam Kebakaran dan Penyelamatan', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true);

COMMIT;