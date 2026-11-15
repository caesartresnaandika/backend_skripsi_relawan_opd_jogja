-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.kader
-- ============================================================================
-- Deskripsi : Data 14 Unit/Komunitas Kader di Bawah 7 OPD Pemerintah Kota Yogyakarta
-- Urutan    : Jalankan ke-7 (Setelah 04_dml_opd.sql)
-- ============================================================================

BEGIN;

INSERT INTO public.kader (opd_id, nama_kader, deskripsi, status_keaktifan, sk_id) VALUES
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), 'Forum Pemantau Pembangunan Kelurahan', 'Komunitas relawan pemantau pelaksanaan pembangunan partisipatif tingkat kelurahan di Kota Yogyakarta', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), 'Kader Perencanaan Partisipatif Masyarakat', 'Kelompok pendamping musyawarah perencanaan pembangunan masyarakat tingkat kemantren dan kelurahan', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), 'Kader Kesehatan Masyarakat', 'Relawan penyuluhan perilaku hidup bersih dan sehat serta pemantauan jentik berkala', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), 'Kader Posyandu Balita dan Lansia', 'Kelompok kader pelayanan kesehatan dasar posyandu balita, ibu hamil, dan lansia', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), 'Taruna Siaga Bencana', 'Relawan sosial penanggulangan bencana berbasis masyarakat pada bidang logistik dan dapur umum', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), 'Pekerja Sosial Masyarakat', 'Relawan pendamping pemerlu pelayanan kesejahteraan sosial di lingkungan kelurahan', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), 'Kader Pemberdayaan Kesejahteraan Keluarga', 'Penggerak sepuluh program pokok PKK untuk pemberdayaan keluarga di tingkat wilayah', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), 'Satgas Sigrak Perlindungan Perempuan dan Anak', 'Satuan tugas siap gerak pencegahan dan penanganan kekerasan terhadap perempuan dan anak', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), 'Kampung Tangguh Bencana', 'Komunitas warga mandiri dalam mitigasi risiko bencana dan peringatan dini tingkat kampung', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), 'Relawan Tanggap Darurat Bencana', 'Tim reaksi cepat evakuasi dan penyelamatan warga terdampak bencana alam maupun nonalam', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), 'Kader Bank Sampah Mandiri', 'Pengelola pemilahan sampah anorganik dan edukasi pengurangan sampah rumah tangga', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), 'Komunitas Peduli Sungai dan Lingkungan', 'Relawan pemeliharaan kebersihan sempadan sungai Code, Winongo, dan Gajahwong', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), 'Relawan Pemadam Kebakaran Kelurahan', 'Relawan pencegahan dini kebakaran lingkungan padat penduduk dan pengoperasian APAR', true, NULL),
    ((SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), 'Barisan Sukarelawan Kebakaran', 'Komunitas warga siaga darurat kebakaran dan penyelamatan nonkebakaran di pemukiman', true, NULL);

COMMIT;