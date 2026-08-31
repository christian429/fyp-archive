-- ============================================================
-- FYP Archive: migrate to Student + Admin only, add Department
-- Run this in the Supabase SQL Editor AFTER 01_profiles_schema.sql.
-- Safe to run on a project that already has real rows.
-- ============================================================

-- 1. Add the new "department" column (free text, e.g. "Computer Science")
alter table public.profiles
  add column if not exists department text;

-- 2. Backfill any existing rows so the NOT NULL constraint below doesn't fail
update public.profiles
  set department = ''
  where department is null;

alter table public.profiles
  alter column department set not null;

-- 3. Remove the "lecturer" role: reassign any existing lecturer rows to
--    student first, since a check constraint would otherwise reject them.
update public.profiles
  set role = 'student'
  where role = 'lecturer';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'admin'));

-- 4. Every self-registered account is now auto-approved (no more staff
--    approval queue), so default is_approved to true going forward.
alter table public.profiles
  alter column is_approved set default true;

update public.profiles
  set is_approved = true
  where role = 'student';

-- 5. Replace handle_new_user(): role is now ALWAYS 'student' and never
--    trusted from client-supplied metadata (previously the signup form's
--    raw_user_meta_data->>'role' was inserted directly, which meant
--    anyone calling the Auth API directly could self-register as an
--    admin). Admins are promoted manually — see step 7 below.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, department, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'department', ''),
    'student',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- 6. Prevent privilege escalation via the client: block role/is_approved
--    from being changed by anyone who isn't already an approved admin,
--    even though the general "update own profile" policy allows students
--    to edit their own row (e.g. to fix a typo'd department).
create or replace function public.prevent_role_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role or new.is_approved is distinct from old.is_approved then
    if not exists (
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

drop trigger if exists prevent_role_escalation_trigger on public.profiles;
create trigger prevent_role_escalation_trigger
  before update on public.profiles
  for each row execute procedure public.prevent_role_escalation();

-- 7. To make YOURSELF an admin: sign up normally through the app first
--    (so a profile row exists), then run this once, replacing the email:
--
--    update public.profiles set role = 'admin', is_approved = true
--    where email = 'you@institution.edu';
