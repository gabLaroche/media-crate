-- Adds per-track data (position, title, duration) captured from Discogs at
-- add-time. Existing rows predate this column and are backfilled separately
-- via scripts/backfill-tracklist.mjs (Discogs API calls can't run inside a
-- SQL migration).
-- Apply in Supabase Dashboard > SQL Editor.

ALTER TABLE releases ADD COLUMN tracklist jsonb;
