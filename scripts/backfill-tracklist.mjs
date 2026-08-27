// One-off backfill for releases added before the tracklist column existed
// (see migration 20260828000000_add_tracklist_to_releases.sql). Fetches the
// per-track position/title/duration from Discogs for every release that has
// a discogs_master_id but is still missing a tracklist.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://your-project.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="..."
//   $env:DISCOGS_TOKEN="..."
//   node scripts/backfill-tracklist.mjs
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

// "mm:ss" or "h:mm:ss" -> seconds; blank/malformed tracks (indexes, headings) contribute null.
function parseDuration(duration) {
    if (!duration) return null;
    const parts = duration.split(":").map(Number);
    if (parts.some((p) => Number.isNaN(p))) return null;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
}

// Master objects carry genres/styles but not a tracklist - only a *release*
// does, and a master's own id isn't a release id. Resolve via main_release.
async function resolveTracklist(discogsMasterId, discogsType) {
    let releaseId = discogsMasterId;

    if (discogsType !== "release") {
        const master = await fetchDiscogs(`/masters/${discogsMasterId}`);
        if (!master) return null;
        if (!master.main_release) return [];
        releaseId = master.main_release;
    }

    const release = await fetchDiscogs(`/releases/${releaseId}`);
    if (!release) return null;
    if (!Array.isArray(release.tracklist)) return [];

    return release.tracklist.map((t) => ({
        position: t.position ?? "",
        title: t.title ?? "",
        duration_seconds: parseDuration(t.duration),
    }));
}

async function main() {
    const { data: rows, error } = await supabase
        .from("releases")
        .select("id, discogs_master_id, discogs_type")
        .not("discogs_master_id", "is", null)
        .is("tracklist", null);

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
            const tracklist = await resolveTracklist(
                row.discogs_master_id,
                row.discogs_type,
            );

            if (tracklist === null) {
                console.warn(`${label}: not found on Discogs, skipping.`);
                failed++;
                continue;
            }

            const { error: updateErr } = await supabase
                .from("releases")
                .update({ tracklist: tracklist.length ? tracklist : null })
                .eq("id", row.id);

            if (updateErr) {
                console.error(`${label}: update failed - ${updateErr.message}`);
                failed++;
                continue;
            }

            console.log(`${label}: ok (${tracklist.length} track(s))`);
            updated++;
        } catch (err) {
            console.error(`${label}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone. Updated ${updated}, failed ${failed}.`);
}

main();
