import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
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

    const url = new URL(req.url);
    const count = Math.min(parseInt(url.searchParams.get("count") ?? "1"), 50);

    const { data: entries, error } = await supabase
      .from("collections")
      .select(`
        id,
        user_id,
        release_id,
        condition,
        notes,
        source_id,
        acquired_date,
        media_type,
        exclude_from_randomizer,
        created_at,
        releases (
          id,
          title,
          artist,
          year,
          discogs_master_id,
          discogs_type,
          artworks ( id, url, file_path )
        )
      `)
      .eq("user_id", user.id)
      .eq("exclude_from_randomizer", false);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fisher-Yates shuffle, then slice
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const results = shuffled.slice(0, count);

    return new Response(JSON.stringify({ results, total_eligible: entries.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
