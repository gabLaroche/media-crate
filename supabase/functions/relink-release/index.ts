import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RelinkPayload {
    collection_id: string;
    discogs_release_id: string | number;
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

async function fetchDiscogs(path: string, token: string) {
    const res = await fetch(`https://api.discogs.com${path}`, {
        headers: {
            Authorization: `Discogs token=${token}`,
            "User-Agent": "CDCollectionApp/1.0",
        },
    });
    if (!res.ok) return null;
    return res.json();
}

function formatArtists(artists: { name: string; join?: string }[] | undefined) {
    if (!artists?.length) return "";
    return artists
        .map(
            (a, i) => a.name + (i < artists.length - 1 ? ` ${a.join || "&"} ` : ""),
        )
        .join("");
}

// "mm:ss" or "h:mm:ss" -> seconds; blank/malformed tracks (indexes, headings) contribute null.
function parseDuration(duration: string | undefined) {
    if (!duration) return null;
    const parts = duration.split(":").map(Number);
    if (parts.some((p) => Number.isNaN(p))) return null;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return json({ error: "Method not allowed" }, 405);
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return json({ error: "Missing Authorization header" }, 401);
        }

        const authRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
            },
        });
        if (!authRes.ok) {
            return json({ error: "Unauthorized" }, 401);
        }
        const user = await authRes.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } },
        );

        const body: RelinkPayload = await req.json();
        const discogsReleaseId = Number(body.discogs_release_id);

        if (!body.collection_id || !Number.isInteger(discogsReleaseId) || discogsReleaseId <= 0) {
            return json({ error: "collection_id and a numeric discogs_release_id are required" }, 400);
        }

        // Confirm the collection row is this user's before doing any work.
        const { data: collectionRow, error: collectionErr } = await supabase
            .from("collections")
            .select("id")
            .eq("id", body.collection_id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (collectionErr || !collectionRow) {
            return json({ error: "Collection item not found" }, 404);
        }

        const discogsToken = Deno.env.get("DISCOGS_TOKEN");
        if (!discogsToken) {
            return json({ error: "Server misconfiguration" }, 500);
        }

        // Reuse an existing release row already linked to this exact Discogs
        // release (e.g. another user already linked the same pressing)
        // instead of creating a duplicate.
        const { data: existingRelease } = await supabase
            .from("releases")
            .select("id")
            .eq("discogs_master_id", discogsReleaseId)
            .eq("discogs_type", "release")
            .maybeSingle();

        let releaseId: string;

        if (existingRelease) {
            releaseId = existingRelease.id;
        } else {
            const discogsRelease = await fetchDiscogs(`/releases/${discogsReleaseId}`, discogsToken);
            if (!discogsRelease) {
                return json({ error: "Release not found on Discogs" }, 404);
            }

            const tracklist = Array.isArray(discogsRelease.tracklist)
                ? discogsRelease.tracklist.map((t: { position?: string; title?: string; duration?: string }) => ({
                      position: t.position ?? "",
                      title: t.title ?? "",
                      duration_seconds: parseDuration(t.duration),
                  }))
                : [];

            const durationSeconds = tracklist.reduce(
                (sum: number, t: { duration_seconds: number | null }) => sum + (t.duration_seconds ?? 0),
                0,
            );

            const coverImage = discogsRelease.images?.[0]?.uri ?? null;
            let artworkId: string | null = null;

            if (coverImage) {
                const { data: artworkRow, error: artworkErr } = await supabase
                    .from("artworks")
                    .insert({ url: coverImage, owner_user_id: user.id })
                    .select("id")
                    .single();

                if (artworkErr) {
                    return json({ error: `artwork_error: ${artworkErr.message}` }, 500);
                }
                artworkId = artworkRow.id;
            }

            const { data: newRelease, error: releaseErr } = await supabase
                .from("releases")
                .insert({
                    title: discogsRelease.title ?? "",
                    artist: formatArtists(discogsRelease.artists) || "Unknown",
                    year: discogsRelease.year ?? null,
                    discogs_master_id: discogsReleaseId,
                    discogs_type: "release",
                    artwork_id: artworkId,
                    genres: discogsRelease.genres?.length ? discogsRelease.genres : null,
                    styles: discogsRelease.styles?.length ? discogsRelease.styles : null,
                    duration_seconds: durationSeconds > 0 ? durationSeconds : null,
                    tracklist: tracklist.length ? tracklist : null,
                })
                .select("id")
                .single();

            if (releaseErr) {
                return json({ error: `release_error: ${releaseErr.message}` }, 500);
            }
            releaseId = newRelease.id;
        }

        const { error: updateErr } = await supabase
            .from("collections")
            .update({ release_id: releaseId })
            .eq("id", body.collection_id)
            .eq("user_id", user.id);

        if (updateErr) {
            return json({ error: `collection_error: ${updateErr.message}` }, 500);
        }

        return json({ success: true, release_id: releaseId });
    } catch (err) {
        return json({ error: String(err) }, 500);
    }
});
