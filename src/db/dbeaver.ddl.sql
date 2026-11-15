-- public.kemantren definition
-- Drop table
-- DROP TABLE public.kemantren;

create table public.kemantren (
	id varchar(20) not null,
	nama_kemantren varchar(100) not null,
	constraint kemantren_pkey primary key (id)
);

alter table public.kemantren enable row level security;
-- public.opd definition
-- Drop table
-- DROP TABLE public.opd;

create table public.opd (
	opd_id serial4 not null,
	nama_opd varchar(255) not null,
	alamat text null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	"status_keaktifan" bool default true null,
	constraint chk_alamat_length check (((alamat is null)
or (char_length(alamat) >= 5))),
	constraint chk_alamat_not_only_digits check (((alamat is null)
or (alamat !~ '^\d+$'::text))),
	constraint chk_nama_opd_length check (((char_length((nama_opd)::text) >= 3)
and (char_length((nama_opd)::text) <= 100))),
	constraint chk_nama_opd_no_digits check (((nama_opd)::text !~ '\d'::text)),
	constraint chk_nama_opd_valid_chars check (((nama_opd)::text ~ '^[a-zA-Z\s]+$'::text)),
	constraint opd_pkey primary key (opd_id)
);
-- Table Triggers

create trigger audit_trigger_opd after
insert
    or
delete
    or
update
    on
    public.opd for each row execute function log_audit_action();

create trigger trigger_opd_audit after
insert
    or
delete
    or
update
    on
    public.opd for each row execute function log_activity_trigger();

alter table public.opd enable row level security;
-- Table Policies

create policy opd_relawan_select_opd on
public.opd
 as PERMISSIVE
 for
select
        using ((current_setting('app.current_user_role'::text, true) = any (array['opd'::text,
    'relawan'::text])));

create policy super_admin_all_opd on
public.opd
 as PERMISSIVE
 for all
    using ((current_setting('app.current_user_role'::text, true) = 'super_admin'::text));
-- public.users definition
-- Drop table
-- DROP TABLE public.users;

create table public.users (
	user_id serial4 not null,
	nik varchar(16) not null,
	"password" varchar(255) not null,
	"role" public."user_role" not null,
	nama_lengkap varchar(255) not null,
	no_hp varchar(15) null,
	foto_profil text null,
	"status_keaktifan" bool default true null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	last_login timestamptz null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	constraint users_nik_key unique (nik),
	constraint users_pkey primary key (user_id)
);
-- Table Triggers

create trigger audit_trigger_users after
insert
    or
delete
    or
update
    on
    public.users for each row execute function log_audit_action();

create trigger trigger_users_audit after
insert
    or
delete
    or
update
    on
    public.users for each row execute function log_activity_trigger();

alter table public.users enable row level security;
-- public.audit_logs definition
-- Drop table
-- DROP TABLE public.audit_logs;

create table public.audit_logs (
	log_id serial4 not null,
	user_id int4 null,
	action_type varchar(50) not null,
	table_name varchar(50) not null,
	record_id int4 null,
	old_value jsonb null,
	new_value jsonb null,
	ip_address varchar(45) null,
	"timestamp" timestamptz default CURRENT_TIMESTAMP null,
	constraint audit_logs_pkey primary key (log_id),
	constraint fk_audit_user foreign key (user_id) references public.users(user_id) on
delete
    set
    null on
    update
        cascade
);

alter table public.audit_logs enable row level security;
-- public.hotline_settings definition
-- Drop table
-- DROP TABLE public.hotline_settings;

create table public.hotline_settings (
	id_saranhotline int4 default nextval('hotline_settings_id_seq'::regclass) not null,
	telepon varchar(50) not null,
	whatsapp varchar(50) not null,
	jam_layanan varchar(100) not null,
	updated_at timestamp default CURRENT_TIMESTAMP null,
	updated_by int4 null,
	constraint hotline_settings_pkey primary key (id_saranhotline),
	constraint fk_hotline_updated_by foreign key (updated_by) references public.users(user_id) on
delete
    set
    null on
    update
        cascade
);

alter table public.hotline_settings enable row level security;
-- public.kelurahan definition
-- Drop table
-- DROP TABLE public.kelurahan;

create table public.kelurahan (
	id_kelurahan varchar(20) not null,
	id_kemantren varchar(20) null,
	nama_kelurahan varchar(100) not null,
	constraint kelurahan_pkey primary key (id_kelurahan),
	constraint kelurahan_id_kemantren_fkey foreign key (id_kemantren) references public.kemantren(id) on
delete
    cascade
);

