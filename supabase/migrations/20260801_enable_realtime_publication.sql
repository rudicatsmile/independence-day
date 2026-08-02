-- Enable Supabase Realtime Broadcast for PostgreSQL Tables
-- Crucial step for live WebSocket updates on Stage Display and Participant devices

begin;
  -- Add tables to Supabase Realtime Publication if not already added
  alter publication supabase_realtime add table public.gallery_items;
  alter publication supabase_realtime add table public.live_event_state;
  alter publication supabase_realtime add table public.polls;
  alter publication supabase_realtime add table public.profiles;
commit;

-- Permissive update policy for profiles total_points update
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public update profiles" on public.profiles;
create policy "Public update profiles" on public.profiles for update using (true) with check (true);
