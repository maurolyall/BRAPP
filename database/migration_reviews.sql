-- ============================================================
-- Migration: Reviews / Valoraciones
-- Ejecutar en Supabase SQL Editor
-- ============================================================

create table if not exists reviews (
  id          uuid        primary key default uuid_generate_v4(),
  booking_id  uuid        not null references bookings(id) on delete cascade,
  user_id     uuid        not null references profiles(id) on delete cascade,
  stars       integer     not null check (stars between 1 and 5),
  tags        text[]      not null default '{}',
  comment     text,
  anonymous   boolean     not null default false,
  created_at  timestamptz not null default now(),
  unique (booking_id)  -- una sola valoración por reserva
);

alter table reviews enable row level security;

create policy "Users can insert own reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can read own reviews"
  on reviews for select
  using (auth.uid() = user_id);

create policy "Admins can read all reviews"
  on reviews for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists idx_reviews_booking_id on reviews(booking_id);
create index if not exists idx_reviews_user_id    on reviews(user_id);
