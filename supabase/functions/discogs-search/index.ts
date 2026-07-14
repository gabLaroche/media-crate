import { createClient } from "npm:@supabase/supabase-js@2";

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

function normalizeMaster(master: any) {
  return {
    id: master.id,
    title: `${formatArtists(master.artists)} - ${master.title}`,
    year: master.year || null,
    cover_image: master.images?.[0]?.uri ?? null,
    country: null,
  };
}

function normalizeRelease(release: any) {
  return {
    id: release.master_id || release.id,
    title: `${formatArtists(release.artists)} - ${release.title}`,
    year: release.year || null,
    cover_image: release.images?.[0]?.uri ?? null,
    country: release.country || null,
  };
}

async function lookupDiscogsId(
  id: string,
  type: string | null,
  token: string,
) {
  if (type === "master") {
    const master = await fetchDiscogs(`/masters/${id}`, token);
    if (!master) return { error: "Not found" };
    return { results: [normalizeMaster(master)] };
  }

  if (type === "release") {
    const release = await fetchDiscogs(`/releases/${id}`, token);
    if (!release) return { error: "Not found" };
    return { results: [normalizeRelease(release)] };
  }

  const master = await fetchDiscogs(`/masters/${id}`, token);
  if (master) return { results: [normalizeMaster(master)] };

  const release = await fetchDiscogs(`/releases/${id}`, token);
  if (release) return { results: [normalizeRelease(release)] };

  return { error: "Not found" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { error: authError } = await supabase.auth.getUser();
  if (authError) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const discogsToken = Deno.env.get("DISCOGS_TOKEN");
  if (!discogsToken) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);

  const lookupId = url.searchParams.get("lookup_id");
  if (lookupId) {
    const lookupType = url.searchParams.get("lookup_type");
    const result = await lookupDiscogsId(lookupId, lookupType, discogsToken);
    return new Response(JSON.stringify(result), {
      status: result.error ? 404 : 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const params = new URLSearchParams();
  params.set("type", url.searchParams.get("type") ?? "master");
  params.set("page", url.searchParams.get("page") ?? "1");
  params.set("per_page", url.searchParams.get("per_page") ?? "50");

  const artist = url.searchParams.get("artist");
  const releaseTitle = url.searchParams.get("release_title");
  if (artist) params.set("artist", artist);
  if (releaseTitle) params.set("release_title", releaseTitle);

  const discogsRes = await fetch(
    `https://api.discogs.com/database/search?${params}`,
    {
      headers: {
        Authorization: `Discogs token=${discogsToken}`,
        "User-Agent": "CDCollectionApp/1.0",
      },
    },
  );

  const data = await discogsRes.json();

  return new Response(JSON.stringify(data), {
    status: discogsRes.ok ? 200 : discogsRes.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
