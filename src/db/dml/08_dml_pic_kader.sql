-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.pic_kader
-- ============================================================================
-- Deskripsi : Data 14 Penunjukan PIC (Person In Charge) Aktif untuk Setiap Komunitas Kader
-- Urutan    : Jalankan ke-8 (Setelah 06_dml_relawan.sql dan 07_dml_kader.sql)
-- ============================================================================

BEGIN;

INSERT INTO public.pic_kader (relawan_id, kader_id, tanggal_mulai, status_keaktifan, sk_id) VALUES
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850001' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Forum Pemantau Pembangunan Kelurahan' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850002' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Perencanaan Partisipatif Masyarakat' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850003' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Kesehatan Masyarakat' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850004' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Posyandu Balita dan Lansia' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850005' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Taruna Siaga Bencana' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850006' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Pekerja Sosial Masyarakat' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850007' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Pemberdayaan Kesejahteraan Keluarga' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850008' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Satgas Sigrak Perlindungan Perempuan dan Anak' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850009' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kampung Tangguh Bencana' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850010' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Tanggap Darurat Bencana' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850011' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Bank Sampah Mandiri' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850012' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Komunitas Peduli Sungai dan Lingkungan' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850013' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Pemadam Kebakaran Kelurahan' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL),
    ((SELECT r.relawan_id FROM public.relawan r JOIN public.users u ON r.user_id = u.user_id WHERE u.nik = '3471020101850014' LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Barisan Sukarelawan Kebakaran' ORDER BY kader_id DESC LIMIT 1), CURRENT_DATE, 'Aktif', NULL);

COMMIT;