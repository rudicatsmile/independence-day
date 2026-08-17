-- Menambahkan status toggle manual untuk penutupan acara

ALTER TABLE public.live_event_state
ADD COLUMN IF NOT EXISTS is_event_finished boolean DEFAULT false;
