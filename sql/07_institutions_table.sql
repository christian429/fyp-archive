-- ============================================================
-- FYP Archive: institutions table
--
-- Institution is now a controlled dropdown instead of free text,
-- so students can't submit inconsistent or misspelled names.
-- Seeded with ~150 well-established Nigerian universities across
-- federal, state, and private categories. Nigeria's university
-- count has grown quickly and sources disagree on the exact
-- current total (roughly 200-300+ depending on how recently
-- NUC-approved institutions are counted), so this list is a
-- solid starting point rather than a guaranteed-exhaustive one.
-- Admins can add any missing or newly-approved institution from
-- the Admin panel — see the "Admins can add institutions" policy
-- below.
-- Run this in the Supabase SQL Editor after 01_ through 06_.
-- ============================================================

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.institutions enable row level security;

create policy "Authenticated users can view institutions"
  on public.institutions for select
  using (auth.role() = 'authenticated');

create policy "Admins can add institutions"
  on public.institutions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_approved = true
    )
  );

insert into public.institutions (name) values
  ('University of Ibadan'),
  ('University of Lagos'),
  ('Ahmadu Bello University'),
  ('University of Nigeria, Nsukka'),
  ('Obafemi Awolowo University'),
  ('University of Benin'),
  ('University of Ilorin'),
  ('Bayero University Kano'),
  ('University of Port Harcourt'),
  ('University of Calabar'),
  ('University of Jos'),
  ('University of Maiduguri'),
  ('Usmanu Danfodiyo University, Sokoto'),
  ('Federal University of Technology, Akure'),
  ('Federal University of Technology, Minna'),
  ('Federal University of Technology, Owerri'),
  ('Federal University of Agriculture, Abeokuta'),
  ('Joseph Sarwuan Tarka University, Makurdi'),
  ('Modibbo Adama University, Yola'),
  ('Nnamdi Azikiwe University, Awka'),
  ('Abubakar Tafawa Balewa University, Bauchi'),
  ('University of Uyo'),
  ('Michael Okpara University of Agriculture, Umudike'),
  ('Federal University, Oye-Ekiti'),
  ('Federal University, Dutse'),
  ('Federal University, Dutsin-Ma'),
  ('Federal University, Gashua'),
  ('Federal University, Gusau'),
  ('Federal University, Kashere'),
  ('Federal University, Lafia'),
  ('Federal University, Lokoja'),
  ('Federal University, Otuoke'),
  ('Federal University, Wukari'),
  ('Federal University, Birnin Kebbi'),
  ('Federal University of Petroleum Resources, Effurun'),
  ('Federal University of Technology, Ikot Abasi'),
  ('Alex Ekwueme Federal University Ndufu-Alike'),
  ('Nigerian Defence Academy, Kaduna'),
  ('Nigeria Police Academy, Wudil'),
  ('National Open University of Nigeria'),
  ('University of Abuja'),
  ('University of Agriculture, Makurdi'),
  ('Federal University of Technology, Babura'),
  ('Lagos State University'),
  ('Ambrose Alli University, Ekpoma'),
  ('Delta State University, Abraka'),
  ('Rivers State University'),
  ('Imo State University'),
  ('Abia State University'),
  ('Enugu State University of Science and Technology'),
  ('Ebonyi State University'),
  ('Prince Abubakar Audu University, Anyigba'),
  ('Kwara State University'),
  ('Kaduna State University'),
  ('Kano University of Science and Technology, Wudil'),
  ('Nasarawa State University, Keffi'),
  ('Benue State University, Makurdi'),
  ('Plateau State University, Bokkos'),
  ('Taraba State University'),
  ('Adamawa State University, Mubi'),
  ('Gombe State University'),
  ('Bauchi State University, Gadau'),
  ('Sokoto State University'),
  ('Zamfara State University'),
  ('Kebbi State University of Science and Technology'),
  ('Umaru Musa Yar''Adua University, Katsina'),
  ('Sule Lamido University, Kafin Hausa'),
  ('Yobe State University'),
  ('Borno State University'),
  ('Osun State University'),
  ('Ekiti State University'),
  ('Adekunle Ajasin University, Akungba-Akoko'),
  ('Olabisi Onabanjo University, Ago-Iwoye'),
  ('Tai Solarin University of Education, Ijagun'),
  ('Lagos State University of Science and Technology'),
  ('Ladoke Akintola University of Technology, Ogbomoso'),
  ('Akwa Ibom State University'),
  ('Cross River University of Technology'),
  ('Ignatius Ajuru University of Education, Port Harcourt'),
  ('Chukwuemeka Odumegwu Ojukwu University, Uli'),
  ('Niger Delta University, Bayelsa'),
  ('Kogi State University'),
  ('Yusuf Maitama Sule University, Kano'),
  ('Kingsley Ozumba Mbadiwe University'),
  ('Covenant University'),
  ('Babcock University'),
  ('Bowen University'),
  ('Bells University of Technology'),
  ('Redeemer''s University'),
  ('Igbinedion University, Okada'),
  ('Afe Babalola University, Ado-Ekiti'),
  ('Bingham University'),
  ('Pan-Atlantic University'),
  ('American University of Nigeria, Yola'),
  ('Landmark University'),
  ('Crawford University'),
  ('Crescent University'),
  ('Caleb University'),
  ('Lead City University'),
  ('Joseph Ayo Babalola University'),
  ('Fountain University'),
  ('Al-Hikmah University'),
  ('Elizade University'),
  ('Wesley University'),
  ('Adeleke University'),
  ('Achievers University'),
  ('Salem University'),
  ('Novena University'),
  ('Renaissance University'),
  ('Godfrey Okoye University'),
  ('Tansian University'),
  ('Madonna University'),
  ('Caritas University'),
  ('Rhema University'),
  ('Evangel University'),
  ('Gregory University'),
  ('Hezekiah University'),
  ('Clifford University'),
  ('Michael and Cecilia Ibru University'),
  ('Western Delta University'),
  ('Veritas University, Abuja'),
  ('Baze University, Abuja'),
  ('Nile University of Nigeria'),
  ('Al-Qalam University, Katsina'),
  ('Northwest University, Kano'),
  ('Skyline University Nigeria'),
  ('Summit University, Offa'),
  ('Kings University, Ode-Omu'),
  ('Mountain Top University'),
  ('Chrisland University'),
  ('McPherson University'),
  ('Southwestern University, Nigeria'),
  ('Trinity University, Lagos'),
  ('Anchor University, Lagos'),
  ('Augustine University, Ilara-Epe'),
  ('Pen Resource University'),
  ('Precious Cornerstone University'),
  ('Christopher University'),
  ('Dominion University'),
  ('Legacy University, Okija'),
  ('Coal City University'),
  ('KolaDaisi University'),
  ('PAMO University of Medical Sciences'),
  ('Eko University of Medical and Health Sciences'),
  ('Maryam Abacha American University of Nigeria, Kano'),
  ('Hallmark University'),
  ('Ritman University'),
  ('Edwin Clark University'),
  ('Arthur Jarvis University'),
  ('Kwararafa University, Wukari'),
  ('Admiralty University of Nigeria'),
  ('Atiba University, Oyo'),
  ('Dominican University, Ibadan'),
  ('Spiritan University, Nneochi')
on conflict (name) do nothing;
