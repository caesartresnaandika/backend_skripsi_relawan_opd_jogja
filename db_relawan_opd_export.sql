--
-- PostgreSQL database dump
--

\restrict GipzpeVAJYxLLZA1thnJehyjb0fMAVNWDPFOYAM6f9loEGa8Uam5rpnbgFULOBU

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.0

-- Started on 2026-01-30 14:48:32

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS db_relawan_opd;
--
-- TOC entry 5146 (class 1262 OID 16574)
-- Name: db_relawan_opd; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE db_relawan_opd WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Indonesia.1252';


ALTER DATABASE db_relawan_opd OWNER TO postgres;

\unrestrict GipzpeVAJYxLLZA1thnJehyjb0fMAVNWDPFOYAM6f9loEGa8Uam5rpnbgFULOBU
\connect db_relawan_opd
\restrict GipzpeVAJYxLLZA1thnJehyjb0fMAVNWDPFOYAM6f9loEGa8Uam5rpnbgFULOBU

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 16783)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 877 (class 1247 OID 16802)
-- Name: jenis_kelamin; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jenis_kelamin AS ENUM (
    'L',
    'P'
);


ALTER TYPE public.jenis_kelamin OWNER TO postgres;

--
-- TOC entry 874 (class 1247 OID 16794)
-- Name: status_pembayaran; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_pembayaran AS ENUM (
    'belum_bayar',
    'lunas',
    'gagal'
);


ALTER TYPE public.status_pembayaran OWNER TO postgres;

--
-- TOC entry 871 (class 1247 OID 16785)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin_bappeda',
    'verifikator',
    'operator_opd',
    'relawan'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 16973)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    action_type character varying(50),
    table_name character varying(50),
    record_id integer,
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(45),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16972)
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 237
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- TOC entry 230 (class 1259 OID 16901)
-- Name: dokumen_relawan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dokumen_relawan (
    dokumen_id integer NOT NULL,
    relawan_id integer,
    jenis_dokumen character varying(50) NOT NULL,
    nomor_dokumen character varying(100),
    tanggal_terbit date,
    tanggal_berakhir date,
    file_path text NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.dokumen_relawan OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16900)
-- Name: dokumen_relawan_dokumen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dokumen_relawan_dokumen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dokumen_relawan_dokumen_id_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 229
-- Name: dokumen_relawan_dokumen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dokumen_relawan_dokumen_id_seq OWNED BY public.dokumen_relawan.dokumen_id;


--
-- TOC entry 226 (class 1259 OID 16856)
-- Name: komunitas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.komunitas (
    komunitas_id integer NOT NULL,
    opd_id integer,
    nama_komunitas character varying(100) NOT NULL,
    deskripsi text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.komunitas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16855)
-- Name: komunitas_komunitas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.komunitas_komunitas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.komunitas_komunitas_id_seq OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 225
-- Name: komunitas_komunitas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.komunitas_komunitas_id_seq OWNED BY public.komunitas.komunitas_id;


--
-- TOC entry 222 (class 1259 OID 16825)
-- Name: opd; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opd (
    opd_id integer NOT NULL,
    nama_opd character varying(100) NOT NULL,
    alamat text,
    kontak character varying(50),
    kode_unit character varying(20)
);


ALTER TABLE public.opd OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16824)
-- Name: opd_opd_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opd_opd_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opd_opd_id_seq OWNER TO postgres;

--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 221
-- Name: opd_opd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opd_opd_id_seq OWNED BY public.opd.opd_id;


--
-- TOC entry 224 (class 1259 OID 16836)
-- Name: pengelola_opd; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengelola_opd (
    id integer NOT NULL,
    user_id integer,
    opd_id integer
);


ALTER TABLE public.pengelola_opd OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16835)
-- Name: pengelola_opd_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengelola_opd_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengelola_opd_id_seq OWNER TO postgres;

--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 223
-- Name: pengelola_opd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengelola_opd_id_seq OWNED BY public.pengelola_opd.id;


--
-- TOC entry 228 (class 1259 OID 16873)
-- Name: relawan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relawan (
    relawan_id integer NOT NULL,
    user_id integer,
    komunitas_id integer,
    nik character varying(16) NOT NULL,
    nama_lengkap character varying(100) NOT NULL,
    jenis_kelamin public.jenis_kelamin NOT NULL,
    tempat_lahir character varying(50),
    tanggal_lahir date,
    alamat_ktp text,
    alamat_domisili text,
    no_hp character varying(15),
    email character varying(100),
    status_bpjs_aktif boolean DEFAULT false,
    no_bpjs character varying(20),
    foto_profil text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.relawan OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16872)