alter table public.kelurahan enable row level security;
-- public.relawan definition
-- Drop table
-- DROP TABLE public.relawan;

create table public.relawan (
	relawan_id serial4 not null,
	user_id int4 not null,
	"jenis_kelamin" public."jenis_kelamin" not null,
	alamat_ktp text not null,
	kelurahan varchar(100) null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	kemantren varchar(100) null,
	constraint relawan_pkey primary key (relawan_id),
	constraint relawan_user_id_key unique (user_id),
	constraint fk_relawan_user foreign key (user_id) references public.users(user_id) on
delete
    cascade on
    update
        cascade
);
-- Table Triggers

create trigger audit_trigger_relawan after
insert
    or
delete
    or
update
    on
    public.relawan for each row execute function log_audit_action();

create trigger trigger_relawan_audit after
insert
    or
delete
    or
update
    on
    public.relawan for each row execute function log_activity_trigger();

alter table public.relawan enable row level security;
-- Table Policies

create policy opd_insert_relawan on
public.relawan
 as PERMISSIVE
 for
insert
    with check ((current_setting('app.current_user_role'::text, true) = 'opd'::text));

create policy opd_update_relawan on
public.relawan
 as PERMISSIVE
 for
update
        using (((current_setting('app.current_user_role'::text, true) = 'opd'::text)
        and (relawan_id in (
        select
            pr.relawan_id
        from
            penugasan_relawan pr
        where
            (pr.opd_id = (current_setting('app.current_opd_id'::text, true))::integer)))))
 with check ((current_setting('app.current_user_role'::text, true) = 'opd'::text));

create policy relawan_self_select on
public.relawan
 as PERMISSIVE
 for
select
        using (true);

create policy self_access_relawan on
public.relawan
 as PERMISSIVE
 for all
    using ((user_id = (current_setting('app.current_user_id'::text, true))::integer));

create policy super_admin_all_relawan on
public.relawan
 as PERMISSIVE
 for all
    using ((current_setting('app.current_user_role'::text, true) = 'super_admin'::text));
-- public.saran_masukan definition
-- Drop table
-- DROP TABLE public.saran_masukan;

create table public.saran_masukan (
	saran_id serial4 not null,
	user_id int4 not null,
	subjek varchar(255) null,
	pesan text not null,
	"status_keaktifan" public."status_saran" default 'Menunggu'::status_saran null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	catatan_admin text null,
	constraint saran_masukan_pkey primary key (saran_id),
	constraint fk_saran_user foreign key (user_id) references public.users(user_id) on
delete
    cascade on
    update
        cascade
);

alter table public.saran_masukan enable row level security;
-- public.surat_keputusan definition
-- Drop table
-- DROP TABLE public.surat_keputusan;

create table public.surat_keputusan (
	sk_id serial4 not null,
	nomor_sk varchar(100) not null,
	judul_sk varchar(255) null,
	tanggal_terbit date null,
	opd_id int4 not null,
	file_path text not null,
	"status_keaktifan" public."status_keaktifan" default 'Aktif'::status_keaktifan null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	batas_aktif date null,
	constraint surat_keputusan_nomor_sk_key unique (nomor_sk),
	constraint surat_keputusan_pkey primary key (sk_id),
	constraint fk_sk_opd foreign key (opd_id) references public.opd(opd_id) on
delete
    cascade on
    update
        cascade
);
-- Table Triggers

create trigger audit_trigger_sk after
insert
    or
delete
    or
update
    on
    public.surat_keputusan for each row execute function log_audit_action();

create trigger trigger_sk_audit after
insert
    or
delete
    or
update
    on
    public.surat_keputusan for each row execute function log_activity_trigger();

alter table public.surat_keputusan enable row level security;
-- public.kader definition
-- Drop table
-- DROP TABLE public.kader;

create table public.kader (
	kader_id serial4 not null,
	opd_id int4 not null,
	nama_kader varchar(100) not null,
	deskripsi text null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	"status_keaktifan" bool default true null,
	sk_id int4 null,
	constraint kader_pkey primary key (kader_id),
	constraint fk_kader_sk foreign key (sk_id) references public.surat_keputusan(sk_id) on
delete
    set
    null on
    update
        cascade,
        constraint fk_komunitas_opd foreign key (opd_id) references public.opd(opd_id) on
        delete
            cascade on
            update
                cascade
);

