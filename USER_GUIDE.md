# 🇮🇩 Panduan Penggunaan Aplikasi Mobile PWA "Merdeka 81" (HUT RI ke-81)

Selamat datang di Panduan Penggunaan Resmi aplikasi **Merdeka 81** — Platform partisipasi digital interaktif untuk merayakan **81 Tahun Kemerdekaan Republik Indonesia (17 Agustus 2026)**.

Dokumen ini disusun lengkap untuk 3 kelompok pengguna:
1. **Peserta / Pengunjung Lapangan** (Panduan Fitur & Gamifikasi)
2. **Panitia & Operator Panggung** (Panduan Stage Display & Moderasi)
3. **Tim Teknis & Developer** (Panduan Setup Supabase Cloud & Dev Server)

---

## ⚡ Quick Start & Akun Demo Testing

Aplikasi dapat diakses melalui browser mobile atau desktop pada URL `http://localhost:3000`.

### Matriks Hak Akses Halaman (Hybrid Access Control):

| Rute / Halaman | Bebas Tanpa Login (Pengunjung Tamu) | Wajib Login (Pengguna Terautentikasi / Admin) |
|---|---|---|
| **Beranda (`/home`)** | ✅ Jelajah daftar misi & statistik perayaan | 🔑 Klaim poin misi & status penyelesaian |
| **Twibbon Photobooth (`/twibbon`)** | ✅ Unggah foto, pilih bingkai, unduh 1:1, & share WA/IG | 🔑 Tayangkan foto ke Galeri & klaim +100 PTS |
| **Peta QR Hunt (`/map`)** | ✅ Lihat denah lokasi & petunjuk tempat | 🔑 Verifikasi GPS & klaim +75 PTS |
| **Wall of Merdeka (`/gallery`)** | ✅ Lihat feed foto & beri Like | 🔑 Unggah foto baru & laporkan konten |
| **Live Salute (`/live`)** | ✅ Tekan tombol "Hormat!" massal | 🔑 Voting polling resmi acara |
| **Paspor Digital (`/passport`)** | 🔒 Terkunci (Prompt Login) | 🔑 Lihat lencana achievement & Cetak Sertifikat PDF |
| **Stage & Admin (`/admin/...`)** | 🔒 Terkunci (Role Admin Only) | 🔑 Akses kontrol layar panggung & manajemen bingkai |

---

### 1.1 Autentikasi Pengguna (Login & Logout)
- **Cara Login (Masuk):**
  1. Klik tombol **"Masuk"** berwarna merah-emas pada bagian kanan atas bar navigasi.
  2. Modal Popup Login akan terbuka.
  3. Untuk pengujian instan (*Quick Testing*), klik salah satu tombol 1-Klik Demo:
     - 🛡️ **"Login Admin"** (`admin@merdeka81.id`)
     - 👤 **"Login Peserta"** (`peserta@merdeka81.id`)
  4. Atau masukkan Email & Password akun Anda, lalu klik **"Masuk Sekarang"**.
- **Cara Logout (Keluar):**
  - Klik tombol **"Logout"** di bagian kanan atas bar navigasi. Sesi Supabase Auth Anda akan secara otomatis diakhiri dan status akun dikembalikan ke default.
- **Daftar Akun Baru:**
  - Pada Modal Popup Login, klik teks **"Daftar di sini"** untuk berpindah ke form pendaftaran akun baru dengan mengisi Nama Lengkap, Instansi, Email, dan Password.

---

### 1.2 Beranda & Dashboard Utama (`/home`)
- **Navigasi Utama:** Bar navigasi bawah (mobile) & header atas (desktop) memudahkan peserta berpindah rute: *Beranda*, *Twibbon*, *Peta QR*, *Galeri*, dan *Paspor*.
- **Poin & Peringkat:** Jumlah poin peserta (`PTS`) dan peringkat (*Rank*) ditampilkan secara real-time di bagian header atas.
- **Status Misi:** Daftar misi kemerdekaan yang aktif beserta reward poin dan status penyelesaiannya (*Selesai* / *Mulai*).

---

### 1.2 Twibbon & Photobooth Instan (`/twibbon`)
Fitur untuk membuat bingkai foto kemerdekaan dan membagikannya ke media sosial:
1. **Pilih Bingkai:** Pilih varian bingkai di bagian atas: *Garuda Emas 81*, *Merah Putih Patriot*, atau *Kemerdekaan Modern*.
2. **Unggah Foto:** Klik tombol **"Pilih Foto Sekarang"** dan pilih foto selfie atau pakaian adat dari galeri/kamera HP.
3. **Atur Caption:** Tulis ucapan atau pesan personal pada kolom caption yang disediakan.
4. **Unduh & Bagikan:** 
   - Klik **"Unduh Foto"** untuk menyimpan hasil gambar ber-rasio 1:1 resolusi tinggi ke HP.
   - Klik **"Bagikan (WA/IG)"** untuk membagikan foto 1-klik langsung ke WhatsApp Status atau Instagram Story via *Web Share API*.
