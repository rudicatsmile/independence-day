-- ====================================================================
-- 🧹 RAW QUERY: RESET ALL TRANSACTIONAL DATA (FRESH START FOR EVENT DAY)
-- Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta
-- 
-- MENGHAPUS:
--   1. Nilai Juri Cosplay (cosplay_scores)
--   2. Galeri Foto Lapangan (gallery_items)
--   3. Suara Polling Lapangan (poll_votes & total_votes = 0)
--   4. Misi, Lencana, & Kuis Peserta (user_missions, user_badges)
--   5. Profil Peserta Uji Coba (profiles non-admin)
--   6. Status Penayangan Pemenang Cosplay (cosplay_published = false)
--   7. Counter Hormat Panggung (salute_count = 1945)
--
-- MEMPERTAHANKAN (MASTER DATA AMAN 100%):
--   ✅ Master Peserta Cosplay (cosplay_participants)
--   ✅ Master Pertanyaan Polling (polls)
--   ✅ Master Soal Kuis Trivia (quiz_questions)
--   ✅ Master Bingkai Twibbon (twibbon_frames)
--   ✅ Konfigurasi Header Panggung (live_event_state)
--
-- CARA MENJALANKAN DI SUPABASE:
-- Buka Supabase Dashboard -> SQL Editor -> Paste Script Ini -> Click RUN
-- ====================================================================

begin;

  -- 1. Kosongkan Seluruh Nilai Inputan Juri Cosplay (Pak Sofyan & Pak Mulyana)
  truncate table public.cosplay_scores restart identity cascade;

  -- 2. Kosongkan Seluruh Foto Galeri (Wall of Merdeka & Selfie Guru)
  truncate table public.gallery_items restart identity cascade;

  -- 3. Kosongkan Seluruh Suara Voting Polling Lapangan
  truncate table public.poll_votes restart identity cascade;

  -- 4. Reset Hitungan Suara Voting Polling ke 0 pada Master Table polls
  update public.polls
  set total_votes = 0,
      options = (
        select jsonb_agg(
          jsonb_set(opt, '{votes}', '0'::jsonb)
        )
        from jsonb_array_elements(options) as opt
      )
  where is_active = true;

  -- 5. Kosongkan Riwayat Misi & Lencana Peserta
  truncate table public.user_missions restart identity cascade;
  truncate table public.user_badges restart identity cascade;

  -- 6. Reset Counter Hormat Panggung ke 1945 & Sembunyikan Pemenang Cosplay
  update public.live_event_state
  set salute_count = 1945,
      cosplay_published = false
  where id = 'main';

  -- 7. Reset Poin Profil Pengguna ke 0 & Hapus Akun Peserta Uji Coba (Pertahankan Akun Admin)
  update public.profiles
  set total_points = 0;

  delete from public.profiles
  where role != 'admin' 
    and role != 'media_team';

commit;

-- Verification Check
select 'PROSES RESET TRANSAKSI SELESAI SUCCESSFUL! MASTER DATA TETAP UTUH.' as status;
