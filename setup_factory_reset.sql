-- 1. Create a secure RPC function to perform factory reset
-- This function can only be called by an authenticated user, but we will protect it in the app UI as well.

CREATE OR REPLACE FUNCTION public.factory_reset_data()
RETURNS void AS $$
BEGIN
    -- 1. Kosongkan riwayat aktivitas (Hati-hati, ini menghapus data!)
    TRUNCATE TABLE public.user_missions CASCADE;
    TRUNCATE TABLE public.user_badges CASCADE;
    TRUNCATE TABLE public.gallery_items CASCADE;
    TRUNCATE TABLE public.poll_votes CASCADE;
    TRUNCATE TABLE public.cosplay_scores CASCADE;

    -- Note: cosplay_participants is intentionally NOT truncated as requested.

    -- 2. Reset Poin Peserta ke nilai awal (0) dan hapus flag onboarding
    UPDATE public.profiles 
    SET total_points = 0, onboarding_completed = false
    WHERE id IS NOT NULL;

    -- 3. Reset Angka Hormat (Salute) ke 1945
    UPDATE public.live_event_state 
    SET salute_count = 1945 
    WHERE id = 'main';

    -- 4. Reset Polling 
    UPDATE public.polls
    SET total_votes = 0,
        options = (
          SELECT jsonb_agg(
            jsonb_set(elem, '{votes}', '0')
          )
          FROM jsonb_array_elements(options) elem
        )
    WHERE id = 'poll-main';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
