-- Supabase Tickets Table
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

-- RLS Policies
alter table public.tickets enable row level security;

create policy "Users can view their own tickets"
  on public.tickets for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tickets"
  on public.tickets for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tickets"
  on public.tickets for update
  using ( auth.uid() = user_id );
