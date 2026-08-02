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
  id uuid primary key default gen_random_uuid(),
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
  poll_id uuid references public.polls(id) on delete cascade,
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
