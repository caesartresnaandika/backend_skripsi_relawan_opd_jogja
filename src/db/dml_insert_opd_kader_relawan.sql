-- ============================================================================
-- SCRIPT DML INSERT GABUNGAN: MANAJEMEN OPD, KADER, DAN RELAWAN (KOTA YOGYAKARTA)
-- ============================================================================
BEGIN;

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.kemantren
-- ============================================================================
-- Deskripsi : Data Master 14 Kemantren di Kota Yogyakarta
-- Urutan    : Jalankan ke-1 (Tabel Induk Wilayah)
-- ============================================================================


INSERT INTO public.kemantren (id, nama_kemantren) VALUES
    ('KEM-01', 'Danurejan'),
    ('KEM-02', 'Gedongtengen'),
    ('KEM-03', 'Gondokusuman'),
    ('KEM-04', 'Gondomanan'),
    ('KEM-05', 'Jetis'),
    ('KEM-06', 'Kotagede'),
    ('KEM-07', 'Kraton'),
    ('KEM-08', 'Mantrijeron'),
    ('KEM-09', 'Mergangsan'),
    ('KEM-10', 'Ngampilan'),
    ('KEM-11', 'Pakualaman'),
    ('KEM-12', 'Tegalrejo'),
    ('KEM-13', 'Umbulharjo'),
    ('KEM-14', 'Wirobrajan')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.kelurahan
-- ============================================================================
-- Deskripsi : Data Master 45 Kelurahan di 14 Kemantren Kota Yogyakarta
-- Urutan    : Jalankan ke-2 (Setelah 01_dml_kemantren.sql)
-- ============================================================================


INSERT INTO public.kelurahan (id_kelurahan, id_kemantren, nama_kelurahan) VALUES
    ('KEL-01-01', 'KEM-01', 'Bausasran'), -- Kemantren Danurejan
    ('KEL-01-02', 'KEM-01', 'Tegalpanggung'), -- Kemantren Danurejan
    ('KEL-01-03', 'KEM-01', 'Suryatmajan'), -- Kemantren Danurejan
    ('KEL-02-01', 'KEM-02', 'Pringgokusuman'), -- Kemantren Gedongtengen
    ('KEL-02-02', 'KEM-02', 'Sosromenduran'), -- Kemantren Gedongtengen
    ('KEL-03-01', 'KEM-03', 'Baciro'), -- Kemantren Gondokusuman
    ('KEL-03-02', 'KEM-03', 'Demangan'), -- Kemantren Gondokusuman
    ('KEL-03-03', 'KEM-03', 'Klitren'), -- Kemantren Gondokusuman
    ('KEL-03-04', 'KEM-03', 'Kotabaru'), -- Kemantren Gondokusuman
    ('KEL-03-05', 'KEM-03', 'Terban'), -- Kemantren Gondokusuman
    ('KEL-04-01', 'KEM-04', 'Ngupasan'), -- Kemantren Gondomanan
    ('KEL-04-02', 'KEM-04', 'Prawirodirjan'), -- Kemantren Gondomanan
    ('KEL-05-01', 'KEM-05', 'Bumijo'), -- Kemantren Jetis
    ('KEL-05-02', 'KEM-05', 'Cokrodiningratan'), -- Kemantren Jetis
    ('KEL-05-03', 'KEM-05', 'Gowongan'), -- Kemantren Jetis
    ('KEL-06-01', 'KEM-06', 'Purbayan'), -- Kemantren Kotagede
    ('KEL-06-02', 'KEM-06', 'Prenggan'), -- Kemantren Kotagede
    ('KEL-06-03', 'KEM-06', 'Rejowinangun'), -- Kemantren Kotagede
    ('KEL-07-01', 'KEM-07', 'Kadipaten'), -- Kemantren Kraton
    ('KEL-07-02', 'KEM-07', 'Panembahan'), -- Kemantren Kraton
    ('KEL-07-03', 'KEM-07', 'Patehan'), -- Kemantren Kraton
    ('KEL-08-01', 'KEM-08', 'Gedongkiwo'), -- Kemantren Mantrijeron
    ('KEL-08-02', 'KEM-08', 'Mantrijeron'), -- Kemantren Mantrijeron
    ('KEL-08-03', 'KEM-08', 'Suryodiningratan'), -- Kemantren Mantrijeron
    ('KEL-09-01', 'KEM-09', 'Brontokusuman'), -- Kemantren Mergangsan
    ('KEL-09-02', 'KEM-09', 'Keparakan'), -- Kemantren Mergangsan
    ('KEL-09-03', 'KEM-09', 'Wirogunan'), -- Kemantren Mergangsan
    ('KEL-10-01', 'KEM-10', 'Ngampilan'), -- Kemantren Ngampilan
    ('KEL-10-02', 'KEM-10', 'Notoprajan'), -- Kemantren Ngampilan
    ('KEL-11-01', 'KEM-11', 'Gunungketur'), -- Kemantren Pakualaman
    ('KEL-11-02', 'KEM-11', 'Purwokinanti'), -- Kemantren Pakualaman
    ('KEL-12-01', 'KEM-12', 'Bener'), -- Kemantren Tegalrejo
    ('KEL-12-02', 'KEM-12', 'Karangwaru'), -- Kemantren Tegalrejo
    ('KEL-12-03', 'KEM-12', 'Kricak'), -- Kemantren Tegalrejo
    ('KEL-12-04', 'KEM-12', 'Tegalrejo'), -- Kemantren Tegalrejo
    ('KEL-13-01', 'KEM-13', 'Giwangan'), -- Kemantren Umbulharjo
    ('KEL-13-02', 'KEM-13', 'Mujamuju'), -- Kemantren Umbulharjo
    ('KEL-13-03', 'KEM-13', 'Pandeyan'), -- Kemantren Umbulharjo
    ('KEL-13-04', 'KEM-13', 'Semaki'), -- Kemantren Umbulharjo
    ('KEL-13-05', 'KEM-13', 'Sorosutan'), -- Kemantren Umbulharjo
    ('KEL-13-06', 'KEM-13', 'Tahunan'), -- Kemantren Umbulharjo
    ('KEL-13-07', 'KEM-13', 'Warungboto'), -- Kemantren Umbulharjo
    ('KEL-14-01', 'KEM-14', 'Pakuncen'), -- Kemantren Wirobrajan
    ('KEL-14-02', 'KEM-14', 'Patangpuluhan'), -- Kemantren Wirobrajan
    ('KEL-14-03', 'KEM-14', 'Wirobrajan') -- Kemantren Wirobrajan
