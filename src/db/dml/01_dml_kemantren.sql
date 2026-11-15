-- ============================================================================
-- SCRIPT DML INSERT TABEL: public.kemantren
-- ============================================================================
-- Deskripsi : Data Master 14 Kemantren di Kota Yogyakarta
-- Urutan    : Jalankan ke-1 (Tabel Induk Wilayah)
-- ============================================================================

BEGIN;

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

COMMIT;