import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const releases = ref([]);
export function useReleases() {
  const flattenCollection = (item) => ({
    // collection fields
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
    // release fields (flattened)
    album_name: item.release?.title,
    artist: item.release?.artist,
    release_date: item.release?.year,
    discogs_master_id: item.release?.discogs_master_id,
    // artwork
    artwork_url: item.release?.artwork?.url ?? null,
    artwork_file_path: item.release?.artwork?.file_path ?? null,
  });

  const fetchAll = async () => {
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .order("created_at", { ascending: true });
    releases.value = (data || []).map(flattenCollection);
  };

  const fetchOne = async (id) => {
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .eq("id", id)
      .single();
    return data ? flattenCollection(data) : null;
  };

  const addRelease = async (form) => {
    const { user } = useAuth();

    // 1. Check if release already exists by discogs_master_id
    let releaseRow = null;

    if (form.discogs_master_id) {
      const { data: existing } = await supabase
        .from("releases")
        .select("id")
        .eq("discogs_master_id", form.discogs_master_id)
        .maybeSingle();

      if (existing) releaseRow = existing;
    }

    // 2. If release doesn't exist, handle artwork then insert release
    if (!releaseRow) {
      let artworkId = null;

      if (form.artwork_file) {
        // Check quota before uploading
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("used_bytes, upload_quota_mb")
          .eq("id", user.value.id)
          .single();

        if (profileErr) throw profileErr;

        const quotaBytes = (profile.upload_quota_mb ?? 50) * 1024 * 1024;
        if (profile.used_bytes + form.artwork_file.size > quotaBytes) {
          const usedMb = (profile.used_bytes / 1024 / 1024).toFixed(1);
          const quotaMb = profile.upload_quota_mb ?? 50;
          throw new Error(
            `Storage quota exceeded (${usedMb} MB used of ${quotaMb} MB).`,
          );
        }

        // User uploaded a file — upload to Storage then insert into artworks
        const ext = form.artwork_file.name.split(".").pop();
        const filePath = `${user.value.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("artworks")
          .upload(filePath, form.artwork_file, {
            contentType: form.artwork_file.type,
          });

        if (uploadErr) throw uploadErr;

        const {
          data: { publicUrl },
        } = supabase.storage.from("artworks").getPublicUrl(filePath);

        const { data: artworkRow, error: artworkErr } = await supabase
          .from("artworks")
          .insert({
            file_path: filePath,
            url: publicUrl,
            size_bytes: form.artwork_file.size,
            owner_user_id: user.value.id,
          })
          .select("id")
          .single();

        if (artworkErr) throw artworkErr;
        artworkId = artworkRow.id;
      } else if (form.artwork_url) {
        // Discogs URL — store directly
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
          artwork_id: artworkId,
        })
        .select("id")
        .single();

      if (releaseErr) throw releaseErr;
      releaseRow = newRelease;
    }

    // 3. Insert into collections (per-user)
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

  const sortReleases = async (criteria, ascending = true) => {
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .order(criteria, { ascending });
    releases.value = (data || []).map(flattenCollection);
  };

  const updateRelease = (id, updates) =>
    supabase.from("collections").update(updates).eq("id", id);

  const deleteRelease = (id) =>
    supabase.from("collections").delete().eq("id", id);

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

    if (!res.ok) return null;

    const body = await res.json();
    const item = body.results?.[0];
    if (!item) return null;

    return {
      id: item.id,
      user_id: item.user_id,
      release_id: item.releases?.id,
      media_type: item.media_type,
      exclude_from_randomizer: item.exclude_from_randomizer,
      created_at: item.created_at,
      album_name: item.releases?.title,
      artist: item.releases?.artist,
      release_date: item.releases?.year,
      discogs_master_id: item.releases?.discogs_master_id,
      artwork_url: item.releases?.artworks?.url ?? null,
      artwork_file_path: item.releases?.artworks?.file_path ?? null,
    };
  };

  return {
    releases,
    fetchAll,
    fetchOne,
    addRelease,
    updateRelease,
    deleteRelease,
    fetchRandomRelease,
    sortReleases,
    bulkAddReleases,
  };
}
