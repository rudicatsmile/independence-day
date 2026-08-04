-- ====================================================================
-- 📊 MIGRATION: DYNAMIC POLL MANAGEMENT
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
