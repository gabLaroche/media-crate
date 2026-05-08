import { supabase } from "@/lib/supabase";

export async function searchRelease({ artist, title, page = 1 }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const params = new URLSearchParams({ type: "master", page, per_page: 50 });
  if (artist) params.set("artist", artist);
  if (title) params.set("release_title", title);

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discogs-search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  if (!res.ok) throw new Error("Discogs search failed");
  return res.json();
}
