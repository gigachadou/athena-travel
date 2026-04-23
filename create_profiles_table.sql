-- Athena Travel: full Supabase setup (schema + RLS + seed data)
-- Run this whole file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (username is null or char_length(username) >= 3)
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  description text default '',
  image_url text default 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
  price integer not null default 0,
  price_per_person integer not null default 0,
  type text not null check (type in ('landmark', 'hotel', 'restaurant', 'parking', 'hospital', 'shopping', 'transport')),
  region text default '',
  amenities text[] default '{}',
  best_season text default '',
  difficulty text default '',
  duration text default '',
  lat double precision,
  lon double precision,
  average_rating numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_title_location_unique unique (title, location)
);

create table if not exists public.place_ai_texts (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  locale text not null check (locale in ('uz', 'en')),
  summary text default '',
  must_visit_label text default '',
  location_info_title text default '',
  historical_info_title text default '',
  pricing_note text default '',
  review_title text default '',
  review_subtitle text default '',
  comment_placeholder_auth text default '',
  comment_placeholder_guest text default '',
  login_to_comment_label text default '',
  rating_selected_message text default '',
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_ai_texts_place_locale_unique unique (place_id, locale)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_text text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_place_unique unique (user_id, place_id)
);

create table if not exists public.transit_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  route_code text,
  origin text not null,
  destination text not null,
  departure_time timestamptz,
  arrival_time timestamptz,
  price integer default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  ticket_type text default 'travel',
  quantity integer not null default 1 check (quantity > 0),
  total_price integer not null default 0,
  status text not null default 'checking' check (status in ('checking', 'confirmed', 'cancelled')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at_column();
drop trigger if exists update_places_updated_at on public.places;
create trigger update_places_updated_at before update on public.places for each row execute procedure public.update_updated_at_column();
drop trigger if exists update_place_ai_texts_updated_at on public.place_ai_texts;
create trigger update_place_ai_texts_updated_at before update on public.place_ai_texts for each row execute procedure public.update_updated_at_column();
drop trigger if exists update_comments_updated_at on public.comments;
create trigger update_comments_updated_at before update on public.comments for each row execute procedure public.update_updated_at_column();
drop trigger if exists update_transit_schedules_updated_at on public.transit_schedules;
create trigger update_transit_schedules_updated_at before update on public.transit_schedules for each row execute procedure public.update_updated_at_column();
drop trigger if exists update_tickets_updated_at on public.tickets;
create trigger update_tickets_updated_at before update on public.tickets for each row execute procedure public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(excluded.username, public.profiles.username),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_ai_texts enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;
alter table public.transit_schedules enable row level security;
alter table public.tickets enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles for select using (true);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

drop policy if exists places_select_all on public.places;
create policy places_select_all on public.places for select using (true);
drop policy if exists places_write_authenticated on public.places;
create policy places_write_authenticated on public.places for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists place_ai_texts_select_all on public.place_ai_texts;
create policy place_ai_texts_select_all on public.place_ai_texts for select using (true);
drop policy if exists place_ai_texts_write_authenticated on public.place_ai_texts;
create policy place_ai_texts_write_authenticated on public.place_ai_texts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists comments_select_all on public.comments;
create policy comments_select_all on public.comments for select using (true);
drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update using (auth.uid() = user_id);
drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments for delete using (auth.uid() = user_id);

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites for select using (auth.uid() = user_id);
drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites for insert with check (auth.uid() = user_id);
drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites for delete using (auth.uid() = user_id);

drop policy if exists transit_schedules_select_all on public.transit_schedules;
create policy transit_schedules_select_all on public.transit_schedules for select using (true);
drop policy if exists transit_schedules_write_authenticated on public.transit_schedules;
create policy transit_schedules_write_authenticated on public.transit_schedules for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own on public.tickets for select using (auth.uid() = user_id);
drop policy if exists tickets_insert_own on public.tickets;
create policy tickets_insert_own on public.tickets for insert with check (auth.uid() = user_id);
drop policy if exists tickets_update_own on public.tickets;
create policy tickets_update_own on public.tickets for update using (auth.uid() = user_id);
drop policy if exists tickets_delete_own on public.tickets;
create policy tickets_delete_own on public.tickets for delete using (auth.uid() = user_id);

create or replace function public.get_comments_with_user_metadata(p_place_id uuid)
returns table (
  id uuid,
  user_id uuid,
  comment_text text,
  rating integer,
  created_at timestamptz,
  full_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select c.id, c.user_id, c.comment_text, c.rating, c.created_at, coalesce(p.full_name, p.username, 'Foydalanuvchi') as full_name, p.avatar_url
  from public.comments c
  left join public.profiles p on p.id = c.user_id
  where c.place_id = p_place_id
  order by c.created_at desc;
$$;

grant execute on function public.get_comments_with_user_metadata(uuid) to anon, authenticated;

insert into public.places (title, location, description, price, price_per_person, type, region, amenities, best_season, difficulty, duration, lat, lon, average_rating, rating_count)
select
  'Travel Spot #' || gs,
  (array['Toshkent','Samarqand','Buxoro','Xiva','Termiz','Nukus','Qarshi','Farg''ona'])[(gs % 8) + 1],
  'Athena Travel uchun seed joy #' || gs,
  30000 + (gs * 5000),
  30000 + (gs * 5000),
  (array['landmark','hotel','restaurant','parking','hospital','shopping','transport'])[(gs % 7) + 1],
  (array['Toshkent','Samarqand','Buxoro','Xorazm','Surxondaryo','Qoraqalpog''iston','Qashqadaryo','Farg''ona'])[(gs % 8) + 1],
  array['Guide','WiFi'],
  (array['Bahor','Yoz','Kuz','Qish'])[(gs % 4) + 1],
  (array['Oson','O''rta'])[(gs % 2) + 1],
  '1-3 soat',
  37.2 + (gs * 0.10),
  56.1 + (gs * 0.20),
  4.0 + ((gs % 10) * 0.1),
  10 + gs
from generate_series(1, 65) as gs
on conflict (title, location) do nothing;
-- PROFILES TABLE SCHEMA (Required for User Management)

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Anyone can view profiles (public bios)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Users can only insert/update their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 4. Automatic Profile Creation on Auth Signup
-- This function will be triggered by Supabase Auth every time a user signs up.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Set up the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Trigger for updated_at (Optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
