-- Setup Tap Battle: Tabel skor perlombaan ketuk hormat
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel tap_battle_scores
CREATE TABLE IF NOT EXISTS public.tap_battle_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  user_name text NOT NULL,
  instansi text,
  tap_count integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.tap_battle_scores ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Siapapun bisa melihat leaderboard (SELECT)
CREATE POLICY "tap_battle_scores_select_all"
  ON public.tap_battle_scores
  FOR SELECT
  USING (true);

-- 4. Policy: User yang sudah login bisa INSERT skor mereka sendiri
CREATE POLICY "tap_battle_scores_insert_own"
  ON public.tap_battle_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Enable Realtime untuk tabel ini (agar monitor live update)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tap_battle_scores;

-- 6. Tambahkan kolom tap_battle_enabled ke live_event_state (Jalankan ini juga!)
ALTER TABLE public.live_event_state ADD COLUMN IF NOT EXISTS tap_battle_enabled boolean DEFAULT false;

