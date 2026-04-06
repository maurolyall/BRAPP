-- ============================================================
-- MIGRATION 010
-- - Fix missing RLS policies for offer acceptance flow:
--   1. Client can accept an offer on their own booking
--   2. Provider can update own offer regardless of current status
--      (needed for reject: accepted → rejected)
--   3. Provider can reject competing offers when confirming
--      (needed for confirmOffer: set other offers to rejected)
--   4. Provider can read pending bookings where they have an accepted offer
--      (uses security definer function to avoid infinite recursion between
--       bookings ↔ booking_offers RLS policies)
-- Run this in your Supabase SQL editor AFTER migration_009.sql
-- ============================================================

-- Helper function: check if current user has an accepted offer on a booking.
-- security definer bypasses RLS inside, breaking the circular reference:
--   bookings policy → booking_offers → bookings policy → ...
create or replace function public.provider_has_accepted_offer(p_booking_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from booking_offers
    where booking_offers.booking_id = p_booking_id
      and booking_offers.provider_id = auth.uid()
      and booking_offers.status = 'accepted'
  );
$$;

-- 1. Client can accept an offer on their own booking
drop policy if exists "client can accept offer on own booking" on booking_offers;
create policy "client can accept offer on own booking"
  on booking_offers for update
  using (
    exists (
      select 1 from bookings
      where bookings.id = booking_offers.booking_id
        and bookings.user_id = auth.uid()
    )
  );

-- 2. Relax provider update policy to allow updating accepted offers too
--    (needed so provider can reject their own accepted offer)
drop policy if exists "provider can update own pending offer" on booking_offers;
create policy "provider can update own offer"
  on booking_offers for update
  using (provider_id = auth.uid());

-- 3. Provider can reject competing offers when confirming a booking
--    (provider can reject other providers' offers on a booking they have an accepted offer for)
create policy "provider can reject competing offers"
  on booking_offers for update
  using (
    exists (
      select 1 from booking_offers as my_offer
      where my_offer.booking_id = booking_offers.booking_id
        and my_offer.provider_id = auth.uid()
        and my_offer.status = 'accepted'
    )
  );

-- 4. Provider can read pending bookings where they have an accepted offer
--    Uses the security definer function above to avoid infinite recursion.
create policy "provider can view pending booking with accepted offer"
  on bookings for select
  using (
    status = 'pending'
    and public.provider_has_accepted_offer(id)
  );
