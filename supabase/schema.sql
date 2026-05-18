create extension if not exists "pgcrypto";

create table if not exists public.app_daily_verses (
  day_of_year integer primary key,
  ref text not null,
  verse text not null,
  exegesis text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_readings (
  book text primary key,
  sort_order integer not null,
  reading_key text not null unique,
  title text not null,
  category text not null,
  subtitle text not null,
  chapter integer not null,
  available_chapters integer[] not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_journeys (
  id text primary key,
  sort_order integer not null,
  title text not null,
  books text not null,
  description text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  theme_name text not null default 'abbey',
  mode text not null default 'night',
  font_scale numeric not null default 1.55,
  line_height numeric not null default 1.8,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reader_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_key text not null,
  notes text not null default '',
  highlights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, reading_key)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_app_daily_verses_updated_at on public.app_daily_verses;
create trigger trg_app_daily_verses_updated_at
before update on public.app_daily_verses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_app_readings_updated_at on public.app_readings;
create trigger trg_app_readings_updated_at
before update on public.app_readings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_app_journeys_updated_at on public.app_journeys;
create trigger trg_app_journeys_updated_at
before update on public.app_journeys
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_reader_states_updated_at on public.reader_states;
create trigger trg_reader_states_updated_at
before update on public.reader_states
for each row
execute function public.set_updated_at();

alter table public.app_daily_verses enable row level security;
alter table public.app_readings enable row level security;
alter table public.app_journeys enable row level security;
alter table public.user_profiles enable row level security;
alter table public.reader_states enable row level security;

drop policy if exists "Public can read daily verses" on public.app_daily_verses;
create policy "Public can read daily verses"
on public.app_daily_verses
for select
using (true);

drop policy if exists "Public can read readings" on public.app_readings;
create policy "Public can read readings"
on public.app_readings
for select
using (true);

drop policy if exists "Public can read journeys" on public.app_journeys;
create policy "Public can read journeys"
on public.app_journeys
for select
using (true);

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own reader states" on public.reader_states;
create policy "Users can read own reader states"
on public.reader_states
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own reader states" on public.reader_states;
create policy "Users can insert own reader states"
on public.reader_states
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own reader states" on public.reader_states;
create policy "Users can update own reader states"
on public.reader_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;

grant select on public.app_daily_verses to anon, authenticated;
grant select on public.app_readings to anon, authenticated;
grant select on public.app_journeys to anon, authenticated;

grant select, insert, update on public.user_profiles to anon, authenticated;
grant select, insert, update on public.reader_states to anon, authenticated;

grant all privileges on public.app_daily_verses to service_role;
grant all privileges on public.app_readings to service_role;
grant all privileges on public.app_journeys to service_role;
grant all privileges on public.user_profiles to service_role;
grant all privileges on public.reader_states to service_role;

create index if not exists idx_app_readings_sort_order on public.app_readings(sort_order);
create index if not exists idx_app_journeys_sort_order on public.app_journeys(sort_order);
create index if not exists idx_reader_states_user_reading on public.reader_states(user_id, reading_key);
