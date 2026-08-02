-- Migration: Add event_year_number column to live_event_state table
-- Allows Admin to dynamically control age year number (e.g., '81') across the entire application

alter table public.live_event_state
  add column if not exists event_year_number text default '81',
  add column if not exists event_date text default '17 AGUSTUS 2026',
  add column if not exists event_title text default 'PANGGUNG UTAMA PERAYAAN HUT RI KE-81';

-- Permissive RLS policy for live_event_state updates by Admin/Public
drop policy if exists "Public update live_event_state" on public.live_event_state;
create policy "Public update live_event_state" on public.live_event_state for update using (true) with check (true);
