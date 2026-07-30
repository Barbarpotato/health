-- Run this in Supabase SQL editor for an existing database.

alter type wellness_category add value if not exists 'bonus activity';

alter table activities
  add column if not exists points integer not null default 0;
