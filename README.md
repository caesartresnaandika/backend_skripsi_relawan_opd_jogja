Cara Menggunakan File Ini
Buka VS Code di folder backend-skripsi.

Buat file baru bernama README.md.

Copy dan Paste teks di bawah ini:

Markdown
# Backend Sistem Relawan OPD - JOGJA

Repositori ini berisi source code backend untuk aplikasi manajemen relawan OPD menggunakan Node.js, TypeScript, dan PostgreSQL.

## 🚀 Persiapan Awal (Instalasi)

Bagi rekan pengembang yang baru melakukan `git clone`, ikuti langkah berikut untuk menjalankan project di laptop masing-masing:

### 1. Instalasi Dependencies
Buka terminal di folder project dan jalankan perintah:
```bash
npm install
Perintah ini akan mendownload folder node_modules berdasarkan file package.json.

2. Konfigurasi Environment (.env)
Buat file baru bernama .env di root folder (sejajar dengan package.json). Karena file .env asli tidak di-upload demi keamanan, silakan isi dengan format berikut:

Code snippet
DB_USER=postgres
DB_PASSWORD=isi_password_db_kamu
DB_HOST=localhost
DB_NAME=db_relawan_opd
DB_PORT=5432
PORT=3000
🗄️ Konfigurasi Database (PostgreSQL)
File backup database terbaru telah tersedia di dalam repositori ini dengan nama db_relawan_opd_export.sql.

Cara Restore Database via pgAdmin 4:
Buka pgAdmin 4.

Buat database baru bernama db_relawan_opd.

Klik kanan pada nama database tersebut, lalu pilih Restore...

Pada tab General, pilih file db_relawan_opd_export.sql yang ada di folder project ini.

Klik Restore.

🛠️ Menjalankan Aplikasi
Mode Development
Untuk menjalankan aplikasi dalam mode development dengan auto-reload (nodemon):

Bash
npm run dev
Mode Produksi (Build)
Jika ingin melakukan build ke JavaScript (dist):

Bash
npm run build
npm start
📂 Struktur Folder
src/ : Source code utama (Controllers, Routes, Middlewares).

config/ : Konfigurasi database dan sistem.

db_relawan_opd_export.sql : File dump database PostgreSQL.
