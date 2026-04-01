-- 1. EXTENSIONS (UUID va boshqalar)
create extension if not exists "uuid-ossp";

-- 2. TABLES (Jadvallar)

-- PROFILES (Foydalanuvchilar)
-- Bu Auth.users bilan avtomatik bog'lanadi
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  full_name text,
  avatar_url text,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key on public.profiles (username);

-- PLACES (Sayohat Joylari)
create table if not exists public.places (
  id uuid default uuid_generate_v4() primary key,
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
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- TICKETS 
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  place_id text not null,
  place_title text not null,
  place_location text,
  ticket_type text,
  guests integer default 1,
  date date not null,
  passenger_name text not null,
  passenger_phone text,
  passenger_email text,
  status text default 'confirmed',
  total_price numeric not null,
  seat text,
  train text,
  coach text,
  platform text,
  depart_time text,
  arrival_time text,
  ticket_class text,
  qr_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- PLACE AI TEXTS (AI yozgan matnlar)
create table if not exists public.place_ai_texts (
  id uuid default uuid_generate_v4() primary key,
  place_id uuid references public.places(id) on delete cascade not null,
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
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(place_id, locale)
);

-- COMMENTS (Fikrlar va Reytinglar)
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  place_id uuid references public.places(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment_text text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- FAVORITES (Sevimlilar)
create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, place_id)
);

-- 3. FUNCTIONS & TRIGGERS (Avtomatlashtirish)

-- Profil yaratishda avtomatik Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do update
  set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    email = excluded.email,
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Auth.users dan profile ga trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_place_ai_texts_updated_at on public.place_ai_texts;
create trigger set_place_ai_texts_updated_at
  before update on public.place_ai_texts
  for each row execute procedure public.set_updated_at();

-- Average Rating ni hisoblash funksiyasi
create or replace function update_average_rating()
returns trigger as $$
begin
  update public.places
  set 
    average_rating = (select avg(rating)::numeric(2,1) from public.comments where place_id = new.place_id),
    rating_count = (select count(*) from public.comments where place_id = new.place_id)
  where id = new.place_id;
  return new;
end;
$$ language plpgsql;

create trigger on_comment_added
  after insert or update or delete on public.comments
  for each row execute procedure update_average_rating();

-- 4. RLS POLICIES (Xavfsizlik)

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_ai_texts enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;
alter table public.tickets enable row level security;

-- Profiles: O'zining profilini ko'rish va yangilash
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Places: Hamma ko'rishi mumkin, lekin faqat Admin o'zgartira oladi (Hozircha hamma select qilishi mumkin)
create policy "Places are viewable by everyone" on places for select using (true);

-- Place AI texts: Hamma ko'rishi mumkin
create policy "Place AI texts are viewable by everyone" on place_ai_texts for select using (true);

-- Comments: Hamma ko'rishi mumkin, faqat login qilganlar yoza oladi, faqat o'zi o'chira oladi
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can insert comments" on comments for insert with check (auth.role() = 'authenticated');
create policy "Users can update own comments" on comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- Favorites: Faqat o'zining sevimlilarini ko'radi va boshqaradi
create policy "Users can view own favorites" on favorites for select using (auth.uid() = user_id);
create policy "Users can insert own favorites" on favorites for insert with check (auth.role() = 'authenticated');
create policy "Users can delete own favorites" on favorites for delete using (auth.uid() = user_id);

-- Tickets: Faqat o'zining chiptalarini ko'radi va boshqaradi
create policy "Users can view their own tickets" on public.tickets for select using ( auth.uid() = user_id );
create policy "Users can insert their own tickets" on public.tickets for insert with check ( auth.uid() = user_id );
create policy "Users can update their own tickets" on public.tickets for update using ( auth.uid() = user_id );

-- 5. INITIAL DATA (Boshlang'ich Ma'lumotlar - Surxondaryo)

insert into public.places (title, location, description, image_url, price, type, region, airport_dist, amenities, best_season, difficulty, duration)
values 
('Al-Hakim at-Termizi', 'Old Termez', 'Buyuk islom olimi mangu qo''nim topgan muqaddas qadamjo.', 'https://st.muslim.uz/cache/f/0/a/9/c/f0a9c3295f9620d33640af9c6a6f9a89df148cd5.jpeg', 15000, 'historical', 'termez', '12 km', '{Guide,History,Prayer Room}', 'Spring', 'Easy', '2-3 Hours'),
('Sultan Saodat Ensemble', 'Termez District', 'Seyidlar sulolasining bir necha asrlik maqbaralar majmuasi.', 'https://visitsilkroad.org/wp-content/uploads/2022/03/Termez-Sultan-Saodat-Ensemble-Uzbekistan2.jpg', 10000, 'historical', 'termez', '3.5 km', '{Guide,History}', 'Autumn', 'Easy', '1-2 Hours'),
('Sangardak Waterfall', 'Sariosiyo District', 'O''zbekistonning eng baland va go''zal sharsharalaridan biri.', 'https://www.advantour.com/img/uzbekistan/termez/sangardak-waterfall/sangardak-waterfall2.jpg', 20000, 'nature', 'sariosiyo', '205 km', '{Nature,Food,Photo Ops}', 'Summer', 'Medium', 'Full Day'),
('Fayaz-Tepa Monastery', 'Old Termez', 'Kushonlar davriga oid qadimiy Buddaviylik monastiri.', 'https://images.unsplash.com/photo-1548013146-72479768bbaa?w=800', 25000, 'historical', 'termez', '15 km', '{Museum,Guide,History}', 'Spring', 'Easy', '1-2 Hours');

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
