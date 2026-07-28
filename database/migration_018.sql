-- ============================================================
-- Migration 018 — Support chat: adjuntos (imágenes y PDFs) vía socket MoP
-- Ver: MoP-Socket-Adjuntos-BotonRojo.pdf
-- ============================================================

-- Adjuntos del mensaje. Array JSON con la forma:
--   [{ "type": "image" | "file", "url": "...", "mime": "...", "filename": "..." }]
alter table support_messages add column if not exists attachments jsonb;

-- Id del evento de MoP — dedupe de mensajes reenviados en reconexiones.
alter table support_messages add column if not exists mop_event_id text;

create unique index if not exists idx_support_messages_mop_event_id
  on support_messages(mop_event_id)
  where mop_event_id is not null;

-- Un mensaje puede ser solo adjunto (sin texto).
alter table support_messages alter column content set default '';

-- ------------------------------------------------------------
-- Storage: adjuntos que manda el usuario desde la app.
-- MoP guarda los suyos y nos devuelve URLs públicas; los nuestros
-- los subimos acá para poder pintarlos en el hilo del usuario.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments', 'support-attachments', true, 6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

-- Lectura pública (el bucket es público; la URL lleva el uuid del mensaje).
drop policy if exists "Public read support attachments" on storage.objects;
create policy "Public read support attachments"
  on storage.objects for select
  using (bucket_id = 'support-attachments');

-- La subida la hace el service role desde /api/support/message (bypassea RLS).
