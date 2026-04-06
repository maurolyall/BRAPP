-- ============================================================
-- MIGRATION 003
-- - Add business_name, dni, cuit to profiles
-- Run this in your Supabase SQL editor AFTER migration_002.sql
-- ============================================================

alter table profiles
  add column if not exists business_name text,
  add column if not exists dni          text,
  add column if not exists cuit         text;
