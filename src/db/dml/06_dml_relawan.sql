-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.relawan
-- ============================================================================
-- Deskripsi : Data 59 Profil Biodata Relawan (14 Relawan PIC Kader + 45 Relawan Anggota di seluruh 45 Kelurahan & 14 Kemantren)
-- Urutan    : Jalankan ke-6 (Setelah 03_dml_users.sql, sebelum 08_dml_pic_kader.sql dan 09_dml_penugasan_relawan.sql)
-- ============================================================================

BEGIN;

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

COMMIT;