drop table if exists public.poll_votes cascade;
drop table if exists public.polls cascade;
drop table if exists public.live_event_state cascade;
drop table if exists public.gallery_items cascade;
drop table if exists public.twibbon_frames cascade;
drop table if exists public.user_badges cascade;
drop table if exists public.badges cascade;
drop table if exists public.user_missions cascade;
drop table if exists public.missions cascade;
drop table if exists public.profiles cascade;
drop table if exists public.cosplay_scores cascade;
drop table if exists public.cosplay_participants cascade;
drop table if exists public.quiz_questions cascade;

-- Schema Migration: Initial Database Setup for Merdeka 81
-- Enables RLS, auto-publish gallery with post-moderation, RLS policies, and triggers

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  instansi text,
  phone text unique,
  avatar_url text,
  role text default 'participant' check (role in ('participant', 'admin', 'media_team', 'panitia_cosplay', 'juri_cosplay')),
  judge_id text,
  group_name text,
  total_points integer default 0,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Missions table
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  type text not null check (type in ('checkin', 'qr_hunt', 'quiz', 'video', 'referral')),
  points_reward integer default 50,
  icon_name text default 'Flag',
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- User Missions progress
create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  points_earned integer default 0,
  completed_at timestamptz,
  unique(user_id, mission_id)
);

-- Badges System
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  icon text not null,
  rarity text default 'common' check (rarity in ('common', 'rare', 'legendary'))
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- Twibbon Frames (Admin Managed Background Frames)
create table if not exists public.twibbon_frames (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  subtitle text,
  accent_color text default '#F59E0B',
  frame_image_url text,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Gallery Items (Auto-Publish + Post Moderation model)
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text default 'photo' check (type in ('photo', 'video')),
  image_url text not null,
  caption text,
  like_count integer default 0,
  status text default 'approved' check (status in ('approved', 'flagged', 'removed')),
  report_count integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS on all public tables
alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.user_missions enable row level security;
alter table public.gallery_items enable row level security;

-- RLS Policies for gallery_items (Auto-publish + Post Moderation)
drop policy if exists "Public can view approved gallery items" on public.gallery_items;
create policy "Public can view approved gallery items"
on public.gallery_items for select
using (status = 'approved');

drop policy if exists "Users can insert own gallery items as approved" on public.gallery_items;
create policy "Users can insert own gallery items as approved"
on public.gallery_items for insert
with check (auth.uid() = user_id);

drop policy if exists "Moderator can update status for takedown" on public.gallery_items;
create policy "Moderator can update status for takedown"
on public.gallery_items for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'media_team')
  )
);
-- Incremental Migration: Add live_event_state and polls tables for Live Salute & Polling
-- Safe execution with IF NOT EXISTS clauses

