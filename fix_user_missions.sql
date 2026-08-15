-- 1. Hapus Foreign Key constraint yang lama agar kita bisa mengubah tipe data
ALTER TABLE public.user_missions DROP CONSTRAINT IF EXISTS user_missions_mission_id_fkey;

-- 2. Ubah tipe data kolom mission_id menjadi 'text' agar bisa menerima format ID dari frontend (misal: 'm-01', 'm-04')
ALTER TABLE public.user_missions ALTER COLUMN mission_id TYPE text;

-- 3. Sama halnya untuk Lencana (Badges), frontend menggunakan format string (misal: 'b-02')
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_badge_id_fkey;
ALTER TABLE public.user_badges ALTER COLUMN badge_id TYPE text;

-- 4. Ubah tipe data primary key di tabel referensinya juga
ALTER TABLE public.missions ALTER COLUMN id TYPE text;
ALTER TABLE public.badges ALTER COLUMN id TYPE text;

-- Selesai. Eksekusi script ini di Supabase > SQL Editor > Run
