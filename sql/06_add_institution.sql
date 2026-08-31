-- ============================================================
-- FYP Archive: add "institution" to projects
-- The app is no longer scoped to a single school, so each
-- project now records which institution it belongs to.
-- Run this in the Supabase SQL Editor after 01_ through 05_.
-- ============================================================

alter table public.projects
  add column if not exists institution text;

-- Backfill any existing rows before enforcing NOT NULL
update public.projects
  set institution = 'Unspecified'
  where institution is null;

alter table public.projects
  alter column institution set not null;