5. **Tayangkan di Wall of Merdeka:** Klik tombol **"Tayangkan Foto Ini di Galeri Publik Wall of Merdeka"** agar foto Anda tayang di feed aplikasi dan layar besar panggung utama!

---

### 1.3 Peta QR Hunt & Geofencing GPS (`/map`)
Fitur jelajah titik lokasi QR Code di area acara perayaan:
1. **Buka Denah Acara:** Pada halaman `/map`, peserta dapat melihat peta denah interaktif lokasi acara (*Panggung Utama*, *Bazar Kuliner*, *Tugu Proklamasi*).
2. **Petunjuk Lokasi:** Klik salah satu pin lokasi untuk membaca petunjuk tempat spesifik QR Code berada.
3. **Verifikasi GPS & Scan:**
   - Saat berada dekat lokasi QR Code (radius < 50 meter), klik tombol **"Verifikasi GPS & Scan QR Code"**.
   - Sistem akan memverifikasi lokasi posisi GPS HP peserta. Jika lokasi sesuai, poin akan otomatis diklaim dan lencana *Penjelajah Nusantara* akan terbuka!

---

### 1.4 Wall of Merdeka — Feed Galeri Publik (`/gallery`)
Tempat berkumpulnya momen foto perayaan dari seluruh peserta:
- **Melihat Momen:** Peserta dapat menggulir feed foto yang diunggah oleh peserta lain secara real-time.
- **Memberikan Like:** Klik tombol **"Like"** dengan ikon hati merah untuk memberi apresiasi foto terbaik.
- **Laporkan Konten:** Jika menemukan foto yang tidak pantas, klik tombol **"Laporkan Konten"** agar tim media panitia dapat meninjau dan melakukan takedown.

---

### 1.5 Live Salute & Polling Real-Time (`/live`)
Fitur interaksi panggung utama secara langsung:
1. **Tombol "Hormat!" Massal:** 
   - Tap tombol bendera Merah-Putih lingkaran besar secara terus-menerus.
   - Setiap ketukan akan meng-increment *Live Salute Counter* nasional dan memicu animasi gelombang bendera serta efek haptic getar di HP.
2. **Polling Live Panggung:**
   - Pilih salah satu jawaban pada polling aktif di lokasi acara.
   - Setelah memilih, persentase hasil suara seluruh peserta akan muncul secara langsung.

---

### 1.6 Paspor Digital & Cetak Sertifikat PDF (`/passport`)
Halaman bukti partisipasi & pengakuan prestasi peserta:
1. **Kartu Identitas Peserta:** Menampilkan nama, instansi, foto profil, total poin, dan peringkat nasional.
2. **Lencana Achievement Patriotik:**
   - ⚡ **Pahlawan Tercepat**: Terbuka jika check-in di 10 peserta pertama.
   - 👑 **Raja Trivia Sejarah**: Terbuka jika menjawab 100% benar Kuis Sejarah.
   - 🧭 **Penjelajah Nusantara**: Terbuka setelah memindai seluruh titik QR Hunt.
   - 📸 **Fotografer Patriot**: Terbuka setelah mengunggah foto ke Wall of Merdeka.
3. **Cetak Sertifikat Digital PDF:**
   - Klik tombol **"Cetak Sertifikat PDF"**.
   - Jendela cetak resmi akan terbuka menampilkan dokumen *Sertifikat Digital Kehormatan* lengkap dengan nama peserta, instansi, poin, dan gelar kehormatan yang dicetak otomatis. Peserta dapat langsung menyimpan sebagai file PDF atau mencetaknya!

---

## 🛡️ BAGIAN 2: Panduan Operator & Administrator Panitia

### 2.1 Pembeda Visual & Menu Navigasi Admin
Saat Anda login menggunakan akun Admin (`admin@merdeka81.id`), aplikasi akan secara otomatis memberikan **pembeda visual khusus (*Visual Distinction*)**:
1. **Badge Khusus Admin:** Tampil badge **`🛡️ ADMIN PANITIA`** berwarna Merah-Emas di samping nama profil Anda pada header navigasi atas.
2. **Menu Akses Cepat `Panel Admin` (Header Navbar):**
   - Menampilkan menu dropdown **"Panel Admin"** berisi 3 rute manajemen utama:
     - 🖼️ **Kelola Twibbon** (`/admin/twibbon`)
     - 📺 **Layar Panggung** (`/stage-display`)
     - 📸 **Moderasi Galeri** (`/gallery`)
