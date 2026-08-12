-- Fix RLS Policies for user_missions and missions
-- Jalankan skrip ini di SQL Editor Supabase Anda

-- 1. Beri akses baca penuh ke tabel missions
DROP POLICY IF EXISTS "Allow select missions for all" ON public.missions;
CREATE POLICY "Allow select missions for all" ON public.missions FOR SELECT USING (true);

-- 2. Beri akses penuh (baca/tulis) ke tabel user_missions agar aplikasi bisa menyimpan riwayat misi
DROP POLICY IF EXISTS "Allow select user_missions for all" ON public.user_missions;
CREATE POLICY "Allow select user_missions for all" ON public.user_missions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert/update user_missions for all" ON public.user_missions;
CREATE POLICY "Allow insert/update user_missions for all" ON public.user_missions FOR ALL USING (true) WITH CHECK (true);
