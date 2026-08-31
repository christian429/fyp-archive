-- ============================================================
-- FYP Archive: move "department" from the student's profile to
-- each individual project instead. A student's department can
-- change project to project (e.g. joint projects), so it now
-- belongs on the projects table (already added in 03_) rather
-- than being asked once at sign-up.
-- Run this in the Supabase SQL Editor after 01_, 02_, and 03_.
-- ============================================================

-- 1. Department is no longer collected at sign-up.
alter table public.profiles
  alter column department drop not null;

alter table public.profiles
  alter column department drop default;

-- 2. handle_new_user() no longer reads/inserts department.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'student',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Note: public.projects.department (added in 03_) is untouched —
-- it's now populated directly from the Upload form instead of being
-- copied from the student's profile.
