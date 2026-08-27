-- Adds genre/style tags and total track duration captured from Discogs at
-- add-time, powering the "Top genres" and "Total & average album length"
-- stats. Existing rows predate these columns and are backfilled separately
-- via scripts/backfill-genre-duration.mjs (Discogs API calls can't run
-- inside a SQL migration).
-- Apply in Supabase Dashboard > SQL Editor.

ALTER TABLE releases ADD COLUMN genres text[];
ALTER TABLE releases ADD COLUMN styles text[];
ALTER TABLE releases ADD COLUMN duration_seconds integer;
