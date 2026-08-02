-- Fix RLS Select policy on public.profiles table so Stage Display can read Leaderboard
-- Allows public/anon and authenticated users to SELECT profiles for Leaderboard Top 5

alter table public.profiles enable row level security;

drop policy if exists "Public view profiles" on public.profiles;
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Allow select profiles for all" on public.profiles;

create policy "Allow select profiles for all"
on public.profiles for select
using (true);
