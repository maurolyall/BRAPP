-- ============================================================
-- Botón Rojo — Schema completo
-- Incluye todo: schema base + migration_001 + migration_002
-- Ejecutar en el SQL editor de Supabase (fresh install)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  email          text        not null,
  full_name      text,
  role           text        not null default 'user' check (role in ('user', 'provider', 'admin')),
  avatar_url     text,
  phone          text,
  date_of_birth  date,
  dni            text,
  cuit           text,
  business_name  text,
  city           text,
  address        text,
  floor_apt      text,
  lot            text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup (reads full_name and role from metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SERVICE CATEGORIES (catálogo de rubros)
-- ============================================================
create table if not exists service_categories (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null unique,
  icon_url   text,
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

alter table service_categories enable row level security;

create policy "Anyone can read active service categories"
  on service_categories for select
  using (active = true);

create policy "Admins can manage service categories"
  on service_categories for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Seed
insert into service_categories (name, icon_url) values
  ('Albañil',      '/services/albanil.svg'),
  ('Cerrajero',    '/services/cerrajero.svg'),
  ('Cocinero',     '/services/cocinero.svg'),
  ('Electricista', '/services/electricista.svg')
on conflict (name) do nothing;

-- ============================================================
-- PROVIDER ↔ SERVICE CATEGORIES (many-to-many)
-- ============================================================
create table if not exists provider_categories (
  provider_id              uuid          not null references profiles(id) on delete cascade,
  category_id              uuid          not null references service_categories(id) on delete cascade,
  professional_description text,
  visit_price              numeric(10,2) check (visit_price is null or visit_price >= 30000),
  labor_warranty           text          check (labor_warranty in ('30_dias', '60_dias', '90_dias', '180_dias', '1_año')),
  years_experience         text          check (years_experience in ('1_año', '1_a_3_años', '3_a_5_años', '5_a_10_años', 'mas_de_10_años')),
  created_at               timestamptz   not null default now(),
  primary key (provider_id, category_id)
);

alter table provider_categories enable row level security;

create policy "Anyone can read provider categories"
  on provider_categories for select
  using (true);

create policy "Providers can manage own categories"
  on provider_categories for all
  using (auth.uid() = provider_id);

-- ============================================================
-- SERVICES (servicios individuales ofrecidos por un proveedor)
-- ============================================================
create table if not exists services (
  id          uuid         primary key default uuid_generate_v4(),
  user_id     uuid         not null references profiles(id) on delete cascade,
  title       text         not null,
  description text,
  price       numeric(10,2) not null default 0,
  category    text,
  active      boolean      not null default true,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

alter table services enable row level security;

create policy "Anyone can read active services"
  on services for select
  using (active = true);

create policy "Providers can manage own services"
  on services for all
  using (auth.uid() = user_id);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table if not exists bookings (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  service_id  uuid        not null references services(id) on delete cascade,
  provider_id uuid        not null references profiles(id),
  status      text        not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  date        timestamptz not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table bookings enable row level security;

create policy "Users can read own bookings"
  on bookings for select
  using (auth.uid() = user_id or auth.uid() = provider_id);

create policy "Users can create bookings"
  on bookings for insert
  with check (auth.uid() = user_id);

create policy "Providers can update booking status"
  on bookings for update
  using (auth.uid() = provider_id or auth.uid() = user_id);

-- ============================================================
-- MESSAGES (Real-time ready)
-- ============================================================
create table if not exists messages (
  id          uuid        primary key default uuid_generate_v4(),
  sender_id   uuid        not null references profiles(id) on delete cascade,
  receiver_id uuid        not null references profiles(id) on delete cascade,
  content     text        not null,
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Users can read their messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

create policy "Receiver can mark as read"
  on messages for update
  using (auth.uid() = receiver_id);

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_provider_categories_provider_id  on provider_categories(provider_id);
create index if not exists idx_provider_categories_category_id  on provider_categories(category_id);
create index if not exists idx_services_user_id                 on services(user_id);
create index if not exists idx_bookings_user_id                 on bookings(user_id);
create index if not exists idx_bookings_provider_id             on bookings(provider_id);
create index if not exists idx_messages_sender_id               on messages(sender_id);
create index if not exists idx_messages_receiver_id             on messages(receiver_id);
create index if not exists idx_messages_created_at              on messages(created_at desc);
