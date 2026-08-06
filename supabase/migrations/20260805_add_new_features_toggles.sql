-- Menambahkan kolom-kolom baru untuk fitur tambahan HUT RI ke-81 di tabel live_event_state

ALTER TABLE public.live_event_state
ADD COLUMN IF NOT EXISTS countdown_target_time timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS countdown_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS announcement_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS leaderboard_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sfx_enabled boolean DEFAULT true;
