-- ==========================================
-- 1. AKTIFKAN RLS PADA TABEL
-- ==========================================
ALTER TABLE public.opd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_perubahan_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penugasan_relawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kader ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pic_kader ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. HAPUS POLICY LAMA (Jika Ada)
-- ==========================================
DROP POLICY IF EXISTS super_admin_all_opd ON public.opd;
DROP POLICY IF EXISTS opd_relawan_select_opd ON public.opd;

DROP POLICY IF EXISTS super_admin_all_relawan ON public.relawan;
DROP POLICY IF EXISTS self_access_relawan ON public.relawan;
DROP POLICY IF EXISTS relawan_self_select ON public.relawan;

DROP POLICY IF EXISTS super_admin_all_penugasan ON public.penugasan_relawan;
DROP POLICY IF EXISTS self_access_penugasan ON public.penugasan_relawan;

DROP POLICY IF EXISTS super_admin_all_kader ON public.kader;
DROP POLICY IF EXISTS opd_access_kader ON public.kader;
DROP POLICY IF EXISTS relawan_access_kader ON public.kader;

DROP POLICY IF EXISTS super_admin_all_pengajuan ON public.pengajuan_perubahan_data;
DROP POLICY IF EXISTS relawan_own_pengajuan ON public.pengajuan_perubahan_data;
DROP POLICY IF EXISTS opd_all_pengajuan ON public.pengajuan_perubahan_data;

-- ==========================================
-- 3. POLICIES UNTUK TABEL: opd
-- ==========================================
-- [Super Admin]: Bebas melakukan CRUD ke tabel OPD
CREATE POLICY super_admin_all_opd ON public.opd 
    FOR ALL 
    USING (current_setting('app.current_user_role', true) = 'super_admin');

-- [OPD & Relawan]: Hanya boleh melihat (SELECT) tabel OPD
CREATE POLICY opd_relawan_select_opd ON public.opd
    FOR SELECT 
    USING (current_setting('app.current_user_role', true) IN ('opd', 'relawan'));


-- ==========================================
-- 4. POLICIES UNTUK TABEL: relawan
-- ==========================================
-- [Super Admin]: Bebas melakukan CRUD ke tabel relawan
CREATE POLICY super_admin_all_relawan ON public.relawan 
    FOR ALL 
    USING (current_setting('app.current_user_role', true) = 'super_admin');

-- [Relawan]: Hanya boleh melihat & mengedit profil aslinya sendiri (user_id miliknya)
CREATE POLICY self_access_relawan ON public.relawan
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::integer);

-- [Relawan]: Aturan agar relawan dapat melihat data relawan di user mereka sendiri
CREATE POLICY relawan_self_select ON public.relawan
    FOR SELECT USING (true);


-- ==========================================
-- 5. POLICIES UNTUK TABEL: penugasan_relawan
-- ==========================================
-- [Super Admin]: Bebas akses
CREATE POLICY super_admin_all_penugasan ON public.penugasan_relawan 
    FOR ALL 
    USING (current_setting('app.current_user_role', true) = 'super_admin');

-- [Relawan]: Hanya boleh melihat (SELECT) penugasannya sendiri
CREATE POLICY self_access_penugasan ON public.penugasan_relawan
    FOR SELECT
    USING (relawan_id IN (
        SELECT relawan_id FROM public.relawan WHERE user_id = current_setting('app.current_user_id', true)::integer
    ));


-- ==========================================
-- 6. POLICIES UNTUK TABEL: kader
-- ==========================================
-- [Super Admin]: Bebas melakukan CRUD
CREATE POLICY super_admin_all_kader ON public.kader 
    FOR ALL 
    USING (current_setting('app.current_user_role', true) = 'super_admin');

-- [OPD]: Hanya boleh akses kader dari OPD mereka sendiri
CREATE POLICY opd_access_kader ON public.kader 
    FOR ALL 
    USING (
        current_setting('app.current_user_role', true) = 'opd' 
        AND opd_id = current_setting('app.current_opd_id', true)::integer
    );

-- [Relawan]: Hanya boleh SELECT kader dari OPD mereka
CREATE POLICY relawan_access_kader ON public.kader 
    FOR SELECT 
    USING (
        current_setting('app.current_user_role', true) = 'relawan'
        AND opd_id IN (
            SELECT pr.opd_id 
            FROM public.penugasan_relawan pr 
            JOIN public.relawan r ON pr.relawan_id = r.relawan_id 
            WHERE r.user_id = current_setting('app.current_user_id', true)::integer
        )
    );


-- ==========================================
-- 7. POLICIES UNTUK TABEL: pengajuan_perubahan_data
-- ==========================================
-- [Super Admin]: full access
CREATE POLICY super_admin_all_pengajuan ON public.pengajuan_perubahan_data
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'super_admin');

-- [OPD]: bisa lihat dan update semua pengajuan
CREATE POLICY opd_all_pengajuan ON public.pengajuan_perubahan_data
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'opd');