ON CONFLICT (id_kelurahan) DO NOTHING;

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.users
-- ============================================================================
-- Deskripsi : Data 66 Akun Pengguna (7 Admin/PIC OPD + 14 PIC Kader + 45 Relawan Kelurahan). Password disamakan dengan NIK.
-- Urutan    : Jalankan ke-3 (Induk untuk pengelola_opd dan relawan)
-- ============================================================================


-- ============================================================================
-- A. AKUN USER ADMIN / PIC OPD (7 Akun — role: 'opd', password = NIK)
-- ============================================================================
INSERT INTO public.users (nik, nama_lengkap, no_hp, password, role, status_keaktifan) VALUES
    ('3471010101800001', 'Drs. Hendra Kusuma, M.Si. - DML From DB', '081227010001', '3471010101800001', 'opd', true), -- PIC Badan Perencanaan Pembangunan Daerah
    ('3471010101800002', 'drg. Ratna Pratiwi, M.Kes. - DML From DB', '081227010002', '3471010101800002', 'opd', true), -- PIC Dinas Kesehatan
    ('3471010101800003', 'Bambang Suryanto, S.Sos., M.M. - DML From DB', '081227010003', '3471010101800003', 'opd', true), -- PIC Dinas Sosial Tenaga Kerja dan Transmigrasi
    ('3471010101800004', 'Dra. Sri Wahyuni, M.A. - DML From DB', '081227010004', '3471010101800004', 'opd', true), -- PIC Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana
    ('3471010101800005', 'Agus Setiawan, S.T., M.Eng. - DML From DB', '081227010005', '3471010101800005', 'opd', true), -- PIC Badan Penanggulangan Bencana Daerah
    ('3471010101800006', 'Ir. Eko Prasetyo, M.Sc. - DML From DB', '081227010006', '3471010101800006', 'opd', true), -- PIC Dinas Lingkungan Hidup
    ('3471010101800007', 'Taufik Hidayat, S.I.P., M.Si. - DML From DB', '081227010007', '3471010101800007', 'opd', true) -- PIC Dinas Pemadam Kebakaran dan Penyelamatan
ON CONFLICT (nik) DO NOTHING;

-- ============================================================================
-- B. AKUN USER PIC KADER (14 Akun di 14 Kemantren — role: 'relawan', password = NIK)
-- ============================================================================
INSERT INTO public.users (nik, nama_lengkap, no_hp, password, role, status_keaktifan) VALUES
    ('3471020101850001', 'Arif Budiman, S.E. - DML From DB', '081328020001', '3471020101850001', 'relawan', true), -- PIC Forum Pemantau Pembangunan Kelurahan
    ('3471020101850002', 'Nadia Kusumawati, S.Sos. - DML From DB', '081328020002', '3471020101850002', 'relawan', true), -- PIC Kader Perencanaan Partisipatif Masyarakat
    ('3471020101850003', 'Siti Aminah, A.Md.Keb. - DML From DB', '081328020003', '3471020101850003', 'relawan', true), -- PIC Kader Kesehatan Masyarakat
    ('3471020101850004', 'Dewi Sartika, S.K.M. - DML From DB', '081328020004', '3471020101850004', 'relawan', true), -- PIC Kader Posyandu Balita dan Lansia
    ('3471020101850005', 'Bagus Prakoso - DML From DB', '081328020005', '3471020101850005', 'relawan', true), -- PIC Taruna Siaga Bencana
    ('3471020101850006', 'Rina Wulandari, S.Psi. - DML From DB', '081328020006', '3471020101850006', 'relawan', true), -- PIC Pekerja Sosial Masyarakat
    ('3471020101850007', 'Endang Sulistyowati - DML From DB', '081328020007', '3471020101850007', 'relawan', true), -- PIC Kader Pemberdayaan Kesejahteraan Keluarga
    ('3471020101850008', 'Lestari Handayani, S.H. - DML From DB', '081328020008', '3471020101850008', 'relawan', true), -- PIC Satgas Sigrak Perlindungan Perempuan dan Anak
    ('3471020101850009', 'Surya Darmawan - DML From DB', '081328020009', '3471020101850009', 'relawan', true), -- PIC Kampung Tangguh Bencana
    ('3471020101850010', 'Dimas Aditya Putra - DML From DB', '081328020010', '3471020101850010', 'relawan', true), -- PIC Relawan Tanggap Darurat Bencana
    ('3471020101850011', 'Wahyu Nugroho, S.Hut. - DML From DB', '081328020011', '3471020101850011', 'relawan', true), -- PIC Kader Bank Sampah Mandiri
    ('3471020101850012', 'Fajar Ramadhan - DML From DB', '081328020012', '3471020101850012', 'relawan', true), -- PIC Komunitas Peduli Sungai dan Lingkungan
    ('3471020101850013', 'Rizky Pratama - DML From DB', '081328020013', '3471020101850013', 'relawan', true), -- PIC Relawan Pemadam Kebakaran Kelurahan
    ('3471020101850014', 'Andi Wijaya - DML From DB', '081328020014', '3471020101850014', 'relawan', true) -- PIC Barisan Sukarelawan Kebakaran
