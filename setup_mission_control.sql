-- Setup Mission Control: Tambah kolom missions_enabled ke tabel live_event_state
-- Jalankan di Supabase SQL Editor

ALTER TABLE public.live_event_state
ADD COLUMN IF NOT EXISTS missions_enabled boolean DEFAULT false;

-- Pastikan baris 'main' sudah ada dengan nilai default missions_enabled = false
INSERT INTO public.live_event_state (id, salute_count, missions_enabled)
VALUES ('main', 1945, false)
ON CONFLICT (id) DO NOTHING;
