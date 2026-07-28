-- ============================================================
-- Migration 019 — Preparación para espejar órdenes de MoP
--
-- No activa nada por sí sola: deja la base lista para el listener de
-- `mop.order.*`, que se implementa cuando MoP confirme la forma real del
-- payload (el catálogo en /v1/events/catalog no coincide con lo que
-- efectivamente llega por el socket).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Vínculo entre bookings y las órdenes de MoP
-- ------------------------------------------------------------
alter table bookings add column if not exists mop_order_id     text;
alter table bookings add column if not exists mop_order_number text;  -- ej. BR-00042
alter table bookings add column if not exists mop_status       text;  -- estado operativo de MoP, separado del status de negocio
alter table bookings add column if not exists mop_source       text;  -- whatsapp | api | manual | socket

-- Idempotencia: el socket reenvía eventos en reconexiones, y un mismo
-- mop.order.created no debe generar dos bookings.
create unique index if not exists idx_bookings_mop_order_id
  on bookings(mop_order_id)
  where mop_order_id is not null;

create index if not exists idx_bookings_mop_status
  on bookings(mop_status)
  where mop_status is not null;

-- ------------------------------------------------------------
-- 2. Clave canónica de teléfono, para resolver a qué usuario pertenece
--    una orden cuando el evento NO trae externalUserId.
--
--    Los últimos 10 dígitos son el número nacional significativo: idénticos
--    con o sin el `9` de móvil, que WhatsApp/MoP no siempre incluyen
--    (`5411...` vs `54911...`). Equivale a arPhoneKey() en lib/phone.ts.
-- ------------------------------------------------------------
alter table profiles add column if not exists phone_key text
  generated always as (
    nullif(right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10), '')
  ) stored;

create index if not exists idx_profiles_phone_key on profiles(phone_key);

-- OJO: el match por teléfono solo es confiable si el número es único. Hoy hay
-- perfiles que comparten teléfono (cuentas de prueba). Antes de habilitar el
-- fallback por phone_key hay que limpiarlos y evaluar un índice único:
--
--   select phone_key, count(*) from profiles
--   where phone_key is not null group by phone_key having count(*) > 1;
--
--   -- una vez sin duplicados:
--   -- create unique index idx_profiles_phone_key_unique
--   --   on profiles(phone_key) where phone_key is not null;