ON CONFLICT (nik) DO NOTHING;

-- ============================================================================
-- C. AKUN USER RELAWAN ANGGOTA (45 Akun di 45 Kelurahan — role: 'relawan', password = NIK)
-- ============================================================================
INSERT INTO public.users (nik, nama_lengkap, no_hp, password, role, status_keaktifan) VALUES
    ('3471030101900001', 'Adi Saputra - DML From DB', '081529030001', '3471030101900001', 'relawan', true), -- Kel. Bausasran (Danurejan)
    ('3471030101900002', 'Putri Maharani - DML From DB', '081529030002', '3471030101900002', 'relawan', true), -- Kel. Tegalpanggung (Danurejan)
    ('3471030101900003', 'Bayu Pamungkas - DML From DB', '081529030003', '3471030101900003', 'relawan', true), -- Kel. Suryatmajan (Danurejan)
    ('3471030101900004', 'Sri Lestari - DML From DB', '081529030004', '3471030101900004', 'relawan', true), -- Kel. Pringgokusuman (Gedongtengen)
    ('3471030101900005', 'Dwi Purnomo - DML From DB', '081529030005', '3471030101900005', 'relawan', true), -- Kel. Sosromenduran (Gedongtengen)
    ('3471030101900006', 'Ratih Kumalasari - DML From DB', '081529030006', '3471030101900006', 'relawan', true), -- Kel. Baciro (Gondokusuman)
    ('3471030101900007', 'Cahyo Wibowo - DML From DB', '081529030007', '3471030101900007', 'relawan', true), -- Kel. Demangan (Gondokusuman)
    ('3471030101900008', 'Anisa Fitriani - DML From DB', '081529030008', '3471030101900008', 'relawan', true), -- Kel. Klitren (Gondokusuman)
    ('3471030101900009', 'Danang Prasetya - DML From DB', '081529030009', '3471030101900009', 'relawan', true), -- Kel. Kotabaru (Gondokusuman)
    ('3471030101900010', 'Maya Anggraini - DML From DB', '081529030010', '3471030101900010', 'relawan', true), -- Kel. Terban (Gondokusuman)
    ('3471030101900011', 'Gunawan Setiadi - DML From DB', '081529030011', '3471030101900011', 'relawan', true), -- Kel. Ngupasan (Gondomanan)
    ('3471030101900012', 'Novi Rahmawati - DML From DB', '081529030012', '3471030101900012', 'relawan', true), -- Kel. Prawirodirjan (Gondomanan)
    ('3471030101900013', 'Hendra Wijaya - DML From DB', '081529030013', '3471030101900013', 'relawan', true), -- Kel. Bumijo (Jetis)
    ('3471030101900014', 'Intan Permatasari - DML From DB', '081529030014', '3471030101900014', 'relawan', true), -- Kel. Cokrodiningratan (Jetis)
    ('3471030101900015', 'Joko Susilo - DML From DB', '081529030015', '3471030101900015', 'relawan', true), -- Kel. Gowongan (Jetis)
    ('3471030101900016', 'Kartika Sari - DML From DB', '081529030016', '3471030101900016', 'relawan', true), -- Kel. Purbayan (Kotagede)
    ('3471030101900017', 'Lukman Hakim - DML From DB', '081529030017', '3471030101900017', 'relawan', true), -- Kel. Prenggan (Kotagede)
    ('3471030101900018', 'Mega Puspita - DML From DB', '081529030018', '3471030101900018', 'relawan', true), -- Kel. Rejowinangun (Kotagede)
    ('3471030101900019', 'Nugroho Adi - DML From DB', '081529030019', '3471030101900019', 'relawan', true), -- Kel. Kadipaten (Kraton)
    ('3471030101900020', 'Oktavia Ningrum - DML From DB', '081529030020', '3471030101900020', 'relawan', true), -- Kel. Panembahan (Kraton)
    ('3471030101900021', 'Prasetyo Utomo - DML From DB', '081529030021', '3471030101900021', 'relawan', true), -- Kel. Patehan (Kraton)
    ('3471030101900022', 'Rani Kusuma - DML From DB', '081529030022', '3471030101900022', 'relawan', true), -- Kel. Gedongkiwo (Mantrijeron)
    ('3471030101900023', 'Sigit Purnama - DML From DB', '081529030023', '3471030101900023', 'relawan', true), -- Kel. Mantrijeron (Mantrijeron)
    ('3471030101900024', 'Tia Permata - DML From DB', '081529030024', '3471030101900024', 'relawan', true), -- Kel. Suryodiningratan (Mantrijeron)
    ('3471030101900025', 'Umar Faruq - DML From DB', '081529030025', '3471030101900025', 'relawan', true), -- Kel. Brontokusuman (Mergangsan)
    ('3471030101900026', 'Vina Oktaviani - DML From DB', '081529030026', '3471030101900026', 'relawan', true), -- Kel. Keparakan (Mergangsan)
    ('3471030101900027', 'Wawan Kurniawan - DML From DB', '081529030027', '3471030101900027', 'relawan', true), -- Kel. Wirogunan (Mergangsan)
    ('3471030101900028', 'Yuni Astuti - DML From DB', '081529030028', '3471030101900028', 'relawan', true), -- Kel. Ngampilan (Ngampilan)
    ('3471030101900029', 'Zainal Abidin - DML From DB', '081529030029', '3471030101900029', 'relawan', true), -- Kel. Notoprajan (Ngampilan)
    ('3471030101900030', 'Aulia Rahman - DML From DB', '081529030030', '3471030101900030', 'relawan', true), -- Kel. Gunungketur (Pakualaman)
    ('3471030101900031', 'Bella Safitri - DML From DB', '081529030031', '3471030101900031', 'relawan', true), -- Kel. Purwokinanti (Pakualaman)
    ('3471030101900032', 'Chandra Kusuma - DML From DB', '081529030032', '3471030101900032', 'relawan', true), -- Kel. Bener (Tegalrejo)
    ('3471030101900033', 'Dina Mariana - DML From DB', '081529030033', '3471030101900033', 'relawan', true), -- Kel. Karangwaru (Tegalrejo)
    ('3471030101900034', 'Edi Santoso - DML From DB', '081529030034', '3471030101900034', 'relawan', true), -- Kel. Kricak (Tegalrejo)
    ('3471030101900035', 'Fitri Handayani - DML From DB', '081529030035', '3471030101900035', 'relawan', true), -- Kel. Tegalrejo (Tegalrejo)
    ('3471030101900036', 'Galih Pratama - DML From DB', '081529030036', '3471030101900036', 'relawan', true), -- Kel. Giwangan (Umbulharjo)
    ('3471030101900037', 'Hana Pertiwi - DML From DB', '081529030037', '3471030101900037', 'relawan', true), -- Kel. Mujamuju (Umbulharjo)
    ('3471030101900038', 'Irfan Maulana - DML From DB', '081529030038', '3471030101900038', 'relawan', true), -- Kel. Pandeyan (Umbulharjo)
    ('3471030101900039', 'Julia Rahma - DML From DB', '081529030039', '3471030101900039', 'relawan', true), -- Kel. Semaki (Umbulharjo)
    ('3471030101900040', 'Kurnia Sandi - DML From DB', '081529030040', '3471030101900040', 'relawan', true), -- Kel. Sorosutan (Umbulharjo)
    ('3471030101900041', 'Linda Wati - DML From DB', '081529030041', '3471030101900041', 'relawan', true), -- Kel. Tahunan (Umbulharjo)
    ('3471030101900042', 'Muhammad Ridwan - DML From DB', '081529030042', '3471030101900042', 'relawan', true), -- Kel. Warungboto (Umbulharjo)
    ('3471030101900043', 'Nanda Pratama - DML From DB', '081529030043', '3471030101900043', 'relawan', true), -- Kel. Pakuncen (Wirobrajan)
    ('3471030101900044', 'Olivia Sari - DML From DB', '081529030044', '3471030101900044', 'relawan', true), -- Kel. Patangpuluhan (Wirobrajan)
    ('3471030101900045', 'Pandu Wijaya - DML From DB', '081529030045', '3471030101900045', 'relawan', true) -- Kel. Wirobrajan (Wirobrajan)
