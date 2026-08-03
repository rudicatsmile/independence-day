-- ====================================================================
-- ⚡ SQL FIX: NORMALIZE TWIBBON FRAME URLS TO RELATIVE PATHS
-- Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

-- Update any existing rows that contain hardcoded 'http://localhost:3000'
update public.twibbon_frames
set frame_image_url = replace(frame_image_url, 'http://localhost:3000', '')
where frame_image_url like 'http://localhost:3000%';