-- Name: relawan_relawan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.relawan_relawan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relawan_relawan_id_seq OWNER TO postgres;

--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 227
-- Name: relawan_relawan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.relawan_relawan_id_seq OWNED BY public.relawan.relawan_id;


--
-- TOC entry 234 (class 1259 OID 16936)
-- Name: riwayat_pembayaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.riwayat_pembayaran (
    pembayaran_id integer NOT NULL,
    tagihan_id integer,
    tanggal_bayar timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    jumlah_bayar numeric(10,2),
    metode_pembayaran character varying(50),
    bukti_bayar_path text,
    verifikasi_oleh integer
);


ALTER TABLE public.riwayat_pembayaran OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16935)
-- Name: riwayat_pembayaran_pembayaran_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.riwayat_pembayaran_pembayaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.riwayat_pembayaran_pembayaran_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 233
-- Name: riwayat_pembayaran_pembayaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.riwayat_pembayaran_pembayaran_id_seq OWNED BY public.riwayat_pembayaran.pembayaran_id;


--
-- TOC entry 232 (class 1259 OID 16919)
-- Name: tagihan_bpjs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tagihan_bpjs (
    tagihan_id integer NOT NULL,
    relawan_id integer,
    periode_bulan date NOT NULL,
    jumlah_tagihan numeric(10,2) NOT NULL,
    status_bayar public.status_pembayaran DEFAULT 'belum_bayar'::public.status_pembayaran,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tagihan_bpjs OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16918)
-- Name: tagihan_bpjs_tagihan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tagihan_bpjs_tagihan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tagihan_bpjs_tagihan_id_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 231
-- Name: tagihan_bpjs_tagihan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tagihan_bpjs_tagihan_id_seq OWNED BY public.tagihan_bpjs.tagihan_id;


--
-- TOC entry 236 (class 1259 OID 16957)
-- Name: tugas_relawan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tugas_relawan (
    tugas_id integer NOT NULL,
    relawan_id integer,
    judul_tugas character varying(150),
    deskripsi text,
    lokasi_tugas character varying(100),
    tanggal_mulai date,
    tanggal_selesai date,
    status_penyelesaian character varying(20) DEFAULT 'berjalan'::character varying
);


ALTER TABLE public.tugas_relawan OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16956)
-- Name: tugas_relawan_tugas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tugas_relawan_tugas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tugas_relawan_tugas_id_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 235
-- Name: tugas_relawan_tugas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tugas_relawan_tugas_id_seq OWNED BY public.tugas_relawan.tugas_id;


