-- ============================================================
-- migration_012: Add coordinated_date to bookings
-- Stores the specific date selected when scheduled_date = 'coordinate'
-- ============================================================

alter table bookings
  add column if not exists coordinated_date date;
