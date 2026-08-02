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