--
-- TOC entry 220 (class 1259 OID 16808)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    nik character varying(16) NOT NULL,
    password character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    nama_lengkap character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    CONSTRAINT users_nik_check CHECK ((length((nik)::text) = 16))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16807)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4930 (class 2604 OID 16976)
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 16904)
-- Name: dokumen_relawan dokumen_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dokumen_relawan ALTER COLUMN dokumen_id SET DEFAULT nextval('public.dokumen_relawan_dokumen_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 16859)
-- Name: komunitas komunitas_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.komunitas ALTER COLUMN komunitas_id SET DEFAULT nextval('public.komunitas_komunitas_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 16828)
-- Name: opd opd_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd ALTER COLUMN opd_id SET DEFAULT nextval('public.opd_opd_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 16839)
-- Name: pengelola_opd id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengelola_opd ALTER COLUMN id SET DEFAULT nextval('public.pengelola_opd_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 16876)
-- Name: relawan relawan_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relawan ALTER COLUMN relawan_id SET DEFAULT nextval('public.relawan_relawan_id_seq'::regclass);


--
-- TOC entry 4926 (class 2604 OID 16939)
-- Name: riwayat_pembayaran pembayaran_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_pembayaran ALTER COLUMN pembayaran_id SET DEFAULT nextval('public.riwayat_pembayaran_pembayaran_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 16922)
-- Name: tagihan_bpjs tagihan_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan_bpjs ALTER COLUMN tagihan_id SET DEFAULT nextval('public.tagihan_bpjs_tagihan_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 16960)
-- Name: tugas_relawan tugas_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tugas_relawan ALTER COLUMN tugas_id SET DEFAULT nextval('public.tugas_relawan_tugas_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 16811)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5140 (class 0 OID 16973)
-- Dependencies: 238
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5132 (class 0 OID 16901)
-- Dependencies: 230
-- Data for Name: dokumen_relawan; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5128 (class 0 OID 16856)
-- Dependencies: 226
-- Data for Name: komunitas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.komunitas VALUES (1, 1, 'TAGANA (Taruna Siaga Bencana)', 'Relawan penanggulangan bencana sosial', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (2, 1, 'TKSK (Tenaga Kesejahteraan Sosial)', 'Relawan sosial tingkat kecamatan', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (3, 2, 'TRC (Tim Reaksi Cepat)', 'Unit gerak cepat penanganan bencana alam', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (4, 2, 'FPRB (Forum Pengurangan Risiko Bencana)', 'Relawan mitigasi bencana', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (5, 3, 'Relawan Damkar (REDKAR)', 'Relawan pemadam kebakaran mandiri', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (6, 4, 'LINMAS (Perlindungan Masyarakat)', 'Relawan keamanan lingkungan', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (7, 4, 'Jaga Warga', 'Kelompok relawan keamanan kampung', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (8, 5, 'Kader Jumantik', 'Juru pemantau jentik nyamuk', true) ON CONFLICT DO NOTHING;
INSERT INTO public.komunitas VALUES (9, 5, 'Kader Posyandu Lansia', 'Relawan kesehatan lansia', true) ON CONFLICT DO NOTHING;


--
-- TOC entry 5124 (class 0 OID 16825)
-- Dependencies: 222
-- Data for Name: opd; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.opd VALUES (1, 'Dinas Sosial (Dinsos)', 'Jl. Kenari No. 1, Yogyakarta', '0274-123456', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.opd VALUES (2, 'Badan Penanggulangan Bencana Daerah (BPBD)', 'Jl. Gambiran No. 30, Yogyakarta', '0274-654321', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.opd VALUES (3, 'Dinas Pemadam Kebakaran (Damkar)', 'Jl. Kenari No. 56, Yogyakarta', '0274-113113', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.opd VALUES (4, 'Satpol PP', 'Jl. Balai Kota No. 1, Yogyakarta', '0274-777888', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.opd VALUES (5, 'Dinas Kesehatan', 'Jl. Mangkubumi No. 10, Yogyakarta', '0274-999000', NULL) ON CONFLICT DO NOTHING;


--
-- TOC entry 5126 (class 0 OID 16836)
-- Dependencies: 224
-- Data for Name: pengelola_opd; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pengelola_opd VALUES (1, 3, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.pengelola_opd VALUES (2, 4, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.pengelola_opd VALUES (3, 5, 3) ON CONFLICT DO NOTHING;


--
-- TOC entry 5130 (class 0 OID 16873)
-- Dependencies: 228
-- Data for Name: relawan; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.relawan VALUES (1, 6, 1, '3471010101010011', 'Andi Pratama (Tagana)', 'L', 'Yogyakarta', '1990-05-12', NULL, 'Gondokusuman', '081234567890', NULL, true, '90001234567', NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (2, 7, 2, '3471010101010012', 'Dewi Lestari (TKSK)', 'P', 'Sleman', '1992-08-20', NULL, 'Umbulharjo', '081234567891', NULL, true, '90001234568', NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (3, 8, 3, '3471010101010013', 'Eko Saputra (TRC)', 'L', 'Bantul', '1988-11-10', NULL, 'Kotagede', '081234567892', NULL, false, NULL, NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (4, 9, 4, '3471010101010014', 'Fajar Nugroho (FPRB)', 'L', 'Yogyakarta', '1995-02-15', NULL, 'Tegalrejo', '081234567893', NULL, true, '90001234569', NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (5, 10, 5, '3471010101010015', 'Gita Pertiwi (Redkar)', 'P', 'Solo', '1998-07-01', NULL, 'Danurejan', '081234567894', NULL, false, NULL, NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (6, 11, 6, '3471010101010016', 'Hendra Wijaya (Linmas)', 'L', 'Magelang', '1985-03-30', NULL, 'Wirobrajan', '081234567895', NULL, true, '90001234570', NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (7, 12, 7, '3471010101010017', 'Indah Sari (Jaga Warga)', 'P', 'Yogyakarta', '1991-09-09', NULL, 'Mantrijeron', '081234567896', NULL, false, NULL, NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (8, 13, 8, '3471010101010018', 'Junaedi (Jumantik)', 'L', 'Klaten', '1989-12-12', NULL, 'Jetis', '081234567897', NULL, true, '90001234571', NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (9, 14, 9, '3471010101010019', 'Kartika Putri (Posyandu)', 'P', 'Yogyakarta', '1993-04-21', NULL, 'Kraton', '081234567898', NULL, true, '90001234572', NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;
INSERT INTO public.relawan VALUES (10, 15, 1, '3471010101010020', 'Lukman Hakim (Tagana)', 'L', 'Gunung Kidul', '1996-06-06', NULL, 'Pakualaman', '081234567899', NULL, false, NULL, NULL, '2026-01-30 12:06:54.333564+07', '2026-01-30 12:06:54.333564+07') ON CONFLICT DO NOTHING;


--
-- TOC entry 5136 (class 0 OID 16936)
-- Dependencies: 234
-- Data for Name: riwayat_pembayaran; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5134 (class 0 OID 16919)
-- Dependencies: 232
-- Data for Name: tagihan_bpjs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tagihan_bpjs VALUES (1, 1, '2026-02-01', 16800.00, 'lunas', '2026-01-30 12:06:54.333564') ON CONFLICT DO NOTHING;
INSERT INTO public.tagihan_bpjs VALUES (2, 2, '2026-02-01', 16800.00, 'belum_bayar', '2026-01-30 12:06:54.333564') ON CONFLICT DO NOTHING;
INSERT INTO public.tagihan_bpjs VALUES (3, 4, '2026-02-01', 16800.00, 'lunas', '2026-01-30 12:06:54.333564') ON CONFLICT DO NOTHING;
INSERT INTO public.tagihan_bpjs VALUES (4, 6, '2026-02-01', 16800.00, 'gagal', '2026-01-30 12:06:54.333564') ON CONFLICT DO NOTHING;
INSERT INTO public.tagihan_bpjs VALUES (5, 8, '2026-02-01', 16800.00, 'belum_bayar', '2026-01-30 12:06:54.333564') ON CONFLICT DO NOTHING;


--
-- TOC entry 5138 (class 0 OID 16957)
-- Dependencies: 236
-- Data for Name: tugas_relawan; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tugas_relawan VALUES (1, 1, 'Piket Posko Banjir', 'Siaga bencana musim hujan', 'Posko Induk BPBD', '2026-02-01', '2026-02-07', 'selesai') ON CONFLICT DO NOTHING;
INSERT INTO public.tugas_relawan VALUES (2, 1, 'Distribusi Logistik', 'Pengiriman bantuan sembako', 'Kec. Kotagede', '2026-02-10', '2026-02-10', 'berjalan') ON CONFLICT DO NOTHING;
INSERT INTO public.tugas_relawan VALUES (3, 3, 'Evakuasi Pohon Tumbang', 'Penanganan pohon tumbang', 'Jl. Sudirman', '2026-02-05', '2026-02-05', 'selesai') ON CONFLICT DO NOTHING;
INSERT INTO public.tugas_relawan VALUES (4, 5, 'Sosialisasi Kebakaran', 'Edukasi pencegahan kebakaran', 'Kel. Terban', '2026-02-12', '2026-02-12', 'berjalan') ON CONFLICT DO NOTHING;
INSERT INTO public.tugas_relawan VALUES (5, 8, 'Pemeriksaan Jentik', 'Cek bak mandi warga', 'RW 05 Jetis', '2026-02-08', '2026-02-08', 'selesai') ON CONFLICT DO NOTHING;


--
-- TOC entry 5122 (class 0 OID 16808)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, '3471010101010001', 'password123', 'admin_bappeda', 'Budi Santoso (Admin Pusat)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (2, '3471010101010002', 'password123', 'verifikator', 'Siti Aminah (Verifikator)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (3, '3471010101010003', 'password123', 'operator_opd', 'Rina Wati (Admin Dinsos)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (4, '3471010101010004', 'password123', 'operator_opd', 'Joko Susilo (Admin BPBD)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (5, '3471010101010005', 'password123', 'operator_opd', 'Heru Purnomo (Admin Damkar)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (6, '3471010101010011', 'password123', 'relawan', 'Andi Pratama (Tagana)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (7, '3471010101010012', 'password123', 'relawan', 'Dewi Lestari (TKSK)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (8, '3471010101010013', 'password123', 'relawan', 'Eko Saputra (TRC)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (9, '3471010101010014', 'password123', 'relawan', 'Fajar Nugroho (FPRB)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (10, '3471010101010015', 'password123', 'relawan', 'Gita Pertiwi (Redkar)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (11, '3471010101010016', 'password123', 'relawan', 'Hendra Wijaya (Linmas)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (12, '3471010101010017', 'password123', 'relawan', 'Indah Sari (Jaga Warga)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (13, '3471010101010018', 'password123', 'relawan', 'Junaedi (Jumantik)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (14, '3471010101010019', 'password123', 'relawan', 'Kartika Putri (Posyandu)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (15, '3471010101010020', 'password123', 'relawan', 'Lukman Hakim (Tagana)', true, '2026-01-30 12:06:54.333564+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (16, '1234567890123456', '$2b$10$P0uJCNLMkdim4WwWbgrkpegtaJ/SIO6pBrCPfAvuSe/RpE0sfzJHC', 'relawan', 'User Testing', true, '2026-01-30 12:45:04.300693+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (17, '1234567890123457', '$2b$10$zqD8F/3ntTDJIC4zp0wkPOhy/U9qL7uwY06p6HJDEOfxYOlhbFMVO', 'operator_opd', 'User Testing', true, '2026-01-30 13:00:26.319239+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (18, '1234567890123458', '$2b$10$mG.KJjKG8km3jn86IfIXqOaphEjpP8Uh7ZoN45SsAc85xRaUAe9ka', 'operator_opd', 'User Testing operator_opd', true, '2026-01-30 13:03:00.832407+07', NULL) ON CONFLICT DO NOTHING;


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 237
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 1, false);


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 229
-- Name: dokumen_relawan_dokumen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dokumen_relawan_dokumen_id_seq', 1, false);


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 225
-- Name: komunitas_komunitas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.komunitas_komunitas_id_seq', 9, true);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 221
-- Name: opd_opd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opd_opd_id_seq', 5, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 223
-- Name: pengelola_opd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengelola_opd_id_seq', 3, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 227
-- Name: relawan_relawan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.relawan_relawan_id_seq', 10, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 233
-- Name: riwayat_pembayaran_pembayaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.riwayat_pembayaran_pembayaran_id_seq', 1, false);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 231
-- Name: tagihan_bpjs_tagihan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tagihan_bpjs_tagihan_id_seq', 5, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 235
-- Name: tugas_relawan_tugas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tugas_relawan_tugas_id_seq', 5, true);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 18, true);


--
-- TOC entry 4962 (class 2606 OID 16982)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4953 (class 2606 OID 16912)
-- Name: dokumen_relawan dokumen_relawan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dokumen_relawan
    ADD CONSTRAINT dokumen_relawan_pkey PRIMARY KEY (dokumen_id);


--
-- TOC entry 4944 (class 2606 OID 16866)
-- Name: komunitas komunitas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.komunitas
    ADD CONSTRAINT komunitas_pkey PRIMARY KEY (komunitas_id);


--
-- TOC entry 4938 (class 2606 OID 16834)
-- Name: opd opd_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd
    ADD CONSTRAINT opd_pkey PRIMARY KEY (opd_id);


--
-- TOC entry 4940 (class 2606 OID 16842)
-- Name: pengelola_opd pengelola_opd_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengelola_opd
    ADD CONSTRAINT pengelola_opd_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 16844)
-- Name: pengelola_opd pengelola_opd_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengelola_opd
    ADD CONSTRAINT pengelola_opd_user_id_key UNIQUE (user_id);


--
-- TOC entry 4949 (class 2606 OID 16889)
-- Name: relawan relawan_nik_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relawan
    ADD CONSTRAINT relawan_nik_key UNIQUE (nik);


--
-- TOC entry 4951 (class 2606 OID 16887)
-- Name: relawan relawan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relawan
    ADD CONSTRAINT relawan_pkey PRIMARY KEY (relawan_id);


--
-- TOC entry 4958 (class 2606 OID 16945)
-- Name: riwayat_pembayaran riwayat_pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_pembayaran
    ADD CONSTRAINT riwayat_pembayaran_pkey PRIMARY KEY (pembayaran_id);


--
-- TOC entry 4956 (class 2606 OID 16929)
-- Name: tagihan_bpjs tagihan_bpjs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan_bpjs
    ADD CONSTRAINT tagihan_bpjs_pkey PRIMARY KEY (tagihan_id);


--
-- TOC entry 4960 (class 2606 OID 16966)
-- Name: tugas_relawan tugas_relawan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tugas_relawan
    ADD CONSTRAINT tugas_relawan_pkey PRIMARY KEY (tugas_id);


--
-- TOC entry 4934 (class 2606 OID 16823)
-- Name: users users_nik_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nik_key UNIQUE (nik);


--
-- TOC entry 4936 (class 2606 OID 16821)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4945 (class 1259 OID 16990)
-- Name: idx_relawan_komunitas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_relawan_komunitas ON public.relawan USING btree (komunitas_id);


--
-- TOC entry 4946 (class 1259 OID 16989)
-- Name: idx_relawan_nama; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_relawan_nama ON public.relawan USING btree (nama_lengkap);


--
-- TOC entry 4947 (class 1259 OID 16988)
-- Name: idx_relawan_nik; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_relawan_nik ON public.relawan USING btree (nik);


--
-- TOC entry 4954 (class 1259 OID 16991)
-- Name: idx_tagihan_periode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tagihan_periode ON public.tagihan_bpjs USING btree (periode_bulan);


--
-- TOC entry 4973 (class 2606 OID 16983)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4968 (class 2606 OID 16913)
-- Name: dokumen_relawan dokumen_relawan_relawan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dokumen_relawan
    ADD CONSTRAINT dokumen_relawan_relawan_id_fkey FOREIGN KEY (relawan_id) REFERENCES public.relawan(relawan_id) ON DELETE CASCADE;


--
-- TOC entry 4965 (class 2606 OID 16867)
-- Name: komunitas komunitas_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.komunitas
    ADD CONSTRAINT komunitas_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd(opd_id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 16850)
-- Name: pengelola_opd pengelola_opd_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengelola_opd
    ADD CONSTRAINT pengelola_opd_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd(opd_id) ON DELETE CASCADE;


--
-- TOC entry 4964 (class 2606 OID 16845)
-- Name: pengelola_opd pengelola_opd_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengelola_opd
    ADD CONSTRAINT pengelola_opd_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 16895)
-- Name: relawan relawan_komunitas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relawan
    ADD CONSTRAINT relawan_komunitas_id_fkey FOREIGN KEY (komunitas_id) REFERENCES public.komunitas(komunitas_id);


--
-- TOC entry 4967 (class 2606 OID 16890)
-- Name: relawan relawan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relawan
    ADD CONSTRAINT relawan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4970 (class 2606 OID 16946)
-- Name: riwayat_pembayaran riwayat_pembayaran_tagihan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_pembayaran
    ADD CONSTRAINT riwayat_pembayaran_tagihan_id_fkey FOREIGN KEY (tagihan_id) REFERENCES public.tagihan_bpjs(tagihan_id);


--
-- TOC entry 4971 (class 2606 OID 16951)
-- Name: riwayat_pembayaran riwayat_pembayaran_verifikasi_oleh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_pembayaran
    ADD CONSTRAINT riwayat_pembayaran_verifikasi_oleh_fkey FOREIGN KEY (verifikasi_oleh) REFERENCES public.users(user_id);


--
-- TOC entry 4969 (class 2606 OID 16930)
-- Name: tagihan_bpjs tagihan_bpjs_relawan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagihan_bpjs
    ADD CONSTRAINT tagihan_bpjs_relawan_id_fkey FOREIGN KEY (relawan_id) REFERENCES public.relawan(relawan_id) ON DELETE CASCADE;


--
-- TOC entry 4972 (class 2606 OID 16967)
-- Name: tugas_relawan tugas_relawan_relawan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tugas_relawan
    ADD CONSTRAINT tugas_relawan_relawan_id_fkey FOREIGN KEY (relawan_id) REFERENCES public.relawan(relawan_id) ON DELETE CASCADE;


--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2026-01-30 14:48:32

--
-- PostgreSQL database dump complete
--

\unrestrict GipzpeVAJYxLLZA1thnJehyjb0fMAVNWDPFOYAM6f9loEGa8Uam5rpnbgFULOBU