ON CONFLICT (nik) DO NOTHING;

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.opd
-- ============================================================================
-- Deskripsi : Data 7 Instansi Organisasi Perangkat Daerah (OPD) Pemerintah Kota Yogyakarta
-- Urutan    : Jalankan ke-4 (Induk untuk pengelola_opd, kader, dan penugasan_relawan)
-- ============================================================================


INSERT INTO public.opd (nama_opd, alamat, status_keaktifan) VALUES
    ('Badan Perencanaan Pembangunan Daerah', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Kesehatan', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Sosial Tenaga Kerja dan Transmigrasi', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Badan Penanggulangan Bencana Daerah', 'Jl. Ipda Tut Harsono No. 14, Mujamuju, Umbulharjo, Yogyakarta', true),
    ('Dinas Lingkungan Hidup', 'Jl. Bimasakti No. 1, Demangan, Gondokusuman, Yogyakarta', true),
    ('Dinas Pemadam Kebakaran dan Penyelamatan', 'Jl. Kenari No. 56, Mujamuju, Umbulharjo, Yogyakarta', true);

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.pengelola_opd
-- ============================================================================
-- Deskripsi : Data 7 Pengelola / PIC Aktif untuk Masing-Masing OPD
-- Urutan    : Jalankan ke-5 (Setelah 03_dml_users.sql dan 04_dml_opd.sql)
-- ============================================================================


INSERT INTO public.pengelola_opd (user_id, opd_id, jabatan, tanggal_mulai, status_keaktifan, sk_id) VALUES
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800001' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800002' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800003' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800004' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800005' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800006' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL),
    ((SELECT user_id FROM public.users WHERE nik = '3471010101800007' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), 'Pengelola OPD', CURRENT_DATE, 'Aktif', NULL);

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.relawan
-- ============================================================================
-- Deskripsi : Data 59 Profil Biodata Relawan (14 Relawan PIC Kader + 45 Relawan Anggota di seluruh 45 Kelurahan & 14 Kemantren)
-- Urutan    : Jalankan ke-6 (Setelah 03_dml_users.sql, sebelum 08_dml_pic_kader.sql dan 09_dml_penugasan_relawan.sql)
-- ============================================================================


