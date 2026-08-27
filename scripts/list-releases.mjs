// One-off lookup: prints title/artist for a list of release IDs.
// Usage: node --env-file=scripts/backfill.env.local scripts/list-releases.mjs <id> [id...]

import { createClient } from "@supabase/supabase-js";

const ids = process.argv.slice(2);
if (!ids.length) {
    console.error(
        "Usage: node --env-file=scripts/backfill.env.local scripts/list-releases.mjs <id> [id...]",
    );
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data, error } = await supabase
    .from("releases")
    .select("id, title, artist, discogs_master_id, discogs_type")
    .in("id", ids);

if (error) {
    console.error(error.message);
    process.exit(1);
}

for (const r of data) {
    console.log(
        `${r.artist} - ${r.title}  (discogs ${r.discogs_type ?? "?"} ${r.discogs_master_id})`,
    );
}
