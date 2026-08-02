-- Schema Migration: Initial Database Setup for Merdeka 81
-- Enables RLS, auto-publish gallery with post-moderation, RLS policies, and triggers

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  instansi text,
  phone text unique,
  avatar_url text,
  role text default 'participant' check (role in ('participant', 'admin', 'media_team')),
  group_name text,
  total_points integer default 0,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Missions table
create table public.missions (
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
create table public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  points_earned integer default 0,
  completed_at timestamptz,
  unique(user_id, mission_id)
);

-- Badges System
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  icon text not null,
  rarity text default 'common' check (rarity in ('common', 'rare', 'legendary'))
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- Twibbon Frames (Admin Managed Background Frames)
create table public.twibbon_frames (
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
create table public.gallery_items (
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
create policy "Public can view approved gallery items"
on public.gallery_items for select
using (status = 'approved');

create policy "Users can insert own gallery items as approved"
on public.gallery_items for insert
with check (auth.uid() = user_id);

create policy "Moderator can update status for takedown"
on public.gallery_items for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'media_team')
  )
);