3. **Widget Panel Kontrol Utama Admin (Halaman Beranda):** Pada rute `/home`, akan tampil widget khusus emas **"Panel Kontrol Utama Administrator"** dengan tombol akses 1-klik ke fitur pengelolaan Twibbon, Layar Panggung, & Moderasi Galeri.

### 2.2 Kontrol Layar Panggung & Visualizer (`/stage-display`)
Dirancang khusus untuk di-project / dihubungkan ke TV atau Layar Besar Panggung Utama:
- **Visualizer Live Salute:** Menampilkan animasi bendera Merah-Putih raksasa dan angka counter Hormat! massal dari seluruh peserta di lapangan.
- **Wall of Merdeka Auto-Slideshow:** Gambar foto peserta yang baru di-unggah akan berganti otomatis setiap 4.5 detik dalam bentuk carousel berkualitas tinggi.
- **Papan Skor Top 5:** Menampilkan 5 peserta dengan poin tertinggi di perayaan secara real-time.
- **Sirine & Terompet Panggung (Audio SFX):**
  - Operator panggung dapat mengklik tombol **"Picu Hormat Panggung & Bunyikan Sirine (SFX)"** untuk membunyikan terompet/sirine perayaan secara sintetis melalui audio panggung.
  - Tombol **Mute/Unmute SFX** tersedia di pojok kanan atas layar panggung.

---

### 2.2 Moderasi Galeri Foto (Post-Moderation)
- Model galeri aplikasi menggunakan **Auto-Publish + Post-Moderation** (foto yang diunggah peserta langsung tayang di galeri & layar panggung tanpa antrean approval).
- Tim Media Panitia memantau feed galeri di `/gallery`. Jika ada konten yang dilaporkan peserta (*report count > 0*) atau tidak pantas, admin dapat melakukan takedown seketika.

### 2.3 Moderasi Wall of Merdeka & Takedown Konten (`/gallery`)
- **Akses Rute Moderasi:** Login sebagai Admin (`admin@merdeka81.id`), lalu buka rute `http://localhost:3000/gallery`.
- **Mode Moderasi Admin:** Bar khusus emas **"Mode Moderasi Admin Aktif"** akan muncul di bagian atas galeri.
- **Filter Foto Dilaporkan:** Klik tombol **"Dilaporkan"** untuk menyaring foto-foto yang telah ditandai/dilaporkan oleh peserta di lapangan.
- **Cara Melakukan Takedown (Hapus Foto):**
  1. Pada kartu foto yang ingin dihapus, klik tombol **"🗑️ Takedown Konten Ini (Hapus Admin)"**.
  2. Konfirmasi pop-up dialog.
  3. Foto tersebut akan seketika di-update statusnya menjadi `removed` di database Supabase Cloud, serta **otomatis terhapus dari feed publik dan carousel panggung utama (`/stage-display`)**!

---

### 2.4 Manajemen Background & Bingkai Twibbon (`/admin/twibbon`)
- **Akses Rute Admin:** Login sebagai akun admin (`admin@merdeka81.id`), lalu buka rute `http://localhost:3000/admin/twibbon`.
- **Menambah Bingkai Baru:**
  1. Klik tombol **"Tambah Bingkai Twibbon Baru"** di pojok kanan atas.
  2. Masukkan **Nama Bingkai**, **Judul Utama**, **Subtitle/Tagline**, dan tentukan **Warna Aksen** (Hex Color Picker).
  3. *(Opsional)* Masukkan **URL Gambar PNG Overlay Custom** jika Anda ingin menggunakan bingkai desain grafik PNG transparan buatan tim desain.
  4. Centang **"Aktifkan Bingkai Ini untuk Peserta"** dan klik **"Simpan Bingkai"**.
- **Hasil Instan:** Bingkai yang ditambah atau di-edit akan secara otomatis muncul di pemilih bingkai photobooth peserta pada rute `http://localhost:3000/twibbon`!

