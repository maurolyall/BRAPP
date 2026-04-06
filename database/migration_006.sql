-- ============================================================
-- MIGRATION 006
-- - Remove services table and service_id from bookings
--   (flow is: client requests → providers apply, no service catalog)
-- Run this in your Supabase SQL editor AFTER migration_005.sql
-- ============================================================

-- Drop service_id from bookings (already nullable after migration_005)
alter table bookings drop column if exists service_id;

-- Drop services table
drop table if exists services cascade;
