-- Athena Travel (Supabase) - Full bootstrap SQL
-- Run this whole file once in Supabase SQL Editor on a NEW project.
-- Includes: schema + triggers + RLS policies + seed data.

-- -----------------------------------------------------------------------------
-- 1) EXTENSIONS
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 2) HELPERS
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3) TABLES
-- -----------------------------------------------------------------------------

-- PROFILES (for username + public profile info)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint profiles_username_length check (username is null or char_length(username) >= 3)
);

-- PLACES (curated content for the main feed)
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text,
  description text,
  image_url text,
  price numeric default 0,
  price_per_person numeric default 0,
  type text check (type in ('nature', 'historical', 'hotels', 'restaurants')),
  region text,
  lat float8,
  lon float8,
  airport_dist text,
  metro_dist text default 'N/A',
  bus_dist text,
  amenities text[],
  best_season text,
  difficulty text,
  duration text,
  average_rating numeric(2,1) default 0.0,
  rating_count integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- PLACE AI TEXTS
create table if not exists public.place_ai_texts (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  locale text not null default 'uz',
  summary text not null,
  must_visit_label text,
  location_info_title text,
  historical_info_title text,
  pricing_note text,
  review_title text,
  review_subtitle text,
  comment_placeholder_auth text,
  comment_placeholder_guest text,
  login_to_comment_label text,
  rating_selected_message text,
  source text default 'ai',
  model_name text,
  prompt_version text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(place_id, locale)
);

-- COMMENTS (rating + text)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  comment_text text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- FAVORITES
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, place_id)
);

-- TRANSIT SCHEDULES (public list)
create table if not exists public.transit_schedules (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'surkhandarya' | 'uzbekistan' | 'international'
  type text not null,     -- 'Poyezd' | 'Parvoz' | 'Afrosiyob' ...
  number text not null,   -- Reys raqami
  route text not null,    -- Yo'nalish
  depart_time text,
  arrive_time text,
  platform text,
  status text default 'On Time',
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- TICKETS (with payment metadata used in UI)
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null, -- Human readable: AF-123456
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  place_title text not null,
  place_location text,

  -- Passenger details
  passenger_name text not null,
  passenger_phone text not null,
  passenger_email text,
  passport_number text not null,
  birth_date date not null,
  gender text,

  -- Travel details
  ticket_type text,
  ticket_class text,
  guests integer not null default 1 check (guests > 0),
  date date not null,
  depart_time text,
  arrival_time text,
  train text,
  coach text,
  seat text,
  platform text,

  -- Payment details
  total_price numeric(15,2) not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'cancelled')),
  payment_method text default 'card',
  card_last4 text,
  transaction_id text unique,
  payment_at timestamptz,

  -- System details
  status text not null default 'checking' check (status in ('checking', 'confirmed', 'completed', 'rejected', 'cancelled')),
  qr_code_data text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_tickets_user_id on public.tickets(user_id);
create index if not exists idx_tickets_ticket_id on public.tickets(ticket_id);
create index if not exists idx_tickets_payment_status on public.tickets(payment_status);

-- SERVICES: TOUR GUIDES
create table if not exists public.tour_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  languages text[] default '{}'::text[],
  region text,
  description text,
  hourly_rate numeric not null default 0,
  rating numeric(2,1) not null default 0,
  available boolean not null default true,
  photo_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- SERVICES: TRANSPORT PROVIDERS