### 2.5 Manajemen Peta QR Hunt & Geofencing GPS (`/admin/map`)
- **Akses Rute Admin:** Login sebagai Admin (`admin@merdeka81.id`), lalu buka rute `http://localhost:3000/admin/map` (atau pilih menu **"Panel Admin -> Kelola Peta QR"** pada header navigasi).
- **Menambah Titik QR Lokasi Baru:**
  1. Klik tombol **"Tambah Titik Lokasi QR Hunt Baru"** di pojok kanan atas.
  2. Masukkan **Nama Titik Lokasi**, **Nama Zona**, **Poin Reward**, **Petunjuk Tempat (Hint)**, serta **Radius Toleransi Geofencing GPS (Meter)**.
  3. Centang **"Aktifkan Titik Lokasi QR Ini"** dan klik **"Simpan Titik Lokasi"**.
- **Cetak Banner QR Code Fisik:**
  - Pada setiap kartu lokasi, klik tombol **"🖨️ Cetak Banner QR"** untuk membuka pop-up kartu banner cetak beresolusi tinggi yang siap di-print dan dipasang pada spanduk/standee lokasi fisik acara!

### 1.5 Kuis Trivia Kemerdekaan RI (`/quiz`)
- **Akses Rute Kuis:** Buka `http://localhost:3000/quiz` atau klik tombol **"Mulai"** pada Misi **Kuis Trivia Kemerdekaan RI** di halaman Beranda.
- **Cara Bermain Kuis:**
  1. Jawab 5 pertanyaan sejarah seputar Kemerdekaan Indonesia ke-81.
  2. Setiap pertanyaan memiliki 4 pilihan jawaban (A, B, C, D) serta pembahasan latar belakang sejarah edukatif secara instan.
- **Syarat Membuka Lencana "Raja Trivia Sejarah":**
  - Apabila Anda menjawab **100% benar (5 dari 5 soal)**, sistem akan secara otomatis mengeklaim poin misi **`+100 PTS`** serta membuka **Lencana Kehormatan "Raja Trivia Sejarah"** di Paspor Digital Anda!
  - Jika skor belum 100%, Anda dapat mengeklik tombol **"Coba Kuis Lagi"** hingga berhasil menjawab sempurna.

---

### 2.6 Manajemen Soal Kuis Trivia (`/admin/quiz`)
- **Akses Rute Admin:** Login sebagai Admin (`admin@merdeka81.id`), lalu buka rute `http://localhost:3000/admin/quiz` (atau pilih menu **"Panel Admin -> Kelola Kuis Trivia"** pada header navigasi).
- **Menambah Soal Kuis Baru:**
  1. Klik tombol **"Tambah Soal Kuis Baru"** di pojok kanan atas.
  2. Masukkan **Teks Pertanyaan Sejarah**, isi 4 **Pilihan Jawaban (A/B/C/D)**, tentukan **Kunci Jawaban Yang Benar**, serta berikan **Penjelasan/Pembahasan Edukatif Sejarah**.
  3. Centang **"Aktifkan Soal Kuis Ini"** dan klik **"Simpan Soal Kuis"**.

---

## 🛠️ BAGIAN 3: Panduan Tim Teknis & Developer

### 3.1 Prasyarat System
- Node.js version >= 20.x
- NPM version >= 10.x
- Akun Supabase Cloud aktif (supabase.com)

### 3.2 Langkah Setup & Menjalankan Aplikasi

```bash
# 1. Clone & Masuk ke Direktori Proyek
cd d:/project/web/merdeka-81

# 2. Instal Seluruh Dependensi
npm install

# 3. Konfigurasi Environment Variable (.env.local)
# Buat file .env.local dan isi kredensial dari Dashboard Supabase -> Project Settings -> API:
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# 4. Jalankan Migrasi Database SQL di Supabase Cloud
# Jika baru pertama kali setup database, jalankan seluruh isi supabase/migrations/20260731_initial_schema.sql
# Jika database sebelumnya sudah ada, jalankan berkas migrasi inkremental:
# - supabase/migrations/20260801_add_twibbon_frames.sql
# - supabase/migrations/20260801_add_quiz_questions.sql
# - supabase/migrations/20260801_add_live_salute_and_polls.sql melalui SQL Editor di Dashboard Supabase.

# 5. Jalankan Seeding Data Otomatis
npm run seed

# 6. Jalankan Server Dev Lokal
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000` dengan indikator badge **`DB LIVE`** di navigasi atas.

---

### 🧪 Verifikasi Build Produksi

Untuk memastikan kode TypeScript dan bundle Next.js 15 aman untuk di-deploy ke Vercel:

```bash
# Pengecekan Tipe TypeScript
npx tsc --noEmit

# Build Bundle Produksi
npm run build
```

---

*Dirgahayu Republik Indonesia ke-81 — Nusantara Baru, Indonesia Maju! 🇮🇩*
