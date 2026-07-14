import { ref } from "vue";
import { supabase, handleUnauthorized } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const releases = ref([]);

export function useReleases() {
  const flattenCollection = (item) => ({
    id: item.id,
    user_id: item.user_id,
    release_id: item.release_id,
    condition: item.condition,
    notes: item.notes,
    source_id: item.source_id,
    acquired_date: item.acquired_date,
    media_type: item.media_type,
    exclude_from_randomizer: item.exclude_from_randomizer,
    created_at: item.created_at,
    album_name: item.release?.title,
    artist: item.release?.artist,
    release_date: item.release?.year,
    discogs_master_id: item.release?.discogs_master_id,
    discogs_type: item.release?.discogs_type,
    artwork_url: item.release?.artwork?.url ?? null,
    artwork_file_path: item.release?.artwork?.file_path ?? null,
  });

  const fetchAll = async () => {
    const { user } = useAuth();
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .eq("user_id", user.value.id)
      .order("created_at", { ascending: true });
    releases.value = (data || []).map(flattenCollection);
  };

  const fetchAllForUser = async (userId) => {
    const { data, error } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    releases.value = (data || []).map(flattenCollection);
  };

  const fetchOne = async (id) => {
    const { user } = useAuth();
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .eq("id", id)
      .eq("user_id", user.value.id)
      .single();
    return data ? flattenCollection(data) : null;
  };

  // --- Shared artwork upload helper ---
  const uploadArtwork = async (file, hash) => {
    // Client-side hash dedup: skip the network round-trip if we already have this image
    if (hash) {
      const { data: existing } = await supabase
        .from("artworks")
        .select("id, url")
        .eq("hash", hash)
        .maybeSingle();
      if (existing) return { url: existing.url, id: existing.id };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const form = new FormData();
    form.append("file", file);
    if (hash) form.append("hash", hash);

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-artwork`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      },
    );

    if (res.status === 401) {
      await handleUnauthorized();
      throw new Error("Session expired");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    return { url: data.url, id: data.id };
  };

  const addRelease = async (form) => {
    const { user } = useAuth();

    let releaseRow = null;

    if (form.discogs_master_id) {
      const { data: existing } = await supabase
        .from("releases")
        .select("id")
        .eq("discogs_master_id", form.discogs_master_id)
        .maybeSingle();

      if (existing) releaseRow = existing;
    }

    if (!releaseRow) {
      let artworkId = null;

      if (form.artwork_file) {
        const { id } = await uploadArtwork(form.artwork_file, form.artwork_hash);
        artworkId = id;
      } else if (form.artwork_url) {
        const { data: artworkRow, error: artworkErr } = await supabase
          .from("artworks")
          .insert({
            url: form.artwork_url,
            owner_user_id: user.value.id,
          })
          .select("id")
          .single();

        if (artworkErr) throw artworkErr;
        artworkId = artworkRow.id;
      }

      const { data: newRelease, error: releaseErr } = await supabase
        .from("releases")
        .insert({
          title: form.album_name,
          artist: form.artist,
          year: form.release_date ? parseInt(form.release_date) : null,
          discogs_master_id: form.discogs_master_id || null,
          discogs_type: form.discogs_type || null,
          artwork_id: artworkId,
        })
        .select("id")
        .single();

      if (releaseErr) throw releaseErr;
      releaseRow = newRelease;
    }

    const { error: collErr } = await supabase.from("collections").insert({
      user_id: user.value.id,
      release_id: releaseRow.id,
      condition: form.condition || null,
      notes: form.notes || null,
      source_id: form.source_id || null,
      exclude_from_randomizer: form.exclude_from_randomizer ?? false,
      acquired_date: form.acquired_date || null,
      media_type: form.media_type || null,
    });

    if (collErr) throw collErr;
  };

  const sortColumnMap = {
    album_name: { column: "title", foreignTable: "releases" },
    artist: { column: "artist", foreignTable: "releases" },
    release_date: { column: "year", foreignTable: "releases" },
    acquired_date: { column: "acquired_date", foreignTable: undefined },
    created_at: { column: "created_at", foreignTable: undefined },
  };

  const sortReleases = async (criteria, ascending = true) => {
    const { user } = useAuth();
    const mapping = sortColumnMap[criteria] ?? {
      column: "created_at",
      foreignTable: undefined,
    };
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .eq("user_id", user.value.id)
      .order(mapping.column, {
        ascending,
        referencedTable: mapping.foreignTable,
      });
    releases.value = (data || []).map(flattenCollection);
  };

  const sortReleasesForUser = async (userId, criteria, ascending = true) => {
    const mapping = sortColumnMap[criteria] ?? {
      column: "created_at",
      foreignTable: undefined,
    };
    const { data, error } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .eq("user_id", userId)
      .order(mapping.column, {
        ascending,
        referencedTable: mapping.foreignTable,
      });
    if (error) throw error;
    releases.value = (data || []).map(flattenCollection);
  };

  const updateRelease = async (id, updates) => {
    const { user } = useAuth();
    return supabase
      .from("collections")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.value.id);
  };

  const deleteRelease = async (id) => {
    const { user } = useAuth();
    return supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.value.id);
  };

  const bulkAddReleases = async (payload) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-add-releases`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (res.status === 401) {
      await handleUnauthorized();
      throw new Error("Session expired");
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Bulk add failed");
    }

    return res.json();
  };

  const fetchRandomRelease = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/randomize-collection`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (res.status === 401) {
      await handleUnauthorized();
      return null;
    }

    if (!res.ok) return null;

    const body = await res.json();
    const item = body.results?.[0];
    if (!item) return null;

    return {
      id: item.id,
      user_id: item.user_id,
      release_id: item.releases?.id,
      condition: item.condition,
      notes: item.notes,
      source_id: item.source_id,
      acquired_date: item.acquired_date,
      media_type: item.media_type,
      exclude_from_randomizer: item.exclude_from_randomizer,
      created_at: item.created_at,
      album_name: item.releases?.title,
      artist: item.releases?.artist,
      release_date: item.releases?.year,
      discogs_master_id: item.releases?.discogs_master_id,
      discogs_type: item.releases?.discogs_type,
      artwork_url: item.releases?.artworks?.url ?? null,
      artwork_file_path: item.releases?.artworks?.file_path ?? null,
    };
  };

  return {
    releases,
    fetchAll,
    fetchAllForUser,
    fetchOne,
    addRelease,
    updateRelease,
    deleteRelease,
    fetchRandomRelease,
    sortReleases,
    sortReleasesForUser,
    bulkAddReleases,
    uploadArtwork,
  };
}
