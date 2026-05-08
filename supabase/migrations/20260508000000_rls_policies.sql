-- RLS policies for all user-owned tables.
-- Apply in Supabase Dashboard > SQL Editor, or via: supabase db push

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    is_public = true OR auth.uid() = id
  );

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- COLLECTIONS
-- ============================================================
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Owners always see their own; public profiles' collections are visible to everyone.
DROP POLICY IF EXISTS "collections_select" ON collections;
CREATE POLICY "collections_select" ON collections
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = collections.user_id
        AND profiles.is_public = true
    )
  );

DROP POLICY IF EXISTS "collections_insert" ON collections;
CREATE POLICY "collections_insert" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "collections_update" ON collections;
CREATE POLICY "collections_update" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "collections_delete" ON collections;
CREATE POLICY "collections_delete" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RELEASES (shared public music metadata, no user ownership)
-- ============================================================
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "releases_select" ON releases;
CREATE POLICY "releases_select" ON releases
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "releases_insert" ON releases;
CREATE POLICY "releases_insert" ON releases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- ARTWORKS (uploaded by users; images are public once stored)
-- ============================================================
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artworks_select" ON artworks;
CREATE POLICY "artworks_select" ON artworks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "artworks_insert" ON artworks;
CREATE POLICY "artworks_insert" ON artworks
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "artworks_update" ON artworks;
CREATE POLICY "artworks_update" ON artworks
  FOR UPDATE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "artworks_delete" ON artworks;
CREATE POLICY "artworks_delete" ON artworks
  FOR DELETE USING (auth.uid() = owner_user_id);

-- ============================================================
-- SOURCES (per-user acquisition sources)
-- ============================================================
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sources_owner" ON sources;
CREATE POLICY "sources_owner" ON sources
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- DEVICES
-- ============================================================
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devices_owner" ON devices;
CREATE POLICY "devices_owner" ON devices
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE: artworks bucket
-- Run these separately in Dashboard > Storage > Policies
-- if they are not already configured.
-- ============================================================
-- INSERT: (auth.uid()::text) = (storage.foldername(name))[1]
-- SELECT: true  (public CDN bucket)
-- DELETE: (auth.uid()::text) = (storage.foldername(name))[1]