create index idx_kader_sk_id on
public.kader
    using btree (sk_id);

create index idx_komunitas_opd on
public.kader
    using btree (opd_id);
-- Table Triggers

create trigger audit_trigger_kader after
insert
    or
delete
    or
update
    on
    public.kader for each row execute function log_audit_action();

create trigger trigger_kader_audit after
insert
    or
delete
    or
update
    on
    public.kader for each row execute function log_activity_trigger();

alter table public.kader enable row level security;
-- Table Policies

create policy opd_access_kader on
public.kader
 as PERMISSIVE
 for all
    using (((current_setting('app.current_user_role'::text, true) = 'opd'::text)
    and (opd_id = (current_setting('app.current_opd_id'::text, true))::integer)));

create policy relawan_access_kader on
public.kader
 as PERMISSIVE
 for
select
        using (((current_setting('app.current_user_role'::text, true) = 'relawan'::text)
        and (opd_id in (
        select
            pr.opd_id
        from
            (penugasan_relawan pr
        join relawan r on
            ((pr.relawan_id = r.relawan_id)))
        where
            (r.user_id = (current_setting('app.current_user_id'::text, true))::integer)))));

create policy super_admin_all_kader on
public.kader
 as PERMISSIVE
 for all
    using ((current_setting('app.current_user_role'::text, true) = 'super_admin'::text));
-- public.pengajuan_perubahan_data definition
-- Drop table
-- DROP TABLE public.pengajuan_perubahan_data;

create table public.pengajuan_perubahan_data (
	pengajuan_id serial4 not null,
	relawan_id int4 not null,
	jenis_perubahan varchar(50) not null,
	data_lama jsonb null,
	data_baru jsonb not null,
	"status_pengajuan" public."status_pengajuan" default 'Menunggu Review'::status_pengajuan null,
	catatan_relawan text null,
	catatan_verifikator text null,
	tanggal_pengajuan timestamptz default CURRENT_TIMESTAMP null,
	tanggal_verifikasi timestamptz null,
	verifikator_id int4 null,
	constraint pengajuan_perubahan_data_pkey primary key (pengajuan_id),
	constraint fk_pengajuan_relawan foreign key (relawan_id) references public.relawan(relawan_id) on
delete
    cascade on
    update
        cascade,
        constraint fk_pengajuan_verifikator foreign key (verifikator_id) references public.users(user_id) on
        delete
            set
            null on
            update
                cascade
);

alter table public.pengajuan_perubahan_data enable row level security;
-- Table Policies

create policy opd_all_pengajuan on
public.pengajuan_perubahan_data
 as PERMISSIVE
 for all
    using ((current_setting('app.current_user_role'::text, true) = 'opd'::text));

create policy relawan_own_pengajuan on
public.pengajuan_perubahan_data
 as PERMISSIVE
 for
select
        using ((relawan_id in (
    select
        relawan.relawan_id
    from
        relawan
    where
        (relawan.user_id = (current_setting('app.current_user_id'::text, true))::integer))));

create policy super_admin_all_pengajuan on
public.pengajuan_perubahan_data
 as PERMISSIVE
 for all
    using ((current_setting('app.current_user_role'::text, true) = 'super_admin'::text));
-- public.pengelola_opd definition
-- Drop table
-- DROP TABLE public.pengelola_opd;

create table public.pengelola_opd (
	id_pengelola_opd int4 default nextval('pengelola_opd_id_seq'::regclass) not null,
	user_id int4 not null,
	opd_id int4 not null,
	"jabatan" varchar(100) null,
	tanggal_mulai date default CURRENT_DATE null,
	tanggal_selesai date null,
	"status_keaktifan" varchar(20) default 'Aktif'::character varying not null,
	sk_id int4 null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	constraint pengelola_opd_pkey primary key (id_pengelola_opd),
	constraint fk_pengelola_opd foreign key (opd_id) references public.opd(opd_id) on
delete
    cascade on
    update
        cascade,
        constraint fk_pengelola_sk foreign key (sk_id) references public.surat_keputusan(sk_id) on
        delete
            set
            null on
            update
                cascade,
                constraint fk_pengelola_user foreign key (user_id) references public.users(user_id) on
                delete
                    cascade on
                    update
                        cascade
);

