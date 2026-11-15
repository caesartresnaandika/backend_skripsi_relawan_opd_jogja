-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.kelurahan
-- ============================================================================
-- Deskripsi : Data Master 45 Kelurahan di 14 Kemantren Kota Yogyakarta
-- Urutan    : Jalankan ke-2 (Setelah 01_dml_kemantren.sql)
-- ============================================================================

BEGIN;

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

COMMIT;