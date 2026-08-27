// One-off backfill for releases added before genres/styles/duration_seconds
// existed (see migration 20260826000000_add_genre_duration_to_releases.sql).
// Fetches genre/style tags and total track duration from Discogs for every
// release that has a discogs_master_id but is still missing that data.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://your-project.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="..."
//   $env:DISCOGS_TOKEN="..."
//   node scripts/backfill-genre-duration.mjs
//
// Requires the service role key because `releases` has no RLS UPDATE policy
// for regular users. Throttled to stay under Discogs' 60 req/min
// authenticated rate limit (each row costs 1-2 requests).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DISCOGS_TOKEN) {
    console.error(
        "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DISCOGS_TOKEN env vars.",
    );
    process.exit(1);
}

const REQUEST_DELAY_MS = 1100;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchDiscogs(path) {
    const res = await fetch(`https://api.discogs.com${path}`, {
        headers: {
            Authorization: `Discogs token=${DISCOGS_TOKEN}`,
            "User-Agent": "CDCollectionApp/1.0 (backfill script)",
        },
    });
    await sleep(REQUEST_DELAY_MS);
    if (!res.ok) return null;
    return res.json();
}

// "mm:ss" or "h:mm:ss" -> seconds; blank/malformed tracks (indexes, headings) contribute 0.
function parseDuration(duration) {
    if (!duration) return 0;
    const parts = duration.split(":").map(Number);
    if (parts.some((p) => Number.isNaN(p))) return 0;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
}

async function resolveGenreAndDuration(discogsMasterId, discogsType) {
    let genres = [];
    let styles = [];
    let releaseId = discogsMasterId;

    if (discogsType === "release") {
        const release = await fetchDiscogs(`/releases/${discogsMasterId}`);
        if (!release) return null;
        genres = release.genres ?? [];
        styles = release.styles ?? [];
    } else {
        const master = await fetchDiscogs(`/masters/${discogsMasterId}`);
        if (!master) return null;
        genres = master.genres ?? [];
        styles = master.styles ?? [];
        if (!master.main_release) {
            return { genres, styles, durationSeconds: null };
        }
        releaseId = master.main_release;
    }

    const release = await fetchDiscogs(`/releases/${releaseId}`);
    const durationSeconds = Array.isArray(release?.tracklist)
        ? release.tracklist.reduce(
              (sum, t) => sum + parseDuration(t.duration),
              0,
          )
        : 0;

    return {
        genres,
        styles,
        durationSeconds: durationSeconds > 0 ? durationSeconds : null,
    };
}

async function main() {
    const { data: rows, error } = await supabase
        .from("releases")
        .select("id, discogs_master_id, discogs_type")
        .not("discogs_master_id", "is", null)
        .or("genres.is.null,duration_seconds.is.null");

    if (error) {
        console.error("Failed to fetch releases:", error.message);
        process.exit(1);
    }

    console.log(`Backfilling ${rows.length} release(s)...`);

    let updated = 0;
    let failed = 0;

    for (const [i, row] of rows.entries()) {
        const label = `[${i + 1}/${rows.length}] release ${row.id}`;
        try {
            const result = await resolveGenreAndDuration(
                row.discogs_master_id,
                row.discogs_type,
            );
            if (!result) {
                console.warn(`${label}: not found on Discogs, skipping.`);
                failed++;
                continue;
            }

            const { error: updateErr } = await supabase
                .from("releases")
                .update({
                    genres: result.genres.length ? result.genres : null,
                    styles: result.styles.length ? result.styles : null,
                    duration_seconds: result.durationSeconds,
                })
                .eq("id", row.id);

            if (updateErr) {
                console.error(`${label}: update failed - ${updateErr.message}`);
                failed++;
                continue;
            }

            console.log(`${label}: ok`);
            updated++;
        } catch (err) {
            console.error(`${label}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone. Updated ${updated}, failed ${failed}.`);
}

main();
