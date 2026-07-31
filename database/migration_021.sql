-- ============================================================
-- Migration 021 — Actualizar constraints de bookings
--
-- Amplía payment_method para aceptar 'cash' y 'card' (nuevos
-- valores del UI), y elimina la restricción fija de scheduled_date
-- para aceptar fechas ISO y franjas horarias libres.
-- ============================================================

alter table bookings
  drop constraint if exists bookings_payment_method_check,
  drop constraint if exists bookings_scheduled_date_check;

alter table bookings
  add constraint bookings_payment_method_check
    check (payment_method is null or payment_method in ('cash', 'card', 'coordinate', 'prepaid'));
