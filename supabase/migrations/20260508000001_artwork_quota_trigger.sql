-- Keeps profiles.used_bytes accurate automatically.
-- Apply in Supabase Dashboard > SQL Editor.

-- Trigger function: increment on INSERT, decrement on DELETE.
-- COALESCE guards against NULL size_bytes (URL-only artwork rows have no size).
CREATE OR REPLACE FUNCTION update_profile_used_bytes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET used_bytes = used_bytes + COALESCE(NEW.size_bytes, 0)
    WHERE id = NEW.owner_user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET used_bytes = GREATEST(0, used_bytes - COALESCE(OLD.size_bytes, 0))
    WHERE id = OLD.owner_user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS artworks_quota_trigger ON artworks;
CREATE TRIGGER artworks_quota_trigger
  AFTER INSERT OR DELETE ON artworks
  FOR EACH ROW EXECUTE FUNCTION update_profile_used_bytes();

-- Backfill used_bytes for any artworks already in the database.
UPDATE profiles p
SET used_bytes = COALESCE(
  (
    SELECT SUM(a.size_bytes)
    FROM artworks a
    WHERE a.owner_user_id = p.id
      AND a.size_bytes IS NOT NULL
  ),
  0
);
