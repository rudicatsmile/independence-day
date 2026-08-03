-- ====================================================================
-- 🎭 MIGRATION: LOMBA COSPLAY PRESIDEN RI & PAHLAWAN NASIONAL 2026
-- Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta
-- ====================================================================

-- 1. Tabel Peserta Cosplay
create table if not exists public.cosplay_participants (
  id text primary key default 'cp-' || extract(epoch from now())::text || '-' || floor(random()*1000)::text,
  name text not null,
  class_level text not null, -- A, B1, B2, SD, SMP, DP-1, DP-2, etc.
  character_name text not null, -- e.g., Ir. Soekarno, Jenderal Soedirman, Cut Nyak Dhien
  category text not null check (category in ('usia_dini', 'usia_menengah', 'usia_atas')),
  created_at timestamptz default now()
);

-- 2. Tabel Skor Penilaian Juri
create table if not exists public.cosplay_scores (
  id text primary key default 'cs-' || extract(epoch from now())::text || '-' || floor(random()*1000)::text,
  participant_id text not null references public.cosplay_participants(id) on delete cascade,
  judge_name text not null, -- 'Bapak Sofyan Jamaludin,S.H.I.' or 'Bapak H. Mulyana, S.H., M.M.'
  scores jsonb not null, -- { kesesuaian: 90, ekspresi: 85, ... }
  final_score numeric(5,2) not null, -- Nilai akhir terbobot (0-100)
  created_at timestamptz default now(),
  unique(participant_id, judge_name)
);

-- Permissive RLS Policies for Public/Admin
alter table public.cosplay_participants enable row level security;
alter table public.cosplay_scores enable row level security;

drop policy if exists "Allow select cosplay_participants for all" on public.cosplay_participants;
create policy "Allow select cosplay_participants for all" on public.cosplay_participants for select using (true);

drop policy if exists "Allow insert/update cosplay_participants for all" on public.cosplay_participants;
create policy "Allow insert/update cosplay_participants for all" on public.cosplay_participants for all using (true) with check (true);

drop policy if exists "Allow select cosplay_scores for all" on public.cosplay_scores;
create policy "Allow select cosplay_scores for all" on public.cosplay_scores for select using (true);

drop policy if exists "Allow insert/update cosplay_scores for all" on public.cosplay_scores;
create policy "Allow insert/update cosplay_scores for all" on public.cosplay_scores for all using (true) with check (true);

-- Insert Default Peserta Sampel dari Dokumen PDF
insert into public.cosplay_participants (id, name, class_level, character_name, category)
values
  -- Jenjang Usia Dini (TK/PAUD)
  ('cp-dini-1', 'Ahmad Hafiz', 'A', 'Ir. Soekarno', 'usia_dini'),
  ('cp-dini-2', 'Aisyah Putri', 'A', 'R.A. Kartini', 'usia_dini'),
  ('cp-dini-3', 'Bilal Ramadhan', 'B1', 'Jenderal Soedirman', 'usia_dini'),
  ('cp-dini-4', 'Fatimah Az-Zahra', 'B1', 'Cut Nyak Dhien', 'usia_dini'),
  ('cp-dini-5', 'Kenzo Pratama', 'B2', 'Bung Tomo', 'usia_dini'),
  ('cp-dini-6', 'Zahra Amelia', 'B2', 'Dewi Sartika', 'usia_dini'),

  -- Jenjang Usia Menengah (SD / SMP)
  ('cp-mngh-1', 'Bagas Kencana', 'SD', 'Ir. Soekarno', 'usia_menengah'),
  ('cp-mngh-2', 'Siti Nurhaliza', 'SD', 'R.A. Kartini', 'usia_menengah'),
  ('cp-mngh-3', 'Rian Hidayat', 'SD', 'Pangeran Diponegoro', 'usia_menengah'),
  ('cp-mngh-4', 'Fajar Pratama', 'SMP', 'Bung Hatta', 'usia_menengah'),
  ('cp-mngh-5', 'Dian Sastro', 'SMP', 'Cut Nyak Dhien', 'usia_menengah'),
  ('cp-mngh-6', 'Taufik Hidayat', 'SMP', 'Jenderal Soedirman', 'usia_menengah'),

  -- Jenjang Usia Atas (SMA / SMK / DP)
  ('cp-atas-1', 'Rudi Kurniawan, ST', 'DP-1', 'Ir. Soekarno', 'usia_atas'),
  ('cp-atas-2', 'Dewi Sartika', 'DP-1', 'R.A. Kartini', 'usia_atas'),
  ('cp-atas-3', 'Andi Wijaya', 'DP-1', 'Bung Hatta', 'usia_atas'),
  ('cp-atas-4', 'Reza Rahadian', 'DP-2', 'Jenderal Soedirman', 'usia_atas'),
  ('cp-atas-5', 'Maya Putri', 'DP-2', 'Cut Meutia', 'usia_atas'),
  ('cp-atas-6', 'Farhan Ali', 'DP-2', 'Pangeran Diponegoro', 'usia_atas')
on conflict (id) do nothing;
