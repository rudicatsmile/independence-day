-- Migration: Add event_title and event_date columns to live_event_state table
-- Allows Admin to dynamically control stage display header title & date text

alter table public.live_event_state
  add column if not exists event_title text default 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81',
  add column if not exists event_date text default '17 AGUSTUS 2026';

-- Permissive RLS policy for live_event_state updates by Admin/Public
drop policy if exists "Public update live_event_state" on public.live_event_state;
create policy "Public update live_event_state" on public.live_event_state for update using (true) with check (true);
