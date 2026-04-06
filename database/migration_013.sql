-- ============================================================
-- migration_013: Replace coordinated_date with coordinated_dates (array)
-- Allows clients to propose multiple preferred dates
-- ============================================================

-- Drop the single-date column added in migration_012 (if it was run)
alter table bookings
  drop column if exists coordinated_date;

-- Add the array column
alter table bookings
  add column if not exists coordinated_dates date[];
