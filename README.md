# Backend Sistem Relawan Bappeda

Repositori ini berisi source code backend untuk aplikasi **Manajemen Relawan Bappeda** menggunakan Node.js, Express, TypeScript, dan PostgreSQL. Repositori ini dibangun khusus untuk melayani kebutuhan integrasi dari tim Frontend (React/Vue).

## 🚀 Persiapan Awal (Instalasi)

Bagi rekan pengembang yang baru melakukan `git clone` atau ingin menjalankan server API ini di lokal, ikuti langkah berikut:

### 1. Instalasi Dependencies
Buka terminal di folder project dan jalankan perintah:
```bash
npm install
```

### 2. Konfigurasi Environment (`.env`)
Buat file baru bernama `.env` di root folder project. Untuk alasan keamanan, *credentials* asli tidak dipublikasikan di sini. Silakan minta konfigurasi `.env` yang valid kepada *Team Lead* atau tim Backend.

Berikut adalah format *keys* yang dibutuhkan:

```env
PORT=3000
DB_USER=app_user
DB_PASSWORD=<MINTA_KEPADA_TIM_BACKEND>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_relawan_bappeda
JWT_SECRET=<MINTA_KEPADA_TIM_BACKEND>
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

## 🌍 Panduan Singkat Deployment 

Bagi instansi atau Developer Mitra yang ingin melakukan *deployment* (hosting mandiri) aplikasi backend ini di server (seperti VPS) milik instansi masing-masing, berikut adalah panduan konfigurasinya:

1. **Persiapan Lingkungan (Environment):**
   - Pastikan server telah terinstal **Node.js** (minimal versi 18.x) dan **PostgreSQL** (minimal versi 14.x).
   - Install process manager seperti **PM2** secara global (`npm install -g pm2`) untuk menjaga aplikasi Node.js tetap berjalan di *background*.

2. **Clone & Build:**
   ```bash
   git clone <URL_REPOSITORY>
   cd backend_skripsi_relawan_opd_jogja
   npm install
   npm run build
   ```
   *(Proses `build` wajib dilakukan untuk mengkompilasi kode TypeScript menjadi JavaScript murni di dalam folder `dist/`).*

3. **Konfigurasi Variabel Production (`.env`):**
   - Buat file `.env` di server production berdasarkan format di atas.
   - Ubah nilai `DB_HOST` jika *Database PostgreSQL* berada di mesin/server yang berbeda dengan backend.
   - **PENTING:** Gunakan `JWT_SECRET` yang baru, panjang, dan acak untuk *production* agar token tidak mudah dibobol.
   - Pastikan `PORT` yang digunakan telah diizinkan (allow/whitelist) di Firewall server.

4. **Menjalankan Service Backend (PM2):**
   Jalankan file yang sudah dikompilasi menggunakan PM2:
   ```bash
   pm2 start dist/index.js --name "api-relawan"
   pm2 save
   pm2 startup
   ```

5. **Reverse Proxy (Sangat Disarankan):**
   Untuk keamanan, jangan mengekspos langsung port `3000` ke publik. Gunakan **Nginx** sebagai *Reverse Proxy* untuk meneruskan trafik dari Domain Utama/Subdomain ke `http://localhost:3000`, dan pasangkan sertifikat SSL (HTTPS).

---

## 🛠️ Arsitektur & Detail Teknis

1. **Serverless Deployment (Vercel):** Aplikasi backend ini dikonfigurasi untuk berjalan sebagai *Serverless Function* saat dideploy ke Vercel. Pada `index.ts`, aplikasi menggunakan `export default app` dan siap disajikan via eksekusi `vercel.json`.
2. **Middleware Prefix Auto-Correction:** Terdapat middleware global di `index.ts` yang cerdas. Jika Frontend mengirim request tanpa prefix `/api` (misal: `/auth/login`), middleware ini akan secara otomatis menambahkan `/api` di depannya.
3. **File Handling:** Aplikasi sudah mendukung penanganan file upload menggunakan library `multer` untuk memproses *multipart/form-data* (misalnya upload file dokumen/SK).

---

## 🔐 Sistem Keamanan & Autentikasi

Aplikasi ini menggunakan **JWT (JSON Web Token)** dan memiliki 3 *Role* pengguna:
1. `super_admin` (Bappeda)
2. `opd` (Dinas/Mitra)
3. `relawan` (Individu)

**Cara Hit API:**
Setiap kali Frontend melakukan request ke endpoint yang dilindungi (selain `/login`, `/register`, dan beberapa rute public), wajib menyertakan token di bagian *Headers*:
`Authorization: Bearer <token_jwt_disini>`

---

## 📡 Daftar API Endpoint (Status Saat Ini)

Berikut adalah daftar keseluruhan endpoint API yang didaftarkan pada server (di `index.ts`). Daftar ini terus diupdate menyesuaikan status *development*:

