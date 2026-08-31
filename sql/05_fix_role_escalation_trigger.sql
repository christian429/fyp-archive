-- ============================================================
-- FYP Archive: fix prevent_role_escalation() blocking legitimate
-- SQL Editor use.
--
-- The trigger from 02_ correctly stops a logged-in student from
-- promoting themselves via the app's own Supabase client, but it
-- was too strict: it also silently reverted role/is_approved
-- changes made directly in the Supabase SQL Editor, because
-- auth.uid() is null there (there's no logged-in app user in
-- that context) and the old check treated "not an existing
-- admin" as "block it" even when there was no user at all.
--
-- Fixed version: only block the change when there IS a logged-in
-- app user making the request AND that user isn't already an
-- approved admin. A null auth.uid() (SQL Editor, service role,
-- migrations) is always allowed through.
-- Run this in the Supabase SQL Editor after 01_ through 04_.
-- ============================================================

create or replace function public.prevent_role_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role or new.is_approved is distinct from old.is_approved then
    if auth.uid() is not null and not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_approved = true
    ) then
      new.role := old.role;
      new.is_approved := old.is_approved;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;
