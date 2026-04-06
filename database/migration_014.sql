-- ============================================================
-- Migration 014 — Fix profiles visibility and category access
-- ============================================================

-- Portada/Profiles: Make basic profile info readable by any authenticated user
drop policy if exists "Users can read own profile" on profiles;
create policy "Authenticated users can read basic profiles"
  on profiles for select
  to authenticated
  using (true);

-- Ensure categorized items are also readable (should be covered by existing policies)
-- But we can reinforce it if needed.