-- ============================================================================
-- A. PROFIL RELAWAN UNTUK PIC KADER (14 Relawan di 14 Kemantren)
-- ============================================================================
INSERT INTO public.relawan (user_id, jenis_kelamin, alamat_ktp, kemantren, kelurahan) VALUES
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850001' LIMIT 1), 'L', 'Jl. Bausasran No. 12, Danurejan, Yogyakarta', 'Danurejan', 'Bausasran'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850002' LIMIT 1), 'P', 'Jl. Pasar Kembang No. 24, Gedongtengen, Yogyakarta', 'Gedongtengen', 'Sosromenduran'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850003' LIMIT 1), 'P', 'Jl. Melati Wetan No. 8, Gondokusuman, Yogyakarta', 'Gondokusuman', 'Baciro'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850004' LIMIT 1), 'P', 'Jl. Brigjen Katamso No. 45, Gondomanan, Yogyakarta', 'Gondomanan', 'Prawirodirjan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850005' LIMIT 1), 'L', 'Jl. Tentara Rakyat Mataram No. 19, Jetis, Yogyakarta', 'Jetis', 'Bumijo'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850006' LIMIT 1), 'P', 'Jl. Mondorakan No. 31, Kotagede, Yogyakarta', 'Kotagede', 'Prenggan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850007' LIMIT 1), 'P', 'Jl. Rotowijayan No. 15, Kraton, Yogyakarta', 'Kraton', 'Kadipaten'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850008' LIMIT 1), 'P', 'Jl. DI Panjaitan No. 52, Mantrijeron, Yogyakarta', 'Mantrijeron', 'Suryodiningratan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850009' LIMIT 1), 'L', 'Jl. Sisingamangaraja No. 40, Mergangsan, Yogyakarta', 'Mergangsan', 'Brontokusuman'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850010' LIMIT 1), 'L', 'Jl. KH Ahmad Dahlan No. 76, Ngampilan, Yogyakarta', 'Ngampilan', 'Notoprajan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850011' LIMIT 1), 'L', 'Jl. Sultan Agung No. 22, Pakualaman, Yogyakarta', 'Pakualaman', 'Purwokinanti'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850012' LIMIT 1), 'L', 'Jl. Magelang Km 2 No. 18, Tegalrejo, Yogyakarta', 'Tegalrejo', 'Karangwaru'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850013' LIMIT 1), 'L', 'Jl. Perintis Kemerdekaan No. 33, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Pandeyan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471020101850014' LIMIT 1), 'L', 'Jl. Kapten Piere Tendean No. 29, Wirobrajan, Yogyakarta', 'Wirobrajan', 'Wirobrajan')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- B. PROFIL RELAWAN ANGGOTA (45 Relawan di seluruh 45 Kelurahan & 14 Kemantren)
-- ============================================================================
INSERT INTO public.relawan (user_id, jenis_kelamin, alamat_ktp, kemantren, kelurahan) VALUES
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900001' LIMIT 1), 'L', 'Jl. Bausasran Raya No. 1, Danurejan, Yogyakarta', 'Danurejan', 'Bausasran'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900002' LIMIT 1), 'P', 'Jl. Tegalpanggung Raya No. 2, Danurejan, Yogyakarta', 'Danurejan', 'Tegalpanggung'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900003' LIMIT 1), 'L', 'Jl. Suryatmajan Raya No. 3, Danurejan, Yogyakarta', 'Danurejan', 'Suryatmajan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900004' LIMIT 1), 'P', 'Jl. Pringgokusuman Raya No. 4, Gedongtengen, Yogyakarta', 'Gedongtengen', 'Pringgokusuman'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900005' LIMIT 1), 'L', 'Jl. Sosromenduran Raya No. 5, Gedongtengen, Yogyakarta', 'Gedongtengen', 'Sosromenduran'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900006' LIMIT 1), 'P', 'Jl. Baciro Raya No. 6, Gondokusuman, Yogyakarta', 'Gondokusuman', 'Baciro'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900007' LIMIT 1), 'L', 'Jl. Demangan Raya No. 7, Gondokusuman, Yogyakarta', 'Gondokusuman', 'Demangan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900008' LIMIT 1), 'P', 'Jl. Klitren Raya No. 8, Gondokusuman, Yogyakarta', 'Gondokusuman', 'Klitren'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900009' LIMIT 1), 'L', 'Jl. Kotabaru Raya No. 9, Gondokusuman, Yogyakarta', 'Gondokusuman', 'Kotabaru'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900010' LIMIT 1), 'P', 'Jl. Terban Raya No. 10, Gondokusuman, Yogyakarta', 'Gondokusuman', 'Terban'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900011' LIMIT 1), 'L', 'Jl. Ngupasan Raya No. 11, Gondomanan, Yogyakarta', 'Gondomanan', 'Ngupasan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900012' LIMIT 1), 'P', 'Jl. Prawirodirjan Raya No. 12, Gondomanan, Yogyakarta', 'Gondomanan', 'Prawirodirjan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900013' LIMIT 1), 'L', 'Jl. Bumijo Raya No. 13, Jetis, Yogyakarta', 'Jetis', 'Bumijo'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900014' LIMIT 1), 'P', 'Jl. Cokrodiningratan Raya No. 14, Jetis, Yogyakarta', 'Jetis', 'Cokrodiningratan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900015' LIMIT 1), 'L', 'Jl. Gowongan Raya No. 15, Jetis, Yogyakarta', 'Jetis', 'Gowongan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900016' LIMIT 1), 'P', 'Jl. Purbayan Raya No. 16, Kotagede, Yogyakarta', 'Kotagede', 'Purbayan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900017' LIMIT 1), 'L', 'Jl. Prenggan Raya No. 17, Kotagede, Yogyakarta', 'Kotagede', 'Prenggan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900018' LIMIT 1), 'P', 'Jl. Rejowinangun Raya No. 18, Kotagede, Yogyakarta', 'Kotagede', 'Rejowinangun'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900019' LIMIT 1), 'L', 'Jl. Kadipaten Raya No. 19, Kraton, Yogyakarta', 'Kraton', 'Kadipaten'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900020' LIMIT 1), 'P', 'Jl. Panembahan Raya No. 20, Kraton, Yogyakarta', 'Kraton', 'Panembahan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900021' LIMIT 1), 'L', 'Jl. Patehan Raya No. 21, Kraton, Yogyakarta', 'Kraton', 'Patehan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900022' LIMIT 1), 'P', 'Jl. Gedongkiwo Raya No. 22, Mantrijeron, Yogyakarta', 'Mantrijeron', 'Gedongkiwo'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900023' LIMIT 1), 'L', 'Jl. Mantrijeron Raya No. 23, Mantrijeron, Yogyakarta', 'Mantrijeron', 'Mantrijeron'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900024' LIMIT 1), 'P', 'Jl. Suryodiningratan Raya No. 24, Mantrijeron, Yogyakarta', 'Mantrijeron', 'Suryodiningratan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900025' LIMIT 1), 'L', 'Jl. Brontokusuman Raya No. 25, Mergangsan, Yogyakarta', 'Mergangsan', 'Brontokusuman'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900026' LIMIT 1), 'P', 'Jl. Keparakan Raya No. 26, Mergangsan, Yogyakarta', 'Mergangsan', 'Keparakan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900027' LIMIT 1), 'L', 'Jl. Wirogunan Raya No. 27, Mergangsan, Yogyakarta', 'Mergangsan', 'Wirogunan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900028' LIMIT 1), 'P', 'Jl. Ngampilan Raya No. 28, Ngampilan, Yogyakarta', 'Ngampilan', 'Ngampilan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900029' LIMIT 1), 'L', 'Jl. Notoprajan Raya No. 29, Ngampilan, Yogyakarta', 'Ngampilan', 'Notoprajan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900030' LIMIT 1), 'L', 'Jl. Gunungketur Raya No. 30, Pakualaman, Yogyakarta', 'Pakualaman', 'Gunungketur'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900031' LIMIT 1), 'P', 'Jl. Purwokinanti Raya No. 31, Pakualaman, Yogyakarta', 'Pakualaman', 'Purwokinanti'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900032' LIMIT 1), 'L', 'Jl. Bener Raya No. 32, Tegalrejo, Yogyakarta', 'Tegalrejo', 'Bener'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900033' LIMIT 1), 'P', 'Jl. Karangwaru Raya No. 33, Tegalrejo, Yogyakarta', 'Tegalrejo', 'Karangwaru'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900034' LIMIT 1), 'L', 'Jl. Kricak Raya No. 34, Tegalrejo, Yogyakarta', 'Tegalrejo', 'Kricak'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900035' LIMIT 1), 'P', 'Jl. Tegalrejo Raya No. 35, Tegalrejo, Yogyakarta', 'Tegalrejo', 'Tegalrejo'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900036' LIMIT 1), 'L', 'Jl. Giwangan Raya No. 36, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Giwangan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900037' LIMIT 1), 'P', 'Jl. Mujamuju Raya No. 37, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Mujamuju'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900038' LIMIT 1), 'L', 'Jl. Pandeyan Raya No. 38, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Pandeyan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900039' LIMIT 1), 'P', 'Jl. Semaki Raya No. 39, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Semaki'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900040' LIMIT 1), 'L', 'Jl. Sorosutan Raya No. 40, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Sorosutan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900041' LIMIT 1), 'P', 'Jl. Tahunan Raya No. 41, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Tahunan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900042' LIMIT 1), 'L', 'Jl. Warungboto Raya No. 42, Umbulharjo, Yogyakarta', 'Umbulharjo', 'Warungboto'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900043' LIMIT 1), 'L', 'Jl. Pakuncen Raya No. 43, Wirobrajan, Yogyakarta', 'Wirobrajan', 'Pakuncen'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900044' LIMIT 1), 'P', 'Jl. Patangpuluhan Raya No. 44, Wirobrajan, Yogyakarta', 'Wirobrajan', 'Patangpuluhan'),
    ((SELECT user_id FROM public.users WHERE nik = '3471030101900045' LIMIT 1), 'L', 'Jl. Wirobrajan Raya No. 45, Wirobrajan, Yogyakarta', 'Wirobrajan', 'Wirobrajan')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.kader
