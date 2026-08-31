-- ============================================================
-- FYP Archive: projects table + Storage bucket
-- Run this in the Supabase SQL Editor after 01_ and 02_.
-- Covers US-02 (Upload), US-03 (Duplicate check), and lays the
-- groundwork for US-04 (Search) and US-06 (Manage records).
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fuzzy title similarity

-- 1. The archive table itself
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  supervisor text not null,
  year int not null check (year between 2000 and 2100),
  department text not null,
  abstract text not null,
  file_path text not null,   -- path inside the storage bucket
  file_name text not null,   -- original filename, for display/download
  is_flagged boolean not null default false, -- possible duplicate at upload time
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- 2. Anyone signed in can browse the archive (US-04 search/filter)
create policy "Authenticated users can view projects"
  on public.projects for select
  using (auth.role() = 'authenticated');

-- 3. Students can only upload as themselves
create policy "Students can insert own projects"
  on public.projects for insert
  with check (auth.uid() = student_id);

-- 4. Only admins can edit or delete records (US-06)
create policy "Admins can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_approved = true
    )
  );

create policy "Admins can delete projects"
  on public.projects for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_approved = true
    )
  );

-- 5. Duplicate-title check (US-03): fuzzy match via trigram similarity.
--    Called from the client with supabase.rpc('find_similar_titles', ...)
--    before a student submits their upload.
create or replace function public.find_similar_titles(input_title text)
returns table(id uuid, title text, year int, similarity real)
language sql
stable
as $$
  select id, title, year, similarity(title, input_title) as similarity
  from public.projects
  where similarity(title, input_title) > 0.35
  order by similarity desc
  limit 5;
$$;

-- ============================================================
-- 6. Storage bucket for the actual PDF/DOCX files.
--    Easiest to create the bucket itself in the dashboard:
--    Storage -> New bucket -> name it "project-reports" -> Private.
--    The policies below then control who can upload/read from it.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('project-reports', 'project-reports', false)
on conflict (id) do nothing;

-- Students can upload into their own folder: project-reports/<their-uid>/...
create policy "Students can upload their own reports"
  on storage.objects for insert
  with check (
    bucket_id = 'project-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Any authenticated user can read/download archived reports
create policy "Authenticated users can read reports"
  on storage.objects for select
  using (
    bucket_id = 'project-reports'
    and auth.role() = 'authenticated'
  );

-- Only admins can delete files from storage
create policy "Admins can delete reports"
  on storage.objects for delete
  using (
    bucket_id = 'project-reports'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_approved = true
    )
  );
