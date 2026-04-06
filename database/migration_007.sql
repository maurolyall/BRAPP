-- Tabla de ofertas de proveedores para solicitudes
create table if not exists booking_offers (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  provider_id  uuid not null references profiles(id) on delete cascade,
  message      text,
  price        numeric(10, 2),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  unique (booking_id, provider_id)
);

alter table booking_offers enable row level security;

-- El cliente dueño de la solicitud puede ver las ofertas
create policy "client can view own booking offers"
  on booking_offers for select
  using (
    exists (
      select 1 from bookings
      where bookings.id = booking_offers.booking_id
        and bookings.user_id = auth.uid()
    )
  );

-- El proveedor puede insertar su oferta
create policy "provider can insert offer"
  on booking_offers for insert
  with check (provider_id = auth.uid());

-- El proveedor puede ver su propia oferta
create policy "provider can view own offer"
  on booking_offers for select
  using (provider_id = auth.uid());

-- El proveedor puede actualizar su propia oferta (mientras esté pending)
create policy "provider can update own pending offer"
  on booking_offers for update
  using (provider_id = auth.uid() and status = 'pending');
