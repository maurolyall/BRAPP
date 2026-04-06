-- ============================================================
-- MIGRATION 005
-- - Redesign bookings table for client service requests
-- Run this in your Supabase SQL editor AFTER migration_004.sql
-- ============================================================

-- Make service_id, provider_id, and date nullable
alter table bookings
  alter column service_id   drop not null,
  alter column provider_id  drop not null,
  alter column date         drop not null;

-- Add new fields
alter table bookings
  add column if not exists category_id    uuid references service_categories(id),
  add column if not exists description    text,
  add column if not exists image_url      text,
  add column if not exists scheduled_date text,
  add column if not exists payment_method text,
  add column if not exists address        text;

-- Add constraints (drop first in case they exist)
alter table bookings
  drop constraint if exists bookings_scheduled_date_check,
  drop constraint if exists bookings_payment_method_check;

alter table bookings
  add constraint bookings_scheduled_date_check
    check (scheduled_date is null or scheduled_date in ('today', 'coordinate')),
  add constraint bookings_payment_method_check
    check (payment_method is null or payment_method in ('coordinate', 'prepaid'));

-- Update status to include 'searching' as initial state
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings
  add constraint bookings_status_check
    check (status in ('searching', 'pending', 'confirmed', 'completed', 'cancelled'));

alter table bookings alter column status set default 'searching';

-- Storage bucket for booking images
-- Run this separately in the SQL editor or create via Supabase Dashboard:
-- insert into storage.buckets (id, name, public)
--   values ('booking-images', 'booking-images', true)
--   on conflict (id) do nothing;