-- ============================================================================
-- Deskripsi : Data 14 Unit/Komunitas Kader di Bawah 7 OPD Pemerintah Kota Yogyakarta
-- Urutan    : Jalankan ke-7 (Setelah 04_dml_opd.sql)
-- ============================================================================


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

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.pic_kader
-- ============================================================================
-- Deskripsi : Data 14 Penunjukan PIC (Person In Charge) Aktif untuk Setiap Komunitas Kader
-- Urutan    : Jalankan ke-8 (Setelah 06_dml_relawan.sql dan 07_dml_kader.sql)
-- ============================================================================


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

-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.penugasan_relawan
-- ============================================================================
-- Deskripsi : Data 45 Penugasan Relawan pada OPD dan Komunitas Kader (Mencakup 45 Kelurahan & 14 Kemantren)
-- Urutan    : Jalankan ke-9 (Setelah 04_dml_opd.sql, 06_dml_relawan.sql, dan 07_dml_kader.sql)
-- ============================================================================


INSERT INTO public.penugasan_relawan (relawan_id, opd_id, kader_id, sk_id, jabatan, detail_jabatan, penugasan, status_keaktifan) VALUES
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900001' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Forum Pemantau Pembangunan Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Ketua', 'Ketua Koordinator Wilayah Kelurahan', 'Koordinasi Kegiatan Relawan Tingkat Kelurahan', 'Aktif'), -- Adi Saputra - DML From DB (Bausasran, Danurejan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900002' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Perencanaan Partisipatif Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Wakil', 'Wakil Koordinator Wilayah Kelurahan', 'Pendampingan Koordinasi Lapangan Tingkat RW', 'Aktif'), -- Putri Maharani - DML From DB (Tegalpanggung, Danurejan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900003' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Kesehatan Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Sekretaris', 'Sekretaris Administrasi dan Pelaporan', 'Pencatatan Data dan Pelaporan Rutin', 'Aktif'), -- Bayu Pamungkas - DML From DB (Suryatmajan, Danurejan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900004' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Posyandu Balita dan Lansia' ORDER BY kader_id DESC LIMIT 1), NULL, 'Bendahara', 'Bendahara Pengelolaan Operasional Kegiatan', 'Pengelolaan Logistik dan Kebutuhan Kegiatan', 'Aktif'), -- Sri Lestari - DML From DB (Pringgokusuman, Gedongtengen)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900005' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Taruna Siaga Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Seksi', 'Koordinator Seksi Lapangan dan Sosialisasi', 'Sosialisasi dan Edukasi Warga Tingkat RT', 'Aktif'), -- Dwi Purnomo - DML From DB (Sosromenduran, Gedongtengen)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900006' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Pekerja Sosial Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Ratih Kumalasari - DML From DB (Baciro, Gondokusuman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900007' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Pemberdayaan Kesejahteraan Keluarga' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Cahyo Wibowo - DML From DB (Demangan, Gondokusuman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900008' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Satgas Sigrak Perlindungan Perempuan dan Anak' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Anisa Fitriani - DML From DB (Klitren, Gondokusuman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900009' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kampung Tangguh Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Ketua', 'Ketua Koordinator Wilayah Kelurahan', 'Koordinasi Kegiatan Relawan Tingkat Kelurahan', 'Aktif'), -- Danang Prasetya - DML From DB (Kotabaru, Gondokusuman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900010' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Tanggap Darurat Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Wakil', 'Wakil Koordinator Wilayah Kelurahan', 'Pendampingan Koordinasi Lapangan Tingkat RW', 'Aktif'), -- Maya Anggraini - DML From DB (Terban, Gondokusuman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900011' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Bank Sampah Mandiri' ORDER BY kader_id DESC LIMIT 1), NULL, 'Sekretaris', 'Sekretaris Administrasi dan Pelaporan', 'Pencatatan Data dan Pelaporan Rutin', 'Aktif'), -- Gunawan Setiadi - DML From DB (Ngupasan, Gondomanan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900012' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Komunitas Peduli Sungai dan Lingkungan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Bendahara', 'Bendahara Pengelolaan Operasional Kegiatan', 'Pengelolaan Logistik dan Kebutuhan Kegiatan', 'Aktif'), -- Novi Rahmawati - DML From DB (Prawirodirjan, Gondomanan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900013' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Pemadam Kebakaran Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Seksi', 'Koordinator Seksi Lapangan dan Sosialisasi', 'Sosialisasi dan Edukasi Warga Tingkat RT', 'Aktif'), -- Hendra Wijaya - DML From DB (Bumijo, Jetis)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900014' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Barisan Sukarelawan Kebakaran' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Intan Permatasari - DML From DB (Cokrodiningratan, Jetis)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900015' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Forum Pemantau Pembangunan Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Joko Susilo - DML From DB (Gowongan, Jetis)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900016' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Perencanaan Partisipatif Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Kartika Sari - DML From DB (Purbayan, Kotagede)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900017' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Kesehatan Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Ketua', 'Ketua Koordinator Wilayah Kelurahan', 'Koordinasi Kegiatan Relawan Tingkat Kelurahan', 'Aktif'), -- Lukman Hakim - DML From DB (Prenggan, Kotagede)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900018' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Posyandu Balita dan Lansia' ORDER BY kader_id DESC LIMIT 1), NULL, 'Wakil', 'Wakil Koordinator Wilayah Kelurahan', 'Pendampingan Koordinasi Lapangan Tingkat RW', 'Aktif'), -- Mega Puspita - DML From DB (Rejowinangun, Kotagede)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900019' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Taruna Siaga Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Sekretaris', 'Sekretaris Administrasi dan Pelaporan', 'Pencatatan Data dan Pelaporan Rutin', 'Aktif'), -- Nugroho Adi - DML From DB (Kadipaten, Kraton)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900020' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Pekerja Sosial Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Bendahara', 'Bendahara Pengelolaan Operasional Kegiatan', 'Pengelolaan Logistik dan Kebutuhan Kegiatan', 'Aktif'), -- Oktavia Ningrum - DML From DB (Panembahan, Kraton)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900021' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Pemberdayaan Kesejahteraan Keluarga' ORDER BY kader_id DESC LIMIT 1), NULL, 'Seksi', 'Koordinator Seksi Lapangan dan Sosialisasi', 'Sosialisasi dan Edukasi Warga Tingkat RT', 'Aktif'), -- Prasetyo Utomo - DML From DB (Patehan, Kraton)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900022' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Satgas Sigrak Perlindungan Perempuan dan Anak' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Rani Kusuma - DML From DB (Gedongkiwo, Mantrijeron)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900023' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kampung Tangguh Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Sigit Purnama - DML From DB (Mantrijeron, Mantrijeron)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900024' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Tanggap Darurat Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Tia Permata - DML From DB (Suryodiningratan, Mantrijeron)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900025' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Bank Sampah Mandiri' ORDER BY kader_id DESC LIMIT 1), NULL, 'Ketua', 'Ketua Koordinator Wilayah Kelurahan', 'Koordinasi Kegiatan Relawan Tingkat Kelurahan', 'Aktif'), -- Umar Faruq - DML From DB (Brontokusuman, Mergangsan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900026' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Komunitas Peduli Sungai dan Lingkungan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Wakil', 'Wakil Koordinator Wilayah Kelurahan', 'Pendampingan Koordinasi Lapangan Tingkat RW', 'Aktif'), -- Vina Oktaviani - DML From DB (Keparakan, Mergangsan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900027' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Pemadam Kebakaran Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Sekretaris', 'Sekretaris Administrasi dan Pelaporan', 'Pencatatan Data dan Pelaporan Rutin', 'Aktif'), -- Wawan Kurniawan - DML From DB (Wirogunan, Mergangsan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900028' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Barisan Sukarelawan Kebakaran' ORDER BY kader_id DESC LIMIT 1), NULL, 'Bendahara', 'Bendahara Pengelolaan Operasional Kegiatan', 'Pengelolaan Logistik dan Kebutuhan Kegiatan', 'Aktif'), -- Yuni Astuti - DML From DB (Ngampilan, Ngampilan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900029' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Forum Pemantau Pembangunan Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Seksi', 'Koordinator Seksi Lapangan dan Sosialisasi', 'Sosialisasi dan Edukasi Warga Tingkat RT', 'Aktif'), -- Zainal Abidin - DML From DB (Notoprajan, Ngampilan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900030' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Perencanaan Partisipatif Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Aulia Rahman - DML From DB (Gunungketur, Pakualaman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900031' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Kesehatan Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Bella Safitri - DML From DB (Purwokinanti, Pakualaman)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900032' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Posyandu Balita dan Lansia' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Chandra Kusuma - DML From DB (Bener, Tegalrejo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900033' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Taruna Siaga Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Ketua', 'Ketua Koordinator Wilayah Kelurahan', 'Koordinasi Kegiatan Relawan Tingkat Kelurahan', 'Aktif'), -- Dina Mariana - DML From DB (Karangwaru, Tegalrejo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900034' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Sosial Tenaga Kerja dan Transmigrasi' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Pekerja Sosial Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Wakil', 'Wakil Koordinator Wilayah Kelurahan', 'Pendampingan Koordinasi Lapangan Tingkat RW', 'Aktif'), -- Edi Santoso - DML From DB (Kricak, Tegalrejo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900035' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Pemberdayaan Kesejahteraan Keluarga' ORDER BY kader_id DESC LIMIT 1), NULL, 'Sekretaris', 'Sekretaris Administrasi dan Pelaporan', 'Pencatatan Data dan Pelaporan Rutin', 'Aktif'), -- Fitri Handayani - DML From DB (Tegalrejo, Tegalrejo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900036' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Satgas Sigrak Perlindungan Perempuan dan Anak' ORDER BY kader_id DESC LIMIT 1), NULL, 'Bendahara', 'Bendahara Pengelolaan Operasional Kegiatan', 'Pengelolaan Logistik dan Kebutuhan Kegiatan', 'Aktif'), -- Galih Pratama - DML From DB (Giwangan, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900037' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kampung Tangguh Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Seksi', 'Koordinator Seksi Lapangan dan Sosialisasi', 'Sosialisasi dan Edukasi Warga Tingkat RT', 'Aktif'), -- Hana Pertiwi - DML From DB (Mujamuju, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900038' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Penanggulangan Bencana Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Tanggap Darurat Bencana' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Irfan Maulana - DML From DB (Pandeyan, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900039' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Bank Sampah Mandiri' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Julia Rahma - DML From DB (Semaki, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900040' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Lingkungan Hidup' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Komunitas Peduli Sungai dan Lingkungan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Anggota', 'Anggota Pelaksana Lapangan Kelurahan', 'Pendampingan Masyarakat Tingkat RT dan RW', 'Aktif'), -- Kurnia Sandi - DML From DB (Sorosutan, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900041' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Relawan Pemadam Kebakaran Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Ketua', 'Ketua Koordinator Wilayah Kelurahan', 'Koordinasi Kegiatan Relawan Tingkat Kelurahan', 'Aktif'), -- Linda Wati - DML From DB (Tahunan, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900042' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Pemadam Kebakaran dan Penyelamatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Barisan Sukarelawan Kebakaran' ORDER BY kader_id DESC LIMIT 1), NULL, 'Wakil', 'Wakil Koordinator Wilayah Kelurahan', 'Pendampingan Koordinasi Lapangan Tingkat RW', 'Aktif'), -- Muhammad Ridwan - DML From DB (Warungboto, Umbulharjo)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900043' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Forum Pemantau Pembangunan Kelurahan' ORDER BY kader_id DESC LIMIT 1), NULL, 'Sekretaris', 'Sekretaris Administrasi dan Pelaporan', 'Pencatatan Data dan Pelaporan Rutin', 'Aktif'), -- Nanda Pratama - DML From DB (Pakuncen, Wirobrajan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900044' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Badan Perencanaan Pembangunan Daerah' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Perencanaan Partisipatif Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Bendahara', 'Bendahara Pengelolaan Operasional Kegiatan', 'Pengelolaan Logistik dan Kebutuhan Kegiatan', 'Aktif'), -- Olivia Sari - DML From DB (Patangpuluhan, Wirobrajan)
    ((SELECT rel.relawan_id FROM public.relawan rel JOIN public.users u ON rel.user_id = u.user_id WHERE u.nik = '3471030101900045' LIMIT 1), (SELECT opd_id FROM public.opd WHERE nama_opd = 'Dinas Kesehatan' ORDER BY opd_id DESC LIMIT 1), (SELECT kader_id FROM public.kader WHERE nama_kader = 'Kader Kesehatan Masyarakat' ORDER BY kader_id DESC LIMIT 1), NULL, 'Seksi', 'Koordinator Seksi Lapangan dan Sosialisasi', 'Sosialisasi dan Edukasi Warga Tingkat RT', 'Aktif'); -- Pandu Wijaya - DML From DB (Wirobrajan, Wirobrajan)

COMMIT;