create table if not exists public.transport_providers (
  id uuid primary key default gen_random_uuid(),
  driver_name text not null,
  phone text,
  vehicle_make text,
  vehicle_model text,
  license_plate text,
  capacity integer not null default 4,
  service_area text,
  fare_per_km numeric not null default 0,
  description text,
  available boolean not null default true,
  photo_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 4) FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-create/update profile row when a new auth user signs up
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
    nullif(new.raw_user_meta_data->>'username', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update
    set
      email = excluded.email,
      username = coalesce(excluded.username, public.profiles.username),
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep updated_at in sync
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_places_updated_at on public.places;
create trigger set_places_updated_at
before update on public.places
for each row execute procedure public.set_updated_at();

drop trigger if exists set_place_ai_texts_updated_at on public.place_ai_texts;
create trigger set_place_ai_texts_updated_at
before update on public.place_ai_texts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute procedure public.set_updated_at();

-- Recompute average_rating and rating_count when comments change
create or replace function public.update_average_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_place_id uuid;
begin
  target_place_id = coalesce(new.place_id, old.place_id);

  update public.places
  set
    average_rating = coalesce((select avg(rating)::numeric(2,1) from public.comments where place_id = target_place_id), 0.0),
    rating_count = (select count(*) from public.comments where place_id = target_place_id)
  where id = target_place_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_comment_changed on public.comments;
create trigger on_comment_changed
after insert or update or delete on public.comments
for each row execute procedure public.update_average_rating();

-- Username -> user lookup (optional helper)
create or replace function public.find_user_by_username(input_username text)
returns table (
  id uuid,
  email text,
  username text,
  full_name text,
  avatar_url text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'username', '') as username,
    coalesce(u.raw_user_meta_data->>'full_name', '') as full_name,
    coalesce(u.raw_user_meta_data->>'avatar_url', '') as avatar_url
  from auth.users u
  where lower(coalesce(u.raw_user_meta_data->>'username', '')) = lower(trim(input_username))
  limit 1;
$$;

-- Comments fetch with user metadata used by the frontend (RPC)
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
set search_path = public, auth
as $$
  select
    c.id,
    c.user_id,
    c.comment_text,
    c.rating,
    c.created_at,
    coalesce(
      p.full_name,
      nullif(u.raw_user_meta_data->>'full_name', ''),
      p.username,
      nullif(u.raw_user_meta_data->>'username', ''),
      'Foydalanuvchi'
    ) as full_name,
    coalesce(
      p.avatar_url,
      nullif(u.raw_user_meta_data->>'avatar_url', ''),
      null
    ) as avatar_url
  from public.comments c
  left join public.profiles p on p.id = c.user_id
  left join auth.users u on u.id = c.user_id
  where c.place_id = p_place_id
  order by c.created_at desc;
$$;

grant execute on function public.find_user_by_username(text) to anon, authenticated;
grant execute on function public.get_comments_with_user_metadata(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5) RLS (POLICIES)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_ai_texts enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;
alter table public.transit_schedules enable row level security;
alter table public.tickets enable row level security;
alter table public.tour_guides enable row level security;
alter table public.transport_providers enable row level security;

-- PROFILES: (Needed for username->email lookup in the current frontend)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- PLACES: public read
drop policy if exists "Places are viewable by everyone" on public.places;
create policy "Places are viewable by everyone"
on public.places for select
using (true);

-- PLACE AI TEXTS: public read
drop policy if exists "Place AI texts are viewable by everyone" on public.place_ai_texts;
create policy "Place AI texts are viewable by everyone"
on public.place_ai_texts for select
using (true);

-- COMMENTS: public read, authenticated write (own only)
drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Authenticated users can insert comments" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
create policy "Comments are viewable by everyone"
on public.comments for select
using (true);
create policy "Authenticated users can insert comments"
on public.comments for insert
with check (auth.uid() = user_id);
create policy "Users can update own comments"
on public.comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete own comments"
on public.comments for delete
using (auth.uid() = user_id);

-- FAVORITES: own only
drop policy if exists "Users can view own favorites" on public.favorites;
drop policy if exists "Users can insert own favorites" on public.favorites;
drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can view own favorites"
on public.favorites for select
using (auth.uid() = user_id);
create policy "Users can insert own favorites"
on public.favorites for insert
with check (auth.uid() = user_id);
create policy "Users can delete own favorites"
on public.favorites for delete
using (auth.uid() = user_id);

-- TRANSIT SCHEDULES: public read
drop policy if exists "Transit schedules are viewable by everyone" on public.transit_schedules;
create policy "Transit schedules are viewable by everyone"
on public.transit_schedules for select
using (true);

-- TICKETS: own only (delete only while checking)
drop policy if exists "Users can view their own tickets" on public.tickets;
drop policy if exists "Users can create their own tickets" on public.tickets;
drop policy if exists "Users can update their own tickets" on public.tickets;
drop policy if exists "Users can delete their own pending tickets" on public.tickets;
create policy "Users can view their own tickets"
on public.tickets for select
using (auth.uid() = user_id);
create policy "Users can create their own tickets"
on public.tickets for insert
with check (auth.uid() = user_id);
create policy "Users can update their own tickets"
on public.tickets for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "Users can delete their own pending tickets"
on public.tickets for delete
using (auth.uid() = user_id and status = 'checking');

-- TOUR GUIDES: public read (available only)
drop policy if exists "Tour guides are viewable by everyone" on public.tour_guides;
create policy "Tour guides are viewable by everyone"
on public.tour_guides for select
using (available = true);

-- TRANSPORT PROVIDERS: public read (available only)
drop policy if exists "Transport providers are viewable by everyone" on public.transport_providers;
create policy "Transport providers are viewable by everyone"
on public.transport_providers for select
using (available = true);

-- -----------------------------------------------------------------------------
-- 6) SEED DATA
-- -----------------------------------------------------------------------------

