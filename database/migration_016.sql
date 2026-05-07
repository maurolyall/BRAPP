-- ============================================================
-- Migration 016 — Stories (admin-uploaded, Instagram-style)
-- ============================================================

create table if not exists stories (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  image_url    text        not null,
  -- optional link when user taps the story
  link_url     text,
  -- who uploaded (always admin for now)
  created_by   uuid        not null references profiles(id) on delete cascade,
  -- ordering
  sort_order   integer     not null default 0,
  active       boolean     not null default true,
  -- auto-expire after this timestamp (null = never)
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table stories enable row level security;

create index if not exists idx_stories_active     on stories(active);
create index if not exists idx_stories_sort_order on stories(sort_order);

-- Anyone authenticated can read active stories
create policy "Authenticated users can read active stories"
  on stories for select
  using (
    auth.role() = 'authenticated'
    and active = true
    and (expires_at is null or expires_at > now())
  );

-- Only admins can insert
create policy "Admins can insert stories"
  on stories for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can update
create policy "Admins can update stories"
  on stories for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can delete
create policy "Admins can delete stories"
  on stories for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- Story views (to track which users already saw each story)
-- ============================================================

create table if not exists story_views (
  story_id   uuid not null references stories(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (story_id, user_id)
);

alter table story_views enable row level security;

create policy "Users can insert own views"
  on story_views for insert
  with check (auth.uid() = user_id);

create policy "Users can read own views"
  on story_views for select
  using (auth.uid() = user_id);

create policy "Admins can read all views"
  on story_views for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Storage bucket for stories images (run separately in Supabase dashboard or via API):
-- insert into storage.buckets (id, name, public) values ('stories', 'stories', true);
-- create policy "Public read stories" on storage.objects for select using (bucket_id = 'stories');
-- create policy "Admin upload stories" on storage.objects for insert with check (bucket_id = 'stories' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
-- create policy "Admin delete stories" on storage.objects for delete using (bucket_id = 'stories' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
