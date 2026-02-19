-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  cycle_length int default 28,
  period_duration int default 5,
  last_period_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Daily Logs Table
create type fasting_status_enum as enum ('fasting', 'period', 'sick', 'travel');

create table public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  log_date date not null,
  is_fasting boolean default true,
  fasting_status fasting_status_enum,
  water_intake int default 0,
  mood_id int, -- Simplified mood tracking (1-5 scale or ID reference)
  symptoms jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(user_id, log_date)
);

-- Period Logs Table
create table public.period_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  start_date date not null,
  end_date date,
  is_predicted boolean default false,
  created_at timestamptz default now()
);

-- Recipes Table
create type equipment_enum as enum ('rice_cooker', 'stove', 'no_cook');

create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  ingredients jsonb not null,
  instructions text not null,
  equipment equipment_enum default 'stove',
  budget_tag text, -- e.g., 'Under 15k', 'Hemat'
  image_url text,
  prep_time int, -- in minutes
  tags text[],
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.period_logs enable row level security;
alter table public.recipes enable row level security;

-- Policies
-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Daily Logs: Users can view, insert, update their own logs
create policy "Users can view own logs" on public.daily_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own logs" on public.daily_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own logs" on public.daily_logs
  for update using (auth.uid() = user_id);

-- Period Logs: Users can view, insert, update their own period logs
create policy "Users can view own period logs" on public.period_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own period logs" on public.period_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own period logs" on public.period_logs
  for update using (auth.uid() = user_id);

-- Recipes: Publicly viewable, only admins can insert/update (assuming admins or seed script)
create policy "Recipes are public" on public.recipes
  for select using (true);

-- Functions and Triggers

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Calculation Functions (User Request: Fasting Debt)
-- Updated to support specific date range (e.g. for Ramadan)
create or replace function get_fasting_debt(u_id uuid, start_date date default null, end_date date default null)
returns int as $$
declare
  debt int;
begin
  select count(*) into debt
  from public.daily_logs
  where user_id = u_id
    and fasting_status = 'period'
    and is_fasting = false
    and (start_date is null or log_date >= start_date)
    and (end_date is null or log_date <= end_date);
  return debt;
end;
$$ language plpgsql;
