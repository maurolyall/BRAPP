-- ============================================================
-- Migration 017 — Support chat: bot reply support (MoP integration)
-- ============================================================

alter table support_messages add column if not exists is_bot boolean not null default false;

-- Documents intent: service role inserts bot replies server-side (bypasses RLS automatically)
create policy "Service role can insert bot replies"
  on support_messages for insert
  with check (true);
