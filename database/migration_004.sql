-- ============================================================
-- MIGRATION 004
-- - Add service config fields to provider_categories
-- Run this in your Supabase SQL editor AFTER migration_003.sql
-- ============================================================

alter table provider_categories
  add column if not exists professional_description text,
  add column if not exists visit_price              numeric(10,2),
  add column if not exists labor_warranty           text,
  add column if not exists years_experience         text;

alter table provider_categories
  add constraint chk_visit_price_min
    check (visit_price is null or visit_price >= 30000);

alter table provider_categories
  add constraint chk_labor_warranty
    check (labor_warranty is null or labor_warranty in ('30_dias', '60_dias', '90_dias', '180_dias', '1_año'));

alter table provider_categories
  add constraint chk_years_experience
    check (years_experience is null or years_experience in ('1_año', '1_a_3_años', '3_a_5_años', '5_a_10_años', 'mas_de_10_años'));