create index idx_pengelola_opd_opd_id on
public.pengelola_opd
    using btree (opd_id);

create index idx_pengelola_opd_sk_id on
public.pengelola_opd
    using btree (sk_id);

create index idx_pengelola_opd_status on
public.pengelola_opd
    using btree (status_keaktifan);

create unique index idx_unique_active_pengelola_per_opd on
public.pengelola_opd
    using btree (opd_id)
where
((status_keaktifan)::text = 'Aktif'::text);

alter table public.pengelola_opd enable row level security;
-- public.penugasan_relawan definition
-- Drop table
-- DROP TABLE public.penugasan_relawan;

create table public.penugasan_relawan (
	penugasan_id serial4 not null,
	relawan_id int4 not null,
	opd_id int4 not null,
	kader_id int4 null,
	sk_id int4 null,
	"jabatan" varchar(100) null,
	"status_keaktifan" public."status_keaktifan" default 'Aktif'::status_keaktifan null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	updated_at timestamptz default CURRENT_TIMESTAMP null,
	penugasan varchar(100) null,
	detail_jabatan varchar(255) null,
	constraint penugasan_relawan_pkey primary key (penugasan_id),
	constraint fk_penugasan_komunitas foreign key (kader_id) references public.kader(kader_id) on
delete
    set
    null on
    update
        cascade,
        constraint fk_penugasan_opd foreign key (opd_id) references public.opd(opd_id) on
        delete
            cascade on
            update
                cascade,
                constraint fk_penugasan_relawan foreign key (relawan_id) references public.relawan(relawan_id) on
                delete
                    cascade on
                    update
                        cascade,
                        constraint fk_penugasan_sk foreign key (sk_id) references public.surat_keputusan(sk_id) on
                        delete
                            set
                            null on
                            update
                                cascade
);

create index idx_penugasan_komunitas on
public.penugasan_relawan
    using btree (kader_id);

create index idx_penugasan_opd on
public.penugasan_relawan
    using btree (opd_id);

create index idx_penugasan_relawan on
public.penugasan_relawan
    using btree (relawan_id);
-- Table Triggers

create trigger audit_trigger_penugasan after
insert
    or
delete
    or
update
    on
    public.penugasan_relawan for each row execute function log_audit_action();

create trigger trigger_penugasan_audit after
insert
    or
delete
    or
update
    on
    public.penugasan_relawan for each row execute function log_activity_trigger();

alter table public.penugasan_relawan enable row level security;
-- Table Policies

create policy opd_access_penugasan on
public.penugasan_relawan
 as PERMISSIVE
 for all
    using (((current_setting('app.current_user_role'::text, true) = 'opd'::text)
    and (opd_id = (current_setting('app.current_opd_id'::text, true))::integer)));

create policy self_access_penugasan on
public.penugasan_relawan
 as PERMISSIVE
 for
select
        using ((relawan_id in (
    select
        relawan.relawan_id
    from
        relawan
    where
        (relawan.user_id = (current_setting('app.current_user_id'::text, true))::integer))));

create policy super_admin_all_penugasan on
public.penugasan_relawan
 as PERMISSIVE
 for all
    using ((current_setting('app.current_user_role'::text, true) = 'super_admin'::text));
-- public.pic_kader definition
-- Drop table
-- DROP TABLE public.pic_kader;

create table public.pic_kader (
	pic_kader_id serial4 not null,
	relawan_id int4 not null,
	kader_id int4 not null,
	tanggal_mulai date default CURRENT_DATE null,
	tanggal_selesai date null,
	"status_keaktifan" varchar(20) default 'Aktif'::character varying not null,
	created_at timestamptz default CURRENT_TIMESTAMP null,
	sk_id int4 null,
	constraint pic_kader_pkey primary key (pic_kader_id),
	constraint fk_pic_kader foreign key (kader_id) references public.kader(kader_id) on
delete
    cascade on
    update
        cascade,
        constraint fk_pic_kader_sk foreign key (sk_id) references public.surat_keputusan(sk_id) on
        delete
            set
            null on
            update
                cascade,
                constraint fk_pic_relawan foreign key (relawan_id) references public.relawan(relawan_id) on
                delete
                    cascade on
                    update
                        cascade
);

create index idx_pic_kader_sk_id on
public.pic_kader
    using btree (sk_id);

create index unique_active_pic_per_kader on
public.pic_kader
    using btree (kader_id);

alter table public.pic_kader enable row level security;
