import { createClient } from "npm:@supabase/supabase-js@2";

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