-- 1. Live Event State (Salute Counter)
create table if not exists public.live_event_state (
  id text primary key default 'main',
  salute_count integer default 1945,
  event_title text default 'Perayaan HUT RI ke-81',
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.live_event_state enable row level security;

drop policy if exists "Public read live_event_state" on public.live_event_state;
create policy "Public read live_event_state" on public.live_event_state for select using (true);

drop policy if exists "Public update live_event_state" on public.live_event_state;
drop policy if exists "Public all live_event_state" on public.live_event_state;
create policy "Public all live_event_state" on public.live_event_state for all using (true) with check (true);

-- Atomic RPC Function for concurrent Salute clicks
create or replace function public.increment_salute_count()
returns integer as $$
declare
  new_val integer;
begin
  insert into public.live_event_state (id, salute_count)
  values ('main', 1946)
  on conflict (id) do update
  set salute_count = public.live_event_state.salute_count + 1,
      updated_at = now()
  returning salute_count into new_val;
  return new_val;
end;
$$ language plpgsql security definer;

-- 2. Live Polls
create table if not exists public.polls (
  id text primary key default 'poll-main',
  question text not null,
  options jsonb not null default '[]'::jsonb,
  is_active boolean default true,
  total_votes integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.polls enable row level security;

drop policy if exists "Public read polls" on public.polls;
create policy "Public read polls" on public.polls for select using (true);

drop policy if exists "Public update polls" on public.polls;
create policy "Public update polls" on public.polls for update using (true);

-- 3. Poll Votes Track
create table if not exists public.poll_votes (
  user_id uuid references public.profiles(id) on delete cascade,
  poll_id text references public.polls(id) on delete cascade,
  option_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, poll_id)
);

alter table public.poll_votes enable row level security;

drop policy if exists "Public read poll_votes" on public.poll_votes;
create policy "Public read poll_votes" on public.poll_votes for select using (true);

drop policy if exists "Public insert poll_votes" on public.poll_votes;
create policy "Public insert poll_votes" on public.poll_votes for insert with check (true);

-- Ensure gallery_items allows public/authenticated insert for Twibbon publications
drop policy if exists "Authenticated insert gallery" on public.gallery_items;
drop policy if exists "Public insert gallery" on public.gallery_items;
create policy "Public insert gallery" on public.gallery_items for insert with check (true);

-- 4. PostgreSQL Trigger to automatically create a profile in public.profiles for every new user in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, instansi, role, total_points, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Peserta Merdeka 81'),
    coalesce(new.raw_user_meta_data->>'instansi', 'Kontingen HUT RI 81'),
    coalesce(new.raw_user_meta_data->>'role', 'participant'),
    100,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-sync all existing users in auth.users that are missing in public.profiles
insert into public.profiles (id, full_name, instansi, role, total_points, onboarding_completed)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', 'Peserta Merdeka 81'),
  coalesce(raw_user_meta_data->>'instansi', 'Kontingen HUT RI 81'),
  coalesce(raw_user_meta_data->>'role', 'participant'),
  100,
  true
from auth.users
on conflict (id) do nothing;
-- Incremental Migration: Add quiz_questions table to existing Supabase Database
-- Safe execution with IF NOT EXISTS clauses

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer_index integer default 0,
  explanation text,
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.quiz_questions enable row level security;

-- Policy: Public can view quiz questions
drop policy if exists "Public read access for quiz_questions" on public.quiz_questions;
create policy "Public read access for quiz_questions"
on public.quiz_questions for select
using (true);

-- Policy: Authenticated users / Admin can manage quiz_questions
drop policy if exists "Authenticated manage quiz_questions" on public.quiz_questions;
create policy "Authenticated manage quiz_questions"
on public.quiz_questions for all
using (auth.role() = 'authenticated' or auth.uid() is not null);
-- Incremental Migration: Add twibbon_frames table to existing Supabase Database
-- Safe execution with IF NOT EXISTS clauses

create table if not exists public.twibbon_frames (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title text not null,
  subtitle text,
  accent_color text default '#F59E0B',
  frame_image_url text,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.twibbon_frames enable row level security;

-- Policy: Public can view twibbon frames
drop policy if exists "Public can view active twibbon_frames" on public.twibbon_frames;
drop policy if exists "Public read access for twibbon_frames" on public.twibbon_frames;
create policy "Public read access for twibbon_frames"
on public.twibbon_frames for select
using (true);

-- Policy: Authenticated users / Admin can insert twibbon frames
drop policy if exists "Admin can manage twibbon_frames" on public.twibbon_frames;
drop policy if exists "Authenticated insert twibbon_frames" on public.twibbon_frames;
create policy "Authenticated insert twibbon_frames"
on public.twibbon_frames for insert
with check (auth.role() = 'authenticated' or auth.uid() is not null);

-- Policy: Authenticated users / Admin can update twibbon frames
drop policy if exists "Authenticated update twibbon_frames" on public.twibbon_frames;
create policy "Authenticated update twibbon_frames"
on public.twibbon_frames for update
using (auth.role() = 'authenticated' or auth.uid() is not null);

-- Policy: Authenticated users / Admin can delete twibbon frames
drop policy if exists "Authenticated delete twibbon_frames" on public.twibbon_frames;
create policy "Authenticated delete twibbon_frames"
on public.twibbon_frames for delete
using (auth.role() = 'authenticated' or auth.uid() is not null);
-- Enable Supabase Realtime Broadcast for PostgreSQL Tables
-- Crucial step for live WebSocket updates on Stage Display and Participant devices

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'gallery_items') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_items';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_event_state') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.live_event_state';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'polls') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.polls';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END $$;

-- Permissive update policy for profiles total_points update
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public update profiles" on public.profiles;
create policy "Public update profiles" on public.profiles for update using (true) with check (true);
-- Fix RLS Select policy on public.profiles table so Stage Display can read Leaderboard
-- Allows public/anon and authenticated users to SELECT profiles for Leaderboard Top 5

alter table public.profiles enable row level security;

drop policy if exists "Public view profiles" on public.profiles;
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Allow select profiles for all" on public.profiles;

create policy "Allow select profiles for all"
on public.profiles for select
using (true);
-- Migration: Add event_title and event_date columns to live_event_state table
-- Allows Admin to dynamically control stage display header title & date text

