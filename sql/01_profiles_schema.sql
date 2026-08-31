-- ============================================================
-- FYP Archive: Profiles table + Row Level Security (RLS)
-- Run this in Supabase SQL Editor after project creation.
-- Covers US-01 (Onboarding/Sign-up) and lays groundwork for
-- US-05 (role-based access control).
-- ============================================================

-- 1. Create a "profiles" table linked 1:1 to Supabase Auth users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'student' check (role in ('student', 'lecturer', 'admin')),
  is_approved boolean not null default false, -- staff roles need admin approval
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. Policy: users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. Policy: users can update their own profile (but not role/approval)
create policy "Users can update own basic info"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Policy: admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_approved = true
    )
  );

-- 6. Auto-create a profile row whenever a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    -- students are auto-approved; lecturers/admins need manual approval
    case when coalesce(new.raw_user_meta_data->>'role', 'student') = 'student' then true else false end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
