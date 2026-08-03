-- ====================================================================
-- 🧹 SKRIP SQL PEMBERSIHAN DATA UJI COBA & RESET HARI-H (FRESH START)
-- Aplikasi Perayaan Merdeka 81
-- Kunjungi: Supabase Dashboard -> SQL Editor -> Run Script
-- ====================================================================

begin;

  -- 1. Kosongkan Foto Galeri Hasil Uji Coba (Wall of Merdeka & Selfie Guru)
  truncate table public.gallery_items restart identity cascade;

  -- 2. Kosongkan Suara Voting Polling Uji Coba
  truncate table public.poll_votes restart identity cascade;

  -- 3. Reset Perolehan Suara Polling ke 0 pada Tabel polls
  update public.polls
  set total_votes = 0,
      options = jsonb_build_array(
        jsonb_build_object('id', 'opt-1', 'label', 'Tari Colossal Nusantara', 'votes', 0),
        jsonb_build_object('id', 'opt-2', 'label', 'Atraksi Marching Band Garuda', 'votes', 0),
        jsonb_build_object('id', 'opt-3', 'label', 'Drama Kolosal Perjuangan 1945', 'votes', 0),
        jsonb_build_object('id', 'opt-4', 'label', 'Konser Musik Kemerdekaan', 'votes', 0)
      );

  -- 4. Kosongkan Riwayat Misi & Lencana Peserta Uji Coba
  truncate table public.user_missions restart identity cascade;
  truncate table public.user_badges restart identity cascade;

  -- 5. Reset Counter Hormat Panggung Utama ke 1945
  update public.live_event_state
  set salute_count = 1945
  where id = 'main';

  -- 6. Reset Poin Profil Pengguna ke 0 & Hapus Profil Peserta Uji Coba (Pertahankan Akun Admin)
  update public.profiles
  set total_points = 0;

  delete from public.profiles
  where role != 'admin' 
    and role != 'media_team';

commit;
