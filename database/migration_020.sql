-- ============================================================
-- Migration 020 — Conversaciones dentro del chat de soporte
--
-- Hasta ahora `support_messages` era un único hilo infinito por usuario: al
-- tocar un servicio se abría el chat con TODO el historial viejo arriba del
-- pedido nuevo. Cada entrada desde la grilla de servicios ahora arranca una
-- conversación nueva, identificada por `conversation_id`.
--
-- La columna es nullable a propósito: los mensajes existentes quedan como
-- "hilo histórico" (conversation_id null) y no se muestran en las
-- conversaciones nuevas.
-- ============================================================

alter table support_messages add column if not exists conversation_id uuid;

-- El listado siempre pide "los mensajes de esta conversación, en orden".
create index if not exists idx_support_messages_conversation
  on support_messages(user_id, conversation_id, created_at);