-- [Relawan]: hanya lihat pengajuan milik sendiri
CREATE POLICY relawan_own_pengajuan ON public.pengajuan_perubahan_data
    FOR SELECT
    USING (
        relawan_id IN (
            SELECT relawan_id FROM public.relawan 
            WHERE user_id = current_setting('app.current_user_id', true)::integer
        )
    );


-- ==========================================
-- 8. MIGRATION SCRIPT (Insert data relawan awal)
-- ==========================================
INSERT INTO public.relawan (user_id, jenis_kelamin, alamat_ktp, kelurahan)
SELECT 
    u.user_id,
    CASE 
        WHEN u.nama_lengkap ILIKE '%siti%' 
          OR u.nama_lengkap ILIKE '%dewi%' 
          OR u.nama_lengkap ILIKE '%aminah%'
          OR u.nama_lengkap ILIKE '%lestari%'
        THEN 'P'
        ELSE 'L'
    END::jenis_kelamin,
    '-',
    '-'
FROM public.users u
LEFT JOIN public.relawan r ON u.user_id = r.user_id
WHERE u.role = 'relawan' 
  AND r.relawan_id IS NULL;


-- RLS TERBARU DARI SETIAP TABLE YANG DI AMBIL DARI SUPABASE DENGAN FORMAT JSON
-- dengan QUERY SEPERTI INI :
-- SELECT *
-- FROM pg_policies
-- WHERE tablename = 'nama_tabel';

-- Table users, surat_keputusan, pengelola_opd, pic_kader, saran_masukan, hotline_settings, dan audit_logs saat aku jalankan querynya, tidak ada rls policy

[
  {
    "schemaname": "public",
    "tablename": "penugasan_relawan",
    "policyname": "opd_access_penugasan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((current_setting('app.current_user_role'::text, true) = 'opd'::text) AND (opd_id = (current_setting('app.current_opd_id'::text, true))::integer))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "penugasan_relawan",
    "policyname": "self_access_penugasan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(relawan_id IN ( SELECT relawan.relawan_id\n   FROM relawan\n  WHERE (relawan.user_id = (current_setting('app.current_user_id'::text, true))::integer)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "penugasan_relawan",
    "policyname": "super_admin_all_penugasan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(current_setting('app.current_user_role'::text, true) = 'super_admin'::text)",
    "with_check": null
  }
]

[
  {
    "schemaname": "public",
    "tablename": "relawan",
    "policyname": "opd_insert_relawan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(current_setting('app.current_user_role'::text, true) = 'opd'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "relawan",
    "policyname": "opd_update_relawan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((current_setting('app.current_user_role'::text, true) = 'opd'::text) AND (relawan_id IN ( SELECT pr.relawan_id\n   FROM penugasan_relawan pr\n  WHERE (pr.opd_id = (current_setting('app.current_opd_id'::text, true))::integer))))",
    "with_check": "(current_setting('app.current_user_role'::text, true) = 'opd'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "relawan",
    "policyname": "relawan_self_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "relawan",
    "policyname": "self_access_relawan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(user_id = (current_setting('app.current_user_id'::text, true))::integer)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "relawan",
    "policyname": "super_admin_all_relawan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(current_setting('app.current_user_role'::text, true) = 'super_admin'::text)",
    "with_check": null
  }
]

[
  {
    "schemaname": "public",
    "tablename": "opd",
    "policyname": "opd_relawan_select_opd",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(current_setting('app.current_user_role'::text, true) = ANY (ARRAY['opd'::text, 'relawan'::text]))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "opd",
    "policyname": "super_admin_all_opd",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(current_setting('app.current_user_role'::text, true) = 'super_admin'::text)",
    "with_check": null
  }
]

[
  {
    "schemaname": "public",
    "tablename": "kader",
    "policyname": "opd_access_kader",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((current_setting('app.current_user_role'::text, true) = 'opd'::text) AND (opd_id = (current_setting('app.current_opd_id'::text, true))::integer))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "kader",
    "policyname": "relawan_access_kader",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((current_setting('app.current_user_role'::text, true) = 'relawan'::text) AND (opd_id IN ( SELECT pr.opd_id\n   FROM (penugasan_relawan pr\n     JOIN relawan r ON ((pr.relawan_id = r.relawan_id)))\n  WHERE (r.user_id = (current_setting('app.current_user_id'::text, true))::integer))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "kader",
    "policyname": "super_admin_all_kader",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(current_setting('app.current_user_role'::text, true) = 'super_admin'::text)",
    "with_check": null
  }
]

[
  {
    "schemaname": "public",
    "tablename": "pengajuan_perubahan_data",
    "policyname": "opd_all_pengajuan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(current_setting('app.current_user_role'::text, true) = 'opd'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pengajuan_perubahan_data",
    "policyname": "relawan_own_pengajuan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(relawan_id IN ( SELECT relawan.relawan_id\n   FROM relawan\n  WHERE (relawan.user_id = (current_setting('app.current_user_id'::text, true))::integer)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pengajuan_perubahan_data",
    "policyname": "super_admin_all_pengajuan",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(current_setting('app.current_user_role'::text, true) = 'super_admin'::text)",
    "with_check": null
  }
]