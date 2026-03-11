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

### 6. Super Admin: Audit Logs (Selesai ✅)
- `GET /api/admin/logs` : Endpoint pagination (`?page=1&limit=10`) untuk melihat riwayat aktivitas sistem. Mendukung pemfilteran melalui *query params* `action_type`, `start_date`, dan `end_date`.

---

### 7. Peran Admin OPD (Selesai ✅)
*Perhatian: Rute-rute ini dilindungi middleware yang mengekstrak `opd_id` otomatis dari Token Login. Harap Login menggunakan NIK OPD!*
- `GET /api/opd-admin/dashboard` : Statistik agregat dan data grafik khusus OPD bersangkutan.
- `GET /api/opd-admin/kader` : List Kader (Komunitas) di instansinya.
- `POST /api/opd-admin/kader` : Tambah Kader (Komunitas).
- `PATCH /api/opd-admin/kader/:id` : Update nama/deskripsi Kader.
- `DELETE /api/opd-admin/kader/:id` : Hapus Kader.
- `GET /api/opd-admin/relawan` : List semua relawan yang pernah ditugaskan di OPD ini.
- `GET /api/opd-admin/sk` : Daftar SK di mana OPD ini dilibatkan.

---

### 8. Peran Relawan & Publik (Selesai ✅)
*Rute diamankan otomatis agar relawan HANYA bisa mengakses data miliknya sendiri melalui `relawan_id` (diambil dari Token JWT).*
- `GET /api/relawan/dashboard` : Poin, total kegiatan, dan rincian SK Aktif yang berlaku saat ini.
- `GET /api/relawan/profile` : Output data biodata dan profil dari database.
- `POST /api/relawan/profile/update` : Mengirim pengajuan perubahan biodata ke admin (Catatan: Ini melakukan Insert ke keranjang pengajuan, bukan UPDATE langsung).
- `GET /api/relawan/history` : Melihat sejarah pengerjaan dan status persetujuan data di masa lalu.

---

## 📝 Catatan Khusus Untuk Frontend Developer
1. **Mengenai ID di URL:** Jika melihat pola url seperti `/api/admin/sk/:id`, huruf `:id` selalu merujuk pada format *Integer* dari database (misal `1`, `12`, `45`), BUKAN tipe serial alfanumerik panjang.
2. **Penanganan Error:** Jika menjumpai pesan Error 500 saat Testing di Postman/Browser, kemungkinan besar terkait format struktur JSON yang dikirim di *Body*. Hubungi Backend jika bingung.
3. **Konsep Token:** Jangan pernah melewatkan penyematan *Authorization Bearer Token* kecuali pada endpoint Login & Register.