-- Initial curated places (Surxondaryo)
insert into public.places (title, location, description, image_url, price, type, region, airport_dist, amenities, best_season, difficulty, duration)
values
('Al-Hakim at-Termizi', 'Old Termez', 'Buyuk islom olimi mangu qo''nim topgan muqaddas qadamjo.', 'https://st.muslim.uz/cache/f/0/a/9/c/f0a9c3295f9620d33640af9c6a6f9a89df148cd5.jpeg', 15000, 'historical', 'termez', '12 km', array['Guide','History','Prayer Room'], 'Spring', 'Easy', '2-3 Hours'),
('Sultan Saodat Ensemble', 'Termez District', 'Seyidlar sulolasining bir necha asrlik maqbaralar majmuasi.', 'https://visitsilkroad.org/wp-content/uploads/2022/03/Termez-Sultan-Saodat-Ensemble-Uzbekistan2.jpg', 10000, 'historical', 'termez', '3.5 km', array['Guide','History'], 'Autumn', 'Easy', '1-2 Hours'),
('Sangardak Waterfall', 'Sariosiyo District', 'O''zbekistonning eng baland va go''zal sharsharalaridan biri.', 'https://www.advantour.com/img/uzbekistan/termez/sangardak-waterfall/sangardak-waterfall2.jpg', 20000, 'nature', 'sariosiyo', '205 km', array['Nature','Food','Photo Ops'], 'Summer', 'Medium', 'Full Day'),
('Fayaz-Tepa Monastery', 'Old Termez', 'Kushonlar davriga oid qadimiy Buddaviylik monastiri.', 'https://images.unsplash.com/photo-1548013146-72479768bbaa?w=800', 25000, 'historical', 'termez', '15 km', array['Museum','Guide','History'], 'Spring', 'Easy', '1-2 Hours');

insert into public.place_ai_texts (
  place_id,
  locale,
  summary,
  must_visit_label,
  location_info_title,
  historical_info_title,
  pricing_note,
  review_title,
  review_subtitle,
  comment_placeholder_auth,
  comment_placeholder_guest,
  login_to_comment_label,
  rating_selected_message,
  source,
  model_name,
  prompt_version
)
select
  p.id,
  'uz',
  p.description,
  'AI tavsiya',
  'Joylashuv ma''lumotlari',
  'Tarixiy ma''lumot',
  '* Narxlar bir kecha uchun ko''rsatilgan',
  'Baholang va fikr qoldiring',
  'Reyting va izoh birga yuboriladi.',
  'Fikringizni yozing...',
  'Fikr yozish uchun avval tizimga kiring',
  'Kirish va fikr yozish',
  'Reyting tanlandi',
  'seed',
  'manual',
  'v1'
from public.places p
on conflict (place_id, locale) do nothing;

