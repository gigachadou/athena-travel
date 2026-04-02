-- Supabase Tickets Table
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_id text unique not null, -- Real ticket ID (e.g. AF-123456)
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
  passport_number text, -- Real ID requirement
  birth_date date,      -- Real ID requirement
  gender text,          -- Real ID requirement
  status text default 'checking', -- kutilmoqda(pending), tekshirilmoqda(checking), bajarilgan(completed), rad etilgan(rejected)
  total_price numeric not null,
  seat text,
  train text,
  coach text,
  platform text,
  depart_time text,
  arrival_time text,
  ticket_class text,
  qr_code_data text,
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
