-- Run this in Supabase SQL editor if your `users` table already exists
-- without a password column.

alter table users add column if not exists password text;
