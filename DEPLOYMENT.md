# 🚀 Panduan Deployment Produksi & Setup Supabase - Aplikasi Merdeka 81

Dokumen ini berisi panduan teknis langkah-demi-langkah bagi pengembang (*developers*) dan tim pengelola teknis untuk melakukan **Deployment Produksi Aplikasi Merdeka 81** ke platform **Vercel** serta mengonfigurasi **Database Supabase Cloud** secara lengkap.

---

## 📑 Daftar Isi
1. [Arsitektur & Perangkat Lunak](#1-arsitektur--perangkat-lunak)
2. [Persiapan Repository GitHub](#2-persiapan-repository-github)
3. [Setup Database Supabase Cloud (Skema, RLS, & Realtime)](#3-setup-database-supabase-cloud)
4. [Deployment ke Platform Vercel](#4-deployment-ke-platform-vercel)
5. [Konfigurasi Autentikasi & URL Redirect](#5-konfigurasi-autentikasi--url-redirect)
6. [Penanganan Masalah Umum (Troubleshooting)](#6-penanganan-masalah-umum-troubleshooting)

---

## 1. Arsitektur & Perangkat Lunak

- **Framework Web:** Next.js 15 (App Router, Server & Client Components)
- **Bahasa:** TypeScript (Strict Type Checking)
- **Backend & Database:** Supabase Cloud (PostgreSQL 15+, Auth, Storage, Realtime WebSocket)
- **State Management:** Zustand (Local state & optimistic UI updates)
- **Styling:** Vanilla Tailwind CSS + Glassmorphism Theme
- **Hosting / Deployer:** Vercel (Continuous Deployment via GitHub)

---

## 2. Persiapan Repository GitHub

Pastikan seluruh kode sumber terbaru telah di-push ke repository GitHub resmi perayaan:

```bash
# 1. Pengecekan Status Git
git status

# 2. Tambah Remote Origin (jika baru pertama kali)
git remote add origin https://github.com/rudicatsmile/independence-day.git

# 3. Push ke branch main
git push -u origin main
```

> **Repository URL:** [`https://github.com/rudicatsmile/independence-day`](https://github.com/rudicatsmile/independence-day)

---

## 3. Setup Database Supabase Cloud

Buka menu **SQL Editor** pada Dashboard Supabase Cloud Anda (`https://supabase.com/dashboard/project/<project-id>/sql`), lalu jalankan berkas-berkas SQL sesuai urutan berikut:

### A. Skema Awal & Tabel Dasar
Jalankan berkas migrasi utama [20260731_initial_schema.sql](file:///d:/project/web/merdeka-81/supabase/migrations/20260731_initial_schema.sql):
- Membuat tabel `profiles`, `missions`, `user_missions`, `badges`, `user_badges`, dan `gallery_items`.

### B. Tabel Twibbon, Kuis, & Live Salute
Jalankan berkas migrasi inkremental:
1. `supabase/migrations/20260801_add_twibbon_frames.sql` (Tabel `twibbon_frames`)
2. `supabase/migrations/20260801_add_quiz_questions.sql` (Tabel `quiz_questions`)
3. `supabase/migrations/20260801_add_live_salute_and_polls.sql` (Tabel `live_event_state`, `polls`, `poll_votes`)

### C. Trigger Otomatis Pembuatan Profil User (`on_auth_user_created`)
Pastikan trigger PostgreSQL terpasang agar setiap ada user baru mendaftar di `auth.users`, baris profil di `public.profiles` dibuat secara otomatis:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, instansi, role, total_points, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Peserta Merdeka 81'),
    coalesce(new.raw_user_meta_data->>'instansi', 'Kontingen HUT RI 81'),
    coalesce(new.raw_user_meta_data->>'role', 'participant'),
    100,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### D. Aktivasi Realtime WebSocket Broadcast
Aktifkan publikasi Realtime untuk tabel-tabel reaktif panggung:

```sql
begin;
  alter publication supabase_realtime add table public.gallery_items;
  alter publication supabase_realtime add table public.live_event_state;
  alter publication supabase_realtime add table public.polls;
  alter publication supabase_realtime add table public.profiles;
commit;
```

---

## 4. Deployment ke Platform Vercel

### Langkah-Langkah:

1. **Buka Vercel Dashboard:**
   - Kunjungi [vercel.com](https://vercel.com) dan login menggunakan akun GitHub (`rudicatsmile`).
2. **Import Repository:**
   - Klik **"Add New..."** ➔ **"Project"**.
   - Pilih repository **`rudicatsmile/independence-day`**, lalu klik **"Import"**.
3. **Konfigurasi Environment Variables:**
   - Tambahkan 3 variabel kredensial berikut dari berkas `.env.local`:

   | Key Variable | Deskripsi / Contoh Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://cibblaojnuggfrjfkqyl.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Anon public key dari Supabase API Settings)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(Service role key dari Supabase API Settings)* |

4. **Eksekusi Deploy:**
   - Klik tombol **"Deploy"**. Vercel akan me-build proyek dan memberikan domain publik HTTPS (misal: `https://independence-day-rudicatsmile.vercel.app`).

---

## 5. Konfigurasi Autentikasi & URL Redirect

Setelah Vercel memberikan URL domain publik Anda:

1. Buka Dashboard Supabase Cloud ➔ **Authentication** ➔ **URL Configuration**.
2. Masukkan URL domain Vercel Anda pada kolom **Site URL** (contoh: `https://independence-day-rudicatsmile.vercel.app`).
3. Tambahkan URL Vercel tersebut ke daftar **Redirect URLs**, lalu klik **Save**.

---

## 6. Penanganan Masalah Umum (Troubleshooting)

### A. Error Build Vercel: `Vulnerable version of Next.js detected` (CVE-2025-66478)
- **Penyebab:** Vercel melarang deployment proyek yang menggunakan versi `next@15.1.7` karena kerentanan keamanan.
- **Solusi:** Di [package.json](file:///d:/project/web/merdeka-81/package.json), versi Next.js telah di-upgrade ke `^15.2.0` (versi patch resmi yang aman).

### B. Error RLS: `violates foreign key constraint "gallery_items_user_id_fkey"`
- **Penyebab:** Kolom `gallery_items.user_id` memerlukan baris yang sudah terdaftar di `public.profiles`.
- **Solusi:** Fungsi `insertGalleryItemToSupabase()` di [services.ts](file:///d:/project/web/merdeka-81/src/lib/supabase/services.ts) telah dilengkapi dengan *Guaranteed Profile Resolution* untuk memastikan ID profil valid selalu digunakan.

### C. Layar Panggung (`/stage-display`) Belum Ter-update Otomatis
- **Solusi:** Pastikan perintah `alter publication supabase_realtime add table ...` di [Langkah 3D](#d-aktivasi-realtime-websocket-broadcast) sudah dieksekusi di Supabase SQL Editor.

---

*Dokumentasi ini dikelola secara resmi oleh Tim Pengembang Merdeka 81.* 🇮🇩
