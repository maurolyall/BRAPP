-- ============================================================
-- MIGRATION 008
-- - Allow providers to view open bookings in their service categories
-- Run this in your Supabase SQL editor AFTER migration_007.sql
-- ============================================================

-- Providers can see bookings with status 'searching' in their categories
create policy "Providers can view requests in their categories"
  on bookings for select
  using (
    status = 'searching'
    and exists (
      select 1 from provider_categories
      where provider_categories.provider_id = auth.uid()
        and provider_categories.category_id = bookings.category_id
    )
  );