alter table public.live_event_state
  add column if not exists event_title text default 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81',
  add column if not exists event_date text default '17 AGUSTUS 2026';

-- Permissive RLS policy for live_event_state updates by Admin/Public
drop policy if exists "Public update live_event_state" on public.live_event_state;
create policy "Public update live_event_state" on public.live_event_state for update using (true) with check (true);
-- Migration: Add event_year_number column to live_event_state table
-- Allows Admin to dynamically control age year number (e.g., '81') across the entire application

alter table public.live_event_state
  add column if not exists event_year_number text default '81',
  add column if not exists event_date text default '17 AGUSTUS 2026',
  add column if not exists event_title text default 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81';

-- Permissive RLS policy for live_event_state updates by Admin/Public
drop policy if exists "Public update live_event_state" on public.live_event_state;
create policy "Public update live_event_state" on public.live_event_state for update using (true) with check (true);
-- ====================================================================
-- ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â­ MIGRATION: LOMBA COSPLAY PRESIDEN RI & PAHLAWAN NASIONAL 2026
-- Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta
-- ====================================================================

-- 1. Tambah Kolom Status Publikasi Cosplay pada live_event_state
alter table public.live_event_state
  add column if not exists cosplay_published boolean default false;

-- 2. Tabel Peserta Cosplay
create table if not exists public.cosplay_participants (
  id text primary key default 'cp-' || extract(epoch from now())::text || '-' || floor(random()*1000)::text,
  name text not null,
  class_level text not null, -- A, B1, B2, SD, SMP, DP-1, DP-2, etc.
  character_name text not null, -- e.g., Ir. Soekarno, Jenderal Soedirman, Cut Nyak Dhien
  category text not null check (category in ('usia_dini', 'usia_menengah', 'usia_atas')),
  created_at timestamptz default now()
);

-- 3. Tabel Skor Penilaian Juri
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
-- ====================================================================
-- ÃƒÂ¢Ã…Â¡Ã‚Â¡ SQL FIX: NORMALIZE TWIBBON FRAME URLS TO RELATIVE PATHS
-- Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

-- Update any existing rows that contain hardcoded 'http://localhost:3000'
update public.twibbon_frames
set frame_image_url = replace(frame_image_url, 'http://localhost:3000', '')
where frame_image_url like 'http://localhost:3000%';
-- ====================================================================
-- ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  MIGRATION: DYNAMIC POLL MANAGEMENT
-- Yayasan Al-Wathoniyah Asshodriyah 9 Jakarta
-- ====================================================================

create table if not exists public.polls (
  id text primary key default 'poll-main',
  question text not null default 'Pertunjukan Mana yang Paling Memukau Hari Ini?',
  options jsonb not null default '[
    {"id": "opt-1", "label": "Tari Kolosal Tradisional", "votes": 42},
    {"id": "opt-2", "label": "Marching Band Garuda", "votes": 38},
    {"id": "opt-3", "label": "Teater Puisi Pahlawan", "votes": 25},
    {"id": "opt-4", "label": "Paduan Suara Kebangsaan", "votes": 20}
  ]'::jsonb,
  total_votes integer not null default 125,
  is_active boolean not null default true,
  updated_at timestamptz default now()
);

alter table public.polls enable row level security;

drop policy if exists "Allow select polls for all" on public.polls;
create policy "Allow select polls for all" on public.polls for select using (true);

drop policy if exists "Allow insert/update polls for all" on public.polls;
create policy "Allow insert/update polls for all" on public.polls for all using (true) with check (true);

-- Insert Default Poll
insert into public.polls (id, question, options, total_votes, is_active)
values (
  'poll-main',
  'Pertunjukan Mana yang Paling Memukau Hari Ini?',
  '[
    {"id": "opt-1", "label": "Tari Kolosal Tradisional", "votes": 42},
    {"id": "opt-2", "label": "Marching Band Garuda", "votes": 38},
    {"id": "opt-3", "label": "Teater Puisi Pahlawan", "votes": 25},
    {"id": "opt-4", "label": "Paduan Suara Kebangsaan", "votes": 20}
  ]'::jsonb,
  125,
  true
)
on conflict (id) do nothing;
-- Menambahkan kolom-kolom baru untuk fitur tambahan HUT RI ke-81 di tabel live_event_state

ALTER TABLE public.live_event_state
ADD COLUMN IF NOT EXISTS countdown_target_time timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS countdown_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS announcement_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS leaderboard_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sfx_enabled boolean DEFAULT true;

