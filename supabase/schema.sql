-- Run this in Supabase SQL editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  password text
);

create type wellness_category as enum ('physical wellness', 'mental wellness', 'intellectual wellness', 'mindful nutrition');

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category wellness_category not null,
  caption text,
  parent_id uuid references activities(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

-- storage bucket for photo uploads (run once, or create via dashboard)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- RLS: enable + allow anon key full access (adjust for production auth)
alter table users enable row level security;
alter table activities enable row level security;
alter table photos enable row level security;

create policy "anon full access users" on users for all using (true) with check (true);
create policy "anon full access activities" on activities for all using (true) with check (true);
create policy "anon full access photos" on photos for all using (true) with check (true);

create policy "anon full access photos bucket" on storage.objects for all
  using (bucket_id = 'photos') with check (bucket_id = 'photos');
