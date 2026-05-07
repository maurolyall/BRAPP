-- ============================================================
-- Migration 015 — Support chat (user ↔ any admin)
-- ============================================================

create table if not exists support_messages (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  sender_id  uuid        not null references profiles(id) on delete cascade,
  content    text        not null,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table support_messages enable row level security;

create index if not exists idx_support_messages_user_id    on support_messages(user_id);
create index if not exists idx_support_messages_created_at on support_messages(created_at desc);

-- The user can read their own thread
create policy "User can read own support messages"
  on support_messages for select
  using (auth.uid() = user_id);

-- Admins can read any support thread
create policy "Admins can read all support messages"
  on support_messages for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Users can insert into their own thread
create policy "User can send support message"
  on support_messages for insert
  with check (auth.uid() = sender_id and auth.uid() = user_id);

-- Admins can insert into any thread (reply)
create policy "Admins can reply to support messages"
  on support_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Enable realtime
alter publication supabase_realtime add table support_messages;
