-- ============================================================
-- MIGRATION 009
-- - Allow authenticated users to read basic profile info of others
--   (needed for showing user info in provider's booking request cards)
-- Run this in your Supabase SQL editor AFTER migration_008.sql
-- ============================================================

create policy "Authenticated users can read any profile"
  on profiles for select
  using (auth.uid() is not null);
