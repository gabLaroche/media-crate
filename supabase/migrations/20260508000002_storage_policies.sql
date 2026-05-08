-- Storage RLS policies for the `artworks` bucket.
-- Apply in Supabase Dashboard > SQL Editor.
-- These control who can read/write files in Supabase Storage,
-- separate from the artworks DB table policies.

-- Public read: artwork images are served via public CDN.
DROP POLICY IF EXISTS "artworks_storage_select" ON storage.objects;
CREATE POLICY "artworks_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'artworks');

-- Insert: authenticated users may only upload into their own folder (userId/filename).
DROP POLICY IF EXISTS "artworks_storage_insert" ON storage.objects;
CREATE POLICY "artworks_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artworks'
    AND (auth.uid()::text) = (storage.foldername(name))[1]
  );

-- Update: same ownership check.
DROP POLICY IF EXISTS "artworks_storage_update" ON storage.objects;
CREATE POLICY "artworks_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'artworks'
    AND (auth.uid()::text) = (storage.foldername(name))[1]
  );

-- Delete: users may only delete their own files.
DROP POLICY IF EXISTS "artworks_storage_delete" ON storage.objects;
CREATE POLICY "artworks_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'artworks'
    AND (auth.uid()::text) = (storage.foldername(name))[1]
  );
