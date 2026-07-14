import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ReleaseInput {
    title: string;
    artist: string;
    year?: number;
    acquired_date?: string;
    discogs_master_id?: number;
    discogs_type?: string;
    artwork_url?: string;
    condition?: string;
    notes?: string;
    source_id?: string;
    media_type?: string;
}

interface BulkAddPayload {
    releases: ReleaseInput[];
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Verify user via their JWT directly against GoTrue - supabase-js's
        // auth.getUser() with no argument reads a persisted session from client
        // storage, which doesn't exist in a stateless edge function, and always
        // fails with "Auth session missing!" regardless of the bearer token.
        const authRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
            },
        });
        if (!authRes.ok) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        const user = await authRes.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const body: BulkAddPayload = await req.json();

        if (!Array.isArray(body.releases) || body.releases.length === 0) {
            return new Response(
                JSON.stringify({ error: "Payload must include a non-empty 'releases' array" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const results: { release_id: string; collection_id: string; title: string; status: string }[] = [];

        for (const item of body.releases) {
            // --- 1. Check if release already exists by discogs_master_id ---
            let releaseId: string | null = null;

            if (item.discogs_master_id) {
                const { data: existing } = await supabase
                    .from("releases")
                    .select("id")
                    .eq("discogs_master_id", item.discogs_master_id)
                    .maybeSingle();

                if (existing) releaseId = existing.id;
            }

            // --- 2. If release doesn't exist, handle artwork then insert release ---
            if (!releaseId) {
                let artworkId: string | null = null;

                if (item.artwork_url) {
                    const { data: artworkRow, error: artworkErr } = await supabase
                        .from("artworks")
                        .insert({ url: item.artwork_url, owner_user_id: user.id })
                        .select("id")
                        .single();

                    if (artworkErr) {
                        results.push({ release_id: "", collection_id: "", title: item.title, status: `artwork_error: ${artworkErr.message}` });
                        continue;
                    }
                    artworkId = artworkRow.id;
                }

                const { data: newRelease, error: releaseErr } = await supabase
                    .from("releases")
                    .insert({
                        title: item.title,
                        artist: item.artist.trim(),
                        year: item.year ?? null,
                        discogs_master_id: item.discogs_master_id ?? null,
                        discogs_type: item.discogs_type ?? null,
                        artwork_id: artworkId,
                    })
                    .select("id")
                    .single();

                if (releaseErr) {
                    results.push({ release_id: "", collection_id: "", title: item.title, status: `release_error: ${releaseErr.message}` });
                    continue;
                }
                releaseId = newRelease.id;
            }

            // --- 3. Add to user's collection (skip if already present) ---
            const { data: existingEntry } = await supabase
                .from("collections")
                .select("id")
                .eq("user_id", user.id)
                .eq("release_id", releaseId)
                .maybeSingle();

            if (existingEntry) {
                results.push({ release_id: releaseId, collection_id: existingEntry.id, title: item.title, status: "already_in_collection" });
                continue;
            }

            const { data: collectionEntry, error: collErr } = await supabase
                .from("collections")
                .insert({
                    user_id: user.id,
                    release_id: releaseId,
                    condition: item.condition ?? null,
                    notes: item.notes ?? null,
                    source_id: item.source_id ?? null,
                    media_type: item.media_type ?? null,
                    acquired_date: item.acquired_date ?? null,
                })
                .select("id")
                .single();

            if (collErr) {
                results.push({ release_id: releaseId, collection_id: "", title: item.title, status: `collection_error: ${collErr.message}` });
                continue;
            }

            results.push({ release_id: releaseId, collection_id: collectionEntry.id, title: item.title, status: "added" });
        }

        const added = results.filter(r => r.status === "added").length;
        const skipped = results.filter(r => r.status === "already_in_collection").length;
        const failed = results.filter(r => r.status.includes("error")).length;

        return new Response(
            JSON.stringify({ summary: { added, skipped, failed }, results }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});