-- ====================================================================
-- ⚡ RAW QUERY RESET: TOTAL KETUKAN HORMAT & SLIDESHOW WALL OF MERDEKA
-- Kunjungi: Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

begin;

  -- 1. Reset Total Ketukan Hormat ke 0 (atau 1945) pada Layar Panggung
  update public.live_event_state
  set salute_count = 0
  where id = 'main';

  -- 2. Reset / Hapus Seluruh Foto Galeri Slideshow Wall of Merdeka
  truncate table public.gallery_items restart identity cascade;

commit;
