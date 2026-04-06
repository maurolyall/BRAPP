-- ============================================================
-- migration_011: Add booking_id to messages
-- Scope chat messages to a specific booking/solicitud
-- ============================================================

-- 1. Add booking_id column
alter table messages
  add column if not exists booking_id uuid references bookings(id) on delete cascade;

-- 2. Index for fast per-booking queries
create index if not exists idx_messages_booking_id on messages(booking_id);

-- 3. Drop old sender/receiver-based RLS policies
drop policy if exists "Users can read their messages"  on messages;
drop policy if exists "Users can send messages"         on messages;
drop policy if exists "Receiver can mark as read"       on messages;

-- 4. New policies scoped to booking participants
create policy "Booking participants can read messages"
  on messages for select
  using (
    exists (
      select 1 from bookings
      where bookings.id = messages.booking_id
        and (bookings.user_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

create policy "Booking participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from bookings
      where bookings.id = booking_id
        and (bookings.user_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

create policy "Receiver can mark as read"
  on messages for update
  using (auth.uid() = receiver_id);
