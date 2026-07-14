-- Distinguishes whether releases.discogs_master_id holds a Discogs *master*
-- ID or a plain *release* ID. Standalone releases with no master group fall
-- back to their own release ID, and /master/{id} vs /release/{id} URLs are
-- not interchangeable - without this we can't build a working Discogs link.
-- Apply in Supabase Dashboard > SQL Editor.

ALTER TABLE releases ADD COLUMN discogs_type text;

-- Existing rows predate this column; the vast majority of previously stored
-- IDs are master IDs (search always used type=master), so default those.
UPDATE releases SET discogs_type = 'master' WHERE discogs_master_id IS NOT NULL;
