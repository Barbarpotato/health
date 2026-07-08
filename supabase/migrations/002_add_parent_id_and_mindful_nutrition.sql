-- Run this in Supabase SQL editor for an existing database.

alter type wellness_category add value if not exists 'mindful nutrition';

alter table activities
  add column if not exists parent_id uuid references activities(id) on delete cascade;
