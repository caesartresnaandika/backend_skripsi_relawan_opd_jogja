# Backend Sistem Relawan Bappeda

Repositori ini berisi source code backend untuk aplikasi **Manajemen Relawan Bappeda** menggunakan Node.js, Express, TypeScript, dan PostgreSQL. Repositori ini dibangun khusus untuk melayani kebutuhan integrasi dari tim Frontend (React/Vue).

## 🚀 Persiapan Awal (Instalasi)

Bagi rekan pengembang (khususnya Frontend Developer) yang baru melakukan `git clone` atau ingin menjalankan server API ini di lokal, ikuti langkah berikut:

### 1. Instalasi Dependencies
Buka terminal di folder project dan jalankan perintah:
```bash
npm install
```

### 2. Konfigurasi Environment (`.env`)
Buat file baru bernama `.env` di root folder project. Isi dengan format berikut (sesuaikan password database jika berbeda):

```env
PORT=3000
DB_USER=app_user
DB_PASSWORD=password_app
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_relawan_bappeda
JWT_SECRET=rahasia_jwt_super_aman_123
```
*(Catatan: Kita menggunakan `app_user` alih-alih `postgres` agar sistem keamanan Row-Level Security / RLS di database dapat berjalan).*

### 3. Setup Database (PostgreSQL)
1. Buat database baru di pgAdmin bernama `db_relawan_bappeda`.
2. Lakukan *Restore* file `db_relawan_opd_export.sql` ke dalam database tersebut.
3. Jalankan *Query* yang ada di file `rls_setup.sql` untuk mengaktifkan user `app_user` dan kebijakan *Row-Level Security (RLS)*. 

### 4. Menjalankan Server
Untuk mode development (dengan *hot-reload*):
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3000`.

---

## 🔐 Sistem Keamanan & Autentikasi

Aplikasi ini menggunakan **JWT (JSON Web Token)** dan memiliki 3 *Role* pengguna:
1. `super_admin` (Bappeda)
2. `opd` (Dinas/Mitra)
3. `relawan` (Individu)

**Cara Hit API:**
Setiap kali Frontend melakukan request ke endpoint yang dilindungi (selain `/login` dan `/register`), wajib menyertakan token di bagian *Headers*:
`Authorization: Bearer <token_jwt_disini>`

---

## 📡 Daftar API Endpoint (Status Saat Ini)

Berikut adalah daftar endpoint API yang sudah selesai dikerjakan dan siap diintegrasikan dengan Frontend:

### 1. Autentikasi (Selesai ✅)
- `POST /api/auth/register` : Mendaftar akun relawan/opd baru.
- `POST /api/auth/login` : Login untuk mendapatkan token JWT.

### 2. Super Admin: Manajemen OPD (Selesai ✅)
*Semua rute di bawah wajib memakai Token Super Admin.*
- `GET /api/opd` : List semua OPD.
- `POST /api/opd` : Tambah OPD baru.
- `PUT /api/opd/:id` : Update data OPD.
- `PATCH /api/opd/:id/status` : Aktifkan / Nonaktifkan OPD.

### 3. Super Admin: Manajemen Relawan (Selesai ✅)
- `GET /api/admin/relawan/pengajuan` : List antrian pengajuan perubahan biodata relawan.
- `POST /api/admin/relawan/pengajuan/:id/review` : Review (Approve/Reject) pengajuan biodata.
- `GET /api/admin/relawan` : List seluruh relawan terdaftar.
- `GET /api/admin/relawan/:id` : Detail lengkap 1 orang relawan.

### 4. Super Admin: Manajemen Surat Keputusan / SK (Selesai ✅)
- `GET /api/admin/sk` : List semua SK beserta jumlah relawan di dalamnya.
- `GET /api/admin/sk/:id` : Detail 1 SK beserta daftar NIK/Nama relawan yang ditugaskan.
- `POST /api/admin/sk` : **[Endpoint Sapu Jagat]** Upload data SK sekaligus melakukan *batch insert* penugasan (mapping) relawan menggunakan Array `daftar_relawan`.
- `PATCH /api/admin/sk/:id/status` : Menonaktifkan SK.

### 5. Super Admin: Dashboard & Statistik (Selesai ✅)
- `GET /api/admin/dashboard` : Endpoint paralel (super cepat) yang mengembalikan data ringkasan total, grafik sebaran OPD, dan grafik *donut* Demografi Relawan (Gender & Range Umur).

---

## 🚧 Sedang Dalam Pengerjaan (To-Do List Next)
Fitur-fitur ini belum dapat di-hit oleh Frontend karena dalam antrian pengerjaan backend selanjutnya:
1. **Audit Logs** (`GET /api/admin/logs`) 
2. **Endpoint khusus Admin OPD** (Dashboard OPD, Manajemen Kader, Filter SK OPD).
3. **Endpoint khusus Relawan** (Dashboard Relawan, Update Biodata).

## 📝 Catatan Khusus Untuk Frontend Developer
- **Mengenai ID di URL:** Jika melihat pola url seperti `/api/admin/sk/:id`, huruf `:id` selalu merujuk pada format *Integer* dari database (misal `1`, `12`, `45`), BUKAN tipe serial alfanumerik panjang.
- Jika menjumpai pesan Error 500 saat Testing di Postman/Browser, segera informasikan ke Backend Engineer beserta tangkapan layar respons JSON errornya (`dev_log`), karena kemungkinan besar itu menyangkut format payload JSON yang tidak cocok.
