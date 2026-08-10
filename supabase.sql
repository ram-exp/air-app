-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL
-- Editor → New query → paste → Run) after you've created the project and
-- filled in .env. It sets up:
--   1. A generic `records` table that every feature in the app reads/writes
--      through (see src/lib/supabaseData.js) — one row per task/project/
--      note/etc, keyed by which "collection" it belongs to.
--   2. Row Level Security so a signed-in user can only ever see or modify
--      their own rows, even if they know another user's id.
--   3. A public "uploads" Storage bucket (for Files + Library cover images)
--      with policies so anyone can read a file's URL, but only the owner
--      can upload/delete inside their own folder.

create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists records_user_collection_idx
  on records (user_id, collection);

alter table records enable row level security;

drop policy if exists "Users manage their own records" on records;
create policy "Users manage their own records"
  on records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage: create a public bucket named "uploads" (Dashboard → Storage →
-- New bucket → name it "uploads", toggle "Public bucket" on) before running
-- the policies below. Public read means anyone with the URL can view a
-- file (same as a Firebase Storage download URL) — writes are still locked
-- to each user's own folder (uploads/{uid}/...).

drop policy if exists "Public read access to uploads" on storage.objects;
create policy "Public read access to uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

drop policy if exists "Users upload to their own folder" on storage.objects;
create policy "Users upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete from their own folder" on storage.objects;
create policy "Users delete from their own folder"
  on storage.objects for delete
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
