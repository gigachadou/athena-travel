-- Home page "News" carousel table
-- Admins decide which newly opened places appear in the carousel.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.home_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default 'News',
  description text not null,
  location text,
  image_url text not null,
  cta_label text not null default 'Batafsil',
  place_id uuid references public.places(id) on delete set null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  published_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_home_news_active_order
on public.home_news (is_active, display_order, published_at desc);

drop trigger if exists set_home_news_updated_at on public.home_news;
create trigger set_home_news_updated_at
before update on public.home_news
for each row execute procedure public.set_updated_at();

alter table public.home_news enable row level security;

drop policy if exists "Active home news are viewable by everyone" on public.home_news;
create policy "Active home news are viewable by everyone"
on public.home_news for select
using (is_active = true);

drop policy if exists "Admins can view all home news" on public.home_news;
create policy "Admins can view all home news"
on public.home_news for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert home news" on public.home_news;
create policy "Admins can insert home news"
on public.home_news for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update home news" on public.home_news;
create policy "Admins can update home news"
on public.home_news for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete home news" on public.home_news;
create policy "Admins can delete home news"
on public.home_news for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.home_news to anon, authenticated;
grant insert, update, delete on public.home_news to authenticated;

-- Example seed data. Admins can edit, deactivate, reorder, or delete these rows.
insert into public.home_news (title, subtitle, description, location, image_url, cta_label, display_order, is_active)
values
('Sangardak sharsharasi', 'Yangi marshrut', 'Sariosiyo tog''lari bag''ridagi salqin manzara endi asosiy tavsiyalar ro''yxatida.', 'Sariosiyo tumani', 'https://www.advantour.com/img/uzbekistan/termez/sangardak-waterfall/sangardak-waterfall2.jpg', 'Ko''rish', 1, true),
('Boysun tog''lari', 'Dam olish uchun ochildi', 'Piyoda sayr, toza havo va mahalliy yo''nalishlar uchun yangi tanlangan maskan.', 'Boysun tumani', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200', 'Batafsil', 2, true),
('Kampirtepa xarobalari', 'Tarixiy yangilik', 'Amudaryo bo''yidagi qadimiy shahar xarobalari sayohatchilar uchun qayta tavsiya qilindi.', 'Amudaryo bo''yi', 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Kampyrtepa.jpg', 'Sayohat qilish', 3, true)
on conflict do nothing;

notify pgrst, 'reload schema';