### 1. Autentikasi (`/api/auth`)
- `POST /api/auth/register` : Mendaftar akun relawan/opd baru.
- `POST /api/auth/login` : Login untuk mendapatkan token JWT.

### 2. Super Admin: Manajemen OPD (`/api/opd`)
*Semua rute di bawah wajib memakai Token Super Admin.*
- `GET /api/opd` : List semua OPD.
- `POST /api/opd` : Tambah OPD baru.
- `PUT /api/opd/:id` : Update data OPD.
- `PATCH /api/opd/:id/status` : Aktifkan / Nonaktifkan OPD.

### 3. Super Admin: Manajemen Relawan (`/api/admin/relawan`)
- `GET /api/admin/relawan/pengajuan` : List antrian pengajuan perubahan biodata relawan.
- `POST /api/admin/relawan/pengajuan/:id/review` : Review (Approve/Reject) pengajuan biodata.
- `GET /api/admin/relawan` : List seluruh relawan terdaftar.
- `GET /api/admin/relawan/:id` : Detail lengkap 1 orang relawan.

### 4. Super Admin: Manajemen Surat Keputusan / SK (`/api/admin/sk`)
- `GET /api/admin/sk` : List semua SK beserta jumlah relawan di dalamnya.
- `GET /api/admin/sk/:id` : Detail 1 SK beserta daftar NIK/Nama relawan yang ditugaskan.
- `POST /api/admin/sk` : **[Endpoint Sapu Jagat]** Upload data SK sekaligus melakukan *batch insert* penugasan (mapping) relawan menggunakan Array `daftar_relawan`.
- `PATCH /api/admin/sk/:id/status` : Menonaktifkan SK.

### 5. Super Admin: Dashboard, Statistik & Logs
- `GET /api/admin/dashboard` : Endpoint paralel (super cepat) yang mengembalikan data ringkasan total, grafik sebaran OPD, dan grafik *donut* Demografi Relawan (Gender & Range Umur).
- `GET /api/admin/logs` : Endpoint pagination (`?page=1&limit=10`) untuk melihat riwayat aktivitas sistem. Mendukung pemfilteran melalui *query params* `action_type`, `start_date`, dan `end_date`.

### 6. Peran Admin OPD (`/api/opd-admin`)
*Perhatian: Rute-rute ini dilindungi middleware yang mengekstrak `opd_id` otomatis dari Token Login. Harap Login menggunakan NIK OPD!*
- `GET /api/opd-admin/dashboard` : Statistik agregat dan data grafik khusus OPD bersangkutan.
- `GET /api/opd-admin/kader` : List Kader (Komunitas) di instansinya.
- `POST /api/opd-admin/kader` : Tambah Kader (Komunitas).
- `PATCH /api/opd-admin/kader/:id` : Update nama/deskripsi Kader.
- `DELETE /api/opd-admin/kader/:id` : Hapus Kader.
- `GET /api/opd-admin/relawan` : List semua relawan yang pernah ditugaskan di OPD ini.
- `GET /api/opd-admin/sk` : Daftar SK di mana OPD ini dilibatkan.

### 7. Peran Relawan & Publik (`/api/relawan`)
*Rute diamankan otomatis agar relawan HANYA bisa mengakses data miliknya sendiri melalui `relawan_id` (diambil dari Token JWT).*
- `GET /api/relawan/dashboard` : Poin, total kegiatan, dan rincian SK Aktif yang berlaku saat ini.
- `GET /api/relawan/profile` : Output data biodata dan profil dari database.
- `POST /api/relawan/profile/update` : Mengirim pengajuan perubahan biodata ke admin (Catatan: Ini melakukan Insert ke keranjang pengajuan, bukan UPDATE langsung).
- `GET /api/relawan/history` : Melihat sejarah pengerjaan dan status persetujuan data di masa lalu.

### 8. Fitur Global & Pendukung Lainnya
Terdapat beberapa routing lain yang didaftarkan untuk kebutuhan sistem lintas-role dan fungsionalitas public:
- **Profile Global** (`/api/profile`): Mengelola/mendapatkan data profil dari sesi pengguna yang sedang login.
- **Statistik Global** (`/api/statistik`): Data-data statistik sistem yang bisa diakses oleh berbagai tingkatan role.
- **Saran & Feedback** (`/api/saran`): Endpoint public untuk mengirim saran, dan rute admin untuk mengelolanya.
- **Data Kader Pusat** (`/api/kader`): Rute untuk super_admin dalam memanajemen keseluruhan data kader/komunitas.
- **Data Wilayah** (`/api/wilayah`): Mengambil daftar referensi data Kemantren dan Kelurahan (lookup).
- **Pengaturan Sistem** (`/api/settings`): Untuk konfigurasi dan pengaturan statis aplikasi.
- **Debug Database** (`/api/debug`): Endpoint khusus development untuk memverifikasi koneksi aplikasi ke PostgreSQL.

---