-- Extra curated places (admin.sql content)
insert into public.places (title, location, description, image_url, price, type, region, airport_dist, amenities, best_season, difficulty, duration)
values
('Qirq Qiz qalКјasi', 'Eski Termiz', 'Afsonalarga boy qadimiy qalКјa xarobalari va tarixiy sayohat maskani.', 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Kirk_Kiz_Fortress.jpg', 18000, 'historical', 'termez', '14 km', array['Gid','Tarix','Suratga olish'], 'Bahor', 'Oson', '1-2 soat'),
('Zurmala stupasi', 'Termiz tumani', 'Kushonlar davridan qolgan yirik buddaviy yodgorliklardan biri.', 'https://upload.wikimedia.org/wikipedia/commons/4/48/Zurmala_Stupa.jpg', 12000, 'historical', 'termez', '11 km', array['Gid','Tarix','Muzey'], 'Bahor', 'Oson', '1 soat'),
('Qora-Tepe majmuasi', 'Eski Termiz', 'Qadimgi buddaviy ibodatxona va g''or monastirlari joylashgan arxeologik hudud.', 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Kara-Tepe_Termez.jpg', 22000, 'historical', 'termez', '16 km', array['Gid','Tarix','Suratga olish'], 'Kuz', 'Oson', '2-3 soat'),
('Jarqo''rg''on minorasi', 'Jarqo''rg''on tumani', 'Saljuqiy davr me''morchiligining noyob namunasi bo''lgan qadimiy minora.', 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Jarkurgan_Minaret.jpg', 15000, 'historical', 'jarqorgon', '48 km', array['Gid','Tarix','Suratga olish'], 'Kuz', 'Oson', '1-2 soat'),
('Boysun tog''lari', 'Boysun tumani', 'Boysun tog''lari sof havo, piyoda sayr va betakror manzaralari bilan mashhur.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200', 30000, 'nature', 'boysun', '145 km', array['Tabiat','Piyoda sayr','Suratga olish'], 'Yoz', 'O''rta', 'Butun kun'),
('Teshik-Tosh g''ori', 'Boysun tumani', 'Neandertal bolasi qoldiqlari topilgan mashhur arxeologik g''or.', 'https://upload.wikimedia.org/wikipedia/commons/7/79/Teshik-Tash_Cave.jpg', 25000, 'historical', 'boysun', '155 km', array['Gid','Tarix','Piyoda sayr'], 'Bahor', 'O''rta', '3-4 soat'),
('Derbent darasi', 'Boysun tumani', 'Tik qoyalari va tor yo''llari bilan sarguzasht sevuvchilar uchun qiziqarli maskan.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200', 28000, 'nature', 'boysun', '132 km', array['Tabiat','Suratga olish','Piyoda sayr'], 'Bahor', 'O''rta', 'Yarim kun'),
('Machay g''ori', 'Boysun tumani', 'Qadimiy odamlar yashagan deb hisoblangan tarixiy va tabiiy g''or majmuasi.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200', 21000, 'historical', 'boysun', '150 km', array['Gid','Tarix','Tabiat'], 'Kuz', 'O''rta', '2-3 soat'),
('Sherobod vohalari', 'Sherobod tumani', 'Cho''l va voha uyg''unlashgan, mahalliy hayot va tabiatni his qilish mumkin bo''lgan hudud.', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200', 17000, 'nature', 'sherobod', '78 km', array['Tabiat','Mahalliy taomlar','Suratga olish'], 'Qish', 'Oson', '2-3 soat'),
('Xo''jaipok vodiysi', 'Uzun tumani', 'Yashil vodiy, tog'' etaklari va oilaviy dam olish uchun mos osoyishta joy.', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200', 20000, 'nature', 'uzun', '98 km', array['Tabiat','Piknik','Suratga olish'], 'Bahor', 'Oson', 'Yarim kun'),
('Sariosiyo eko oromgohi', 'Sariosiyo tumani', 'Tog'' sayohati uchun qulay, tabiat bag''rida joylashgan ixcham dam olish maskani.', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200', 95000, 'hotels', 'sariosiyo', '198 km', array['Wi-Fi','Nonushta','Avtoturargoh','Tabiat'], 'Yoz', 'Oson', '1 tun'),
('Termiz sohil mehmonxonasi', 'Termiz shahri', 'Amudaryo yaqinidagi qulay mehmonxona, sayyohlar va oilalar uchun mos.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', 320000, 'hotels', 'termez', '9 km', array['Wi-Fi','Nonushta','Avtoturargoh','Oila uchun qulay'], 'Barcha fasllar', 'Oson', '1 tun'),
('Boysun butik mehmonxonasi', 'Boysun markazi', 'Milliy uslubdagi interyer va tog'' sayohatlari uchun qulay joylashuvga ega mehmonxona.', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', 270000, 'hotels', 'boysun', '140 km', array['Wi-Fi','Nonushta','Gid xizmati','Avtoturargoh'], 'Barcha fasllar', 'Oson', '1 tun'),
('Denov saroy mehmonxonasi', 'Denov shahri', 'Shahar markazida joylashgan zamonaviy mehmonxona va qisqa biznes safarlari uchun qulay tanlov.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', 290000, 'hotels', 'denov', '92 km', array['Wi-Fi','Nonushta','Avtoturargoh','Konditsioner'], 'Barcha fasllar', 'Oson', '1 tun'),
('Termiz osh markazi', 'Termiz shahri', 'Mahalliy osh, kabob va milliy taomlarni tatib ko''rish uchun mashhur maskan.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200', 60000, 'restaurants', 'termez', '8 km', array['Mahalliy taomlar','Oila uchun qulay','Olib ketish'], 'Barcha fasllar', 'Oson', '1-2 soat'),
('Amudaryo baliq restorani', 'Termiz sohili', 'Daryo bo''yidagi manzara bilan yangi baliq va sharqona taomlar taklif etiladi.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200', 85000, 'restaurants', 'termez', '10 km', array['Baliq','Chiroyli manzara','Oila uchun qulay'], 'Yoz', 'Oson', '1-2 soat'),
('Boysun milliy taomlari', 'Boysun markazi', 'Boysuncha tandir go''sht va uy usulidagi taomlari bilan tanilgan restoran.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200', 55000, 'restaurants', 'boysun', '142 km', array['Mahalliy taomlar','Choy','Oila uchun qulay'], 'Barcha fasllar', 'Oson', '1-2 soat'),
('Denov somsa markazi', 'Denov shahri', 'Issiq somsalar va tezkor xizmat bilan yo''lovchilar uchun qulay ovqatlanish joyi.', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200', 35000, 'restaurants', 'denov', '90 km', array['Tez xizmat','Mahalliy taomlar','Olib ketish'], 'Barcha fasllar', 'Oson', '30-60 daqiqa'),
('Uzun yong''oqzori', 'Uzun tumani', 'Yong''oqzorlar va salqin iqlim bilan piknik hamda dam olish uchun yoqimli tabiat maskani.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', 16000, 'nature', 'uzun', '110 km', array['Tabiat','Piknik','Oila uchun qulay'], 'Yoz', 'Oson', '2-3 soat'),
('Sherobod cho''l oromgohi', 'Sherobod tumani', 'Cho''l manzarasi, kechki gulxan va yulduzlarni tomosha qilish uchun maxsus oromgoh.', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200', 140000, 'hotels', 'sherobod', '82 km', array['Kemping','Kechki ovqat','Suratga olish','Avtoturargoh'], 'Kuz', 'Oson', '1 tun'),
('Angor yashil bog''i', 'Angor tumani', 'Yashil hudud, bolalar uchun maydoncha va oilaviy hordiq uchun mos bog''.', 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1200', 10000, 'nature', 'angor', '36 km', array['Tabiat','Oila uchun qulay','Piknik'], 'Bahor', 'Oson', '1-2 soat'),
('Termiz arxeologiya muzeyi', 'Termiz shahri', 'Surxondaryo tarixiga oid nodir topilmalar jamlangan zamonaviy muzey.', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200', 18000, 'historical', 'termez', '7 km', array['Muzey','Gid','Tarix'], 'Barcha fasllar', 'Oson', '1-2 soat'),
('Kampirtepa xarobalari', 'Amudaryo bo''yi', 'Ellinistik davrga oid qadimiy shahar xarobalari bilan mashhur arxeologik maydon.', 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Kampyrtepa.jpg', 24000, 'historical', 'termez', '30 km', array['Gid','Tarix','Suratga olish'], 'Bahor', 'O''rta', '2-3 soat'),
('Omonxona buloq hududi', 'Boysun etaklari', 'Toza buloq suvi, salqin havo va qisqa sayrlar uchun yoqimli dam olish hududi.', 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200', 14000, 'nature', 'boysun', '138 km', array['Tabiat','Piknik','Oila uchun qulay'], 'Yoz', 'Oson', '1-2 soat');

-- Transit schedules seed (transit_setup.sql content)
insert into public.transit_schedules (category, type, number, route, depart_time, arrive_time, platform, status) values
('surkhandarya', 'Poyezd', '079F', 'Toshkent - Termiz', '19:40', '08:50', '2', 'On Time'),
('surkhandarya', 'Poyezd', '379F', 'Toshkent - Denov', '21:00', '10:15', '1', 'Boarding'),
('surkhandarya', 'Poyezd', '081F', 'Toshkent - Sariosiyo', '20:30', '09:20', '3', 'Scheduled'),
('surkhandarya', 'Parvoz', 'HY-065', 'Tashkent - Termiz', '09:30', '11:00', 'A12', 'Check-in'),
('surkhandarya', 'Parvoz', 'HY-067', 'Tashkent - Termiz', '18:10', '19:40', 'B05', 'On Time'),
('uzbekistan', 'Afrosiyob', '762F', 'Toshkent - Buxoro', '07:28', '11:19', '1', 'On Time'),
('uzbekistan', 'Afrosiyob', '760F', 'Toshkent - Samarqand', '08:00', '10:08', '2', 'Arrived'),
('uzbekistan', 'O''zbekiston', '060F', 'Toshkent - Andijon', '16:45', '22:30', '4', 'Delayed'),
('uzbekistan', 'Poyezd', '054F', 'Toshkent - Xiva', '21:00', '11:20', '2', 'Scheduled'),
('uzbekistan', 'Parvoz', 'HY-011', 'Tashkent - Nukus', '08:15', '10:05', 'A03', 'On Time'),
('international', 'Parvoz', 'HY-601', 'Tashkent - Moscow', '14:20', '17:30', 'B12', 'Boarding'),
('international', 'Parvoz', 'TK-371', 'Istanbul - Tashkent', '18:30', '01:20', 'C02', 'Delayed'),
('international', 'Parvoz', 'HY-271', 'Tashkent - Seoul', '22:15', '06:10', 'A08', 'Scheduled');

-- Optional service seed (so pages are not empty)
insert into public.tour_guides (name, phone, languages, region, description, hourly_rate, rating, available, photo_url) values
('Aziza', '+998901112233', array['uz','ru','en'], 'Toshkent', 'Tarixiy joylar bo''yicha tajribali gid.', 120000, 4.8, true, null),
('Javohir', '+998933334455', array['uz','ru'], 'Samarqand', 'Samarqand va Buxoro bo''yicha ekskursiyalar.', 90000, 4.6, true, null);

insert into public.transport_providers (driver_name, phone, vehicle_make, vehicle_model, license_plate, capacity, service_area, fare_per_km, description, available, photo_url) values
('Sardor', '+998977776655', 'Chevrolet', 'Cobalt', '01A123AA', 4, 'Toshkent', 7000, 'Shahar ichida va aeroport transfer.', true, null),
('Dilshod', '+998991234567', 'Hyundai', 'Starex', '01B777BB', 7, 'Samarqand', 9000, 'Oilaviy sayohat va guruh transfer.', true, null);

-- Explicit grants (avoid "permission denied" when RLS policies allow access)
grant usage on schema public to anon, authenticated;

grant select on public.places to anon, authenticated;
grant select on public.place_ai_texts to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant select on public.transit_schedules to anon, authenticated;
grant select on public.tour_guides to anon, authenticated;
grant select on public.transport_providers to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.tickets to authenticated;
grant select on public.favorites to authenticated;

grant insert, update, delete on public.profiles to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, delete on public.favorites to authenticated;
grant insert, update, delete on public.tickets to authenticated;

-- PostgREST schema reload (helps avoid "column not found" caching issues)
notify pgrst, 'reload schema';
