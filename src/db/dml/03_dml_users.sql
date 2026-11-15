-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.users
-- ============================================================================
-- Deskripsi : Data 66 Akun Pengguna (7 Admin/PIC OPD + 14 PIC Kader + 45 Relawan Kelurahan). Password disamakan dengan NIK.
-- Urutan    : Jalankan ke-3 (Induk untuk pengelola_opd dan relawan)
-- ============================================================================

BEGIN;

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

COMMIT;