# Panduan Manajemen Environment & Database (Hari-H vs Testing)

Dokumen ini berisi panduan teknis tentang bagaimana panitia mengelola kredensial *database* Supabase selama masa pengembangan (gladi resik) dan pada malam sebelum acara puncak (Hari-H) 19 Agustus 2026.

## 1. Arsitektur Dua Database
Untuk menjaga keamanan dan kebersihan data acara utama, kita menggunakan dua proyek Supabase yang berbeda:
1. **Database Utama (Hari-H)**: 100% kosong dari data transaksi. Hanya berisi Master Data (Misi, Kuis, Twibbon).
2. **Database Backup / Testing**: Digunakan untuk gladi resik dan mencoba aplikasi. Data peserta di sini boleh kotor/berantakan.

## 2. Kredensial di Komputer Lokal (Local Development)
Di dalam proyek ini, telah disiapkan tiga berkas rahasia:
- `.env.local` -> Berkas aktif yang dibaca oleh Next.js.
- `.env.testing` -> Berisi kredensial (URL & Key) untuk Database Backup.
- `.env.production` -> Berisi kredensial untuk Database Utama.

*(Semua berkas di atas telah dimasukkan ke `.gitignore` sehingga tidak akan bocor ke GitHub).*

### Cara Berpindah Database Secara Lokal
Untuk memudahkan *developer* atau panitia yang menjalankan aplikasi di komputer sendiri (`localhost`), telah dibuat skrip otomatis:

**Menggunakan Database Testing (Saat Gladi Resik):**
```bash
npm run env:testing
```
*Perintah ini akan menyalin isi `.env.testing` ke dalam `.env.local`.*

**Menggunakan Database Hari-H:**
```bash
npm run env:prod
```
*Perintah ini akan menyalin isi `.env.production` ke dalam `.env.local`.*

Setelah menjalankan salah satu perintah di atas, jalankan `npm run dev` seperti biasa.

## 3. Eksekusi Perpindahan di Vercel (Hosting)
Perintah `npm run` di atas **tidak** akan berpengaruh ke server publik Vercel. Vercel menyimpan Environment Variables-nya sendiri secara aman. 

**Langkah yang wajib dilakukan pada malam 18 Agustus 2026 (Malam sebelum Hari-H):**
1. Buka Vercel Dashboard.
2. Masuk ke **Settings** > **Environment Variables**.
3. Edit `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`, ganti nilainya dengan kredensial dari Database Utama (salin dari `.env.production`).
4. Klik **Save**.
5. Buka tab **Deployments**, klik titik tiga (`...`) pada *deployment* terbaru, lalu klik **Redeploy**.
6. Aplikasi publik kini resmi terhubung ke Database Utama.

## 4. Proses Cloning Data
Jika ada perubahan Master Data (tambah soal kuis, ubah twibbon) di Database Utama, cara memindahkannya ke Database Testing adalah:
1. Buka Dashboard Supabase.
2. Lakukan **Export to CSV** pada tabel `missions`, `quiz_questions`, atau `twibbon_frames` dari Database Utama.
3. Lakukan **Import data from CSV** pada tabel yang sama di Database Testing.
*(Tabel transaksional seperti `profiles`, `user_missions`, `gallery_items` dilarang untuk dipindah/import).*
