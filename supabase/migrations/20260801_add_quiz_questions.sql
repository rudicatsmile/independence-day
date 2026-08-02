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
