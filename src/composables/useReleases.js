import { ref } from "vue";
import { supabase } from "@/lib/supabase";
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

  // --- Shared artwork upload helper ---
  const uploadArtwork = async (file, hash, userId) => {
    // 1. Check if identical image already exists by hash
    if (hash) {
      const { data: existingArtwork } = await supabase
        .from("artworks")
        .select("id, url")
        .eq("hash", hash)
        .maybeSingle();

      if (existingArtwork) return existingArtwork.url;
    }

    // 2. Check quota before uploading
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("used_bytes, upload_quota_mb")
      .eq("id", userId)
      .single();

    if (profileErr) throw profileErr;

    const quotaBytes = (profile.upload_quota_mb ?? 50) * 1024 * 1024;
    if (profile.used_bytes + file.size > quotaBytes) {
      const usedMb = (profile.used_bytes / 1024 / 1024).toFixed(1);
      const quotaMb = profile.upload_quota_mb ?? 50;
      throw new Error(
        `Storage quota exceeded (${usedMb} MB used of ${quotaMb} MB).`,
      );
    }

    // 3. Upload to Storage
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("artworks")
      .upload(filePath, file, { contentType: file.type });

    if (uploadErr) throw uploadErr;

    const {
      data: { publicUrl },
    } = supabase.storage.from("artworks").getPublicUrl(filePath);

    // 4. Insert into artworks table
    const { data: artworkRow, error: artworkErr } = await supabase
      .from("artworks")
      .insert({
        file_path: filePath,
        url: publicUrl,
        size_bytes: file.size,
        hash: hash ?? null,
        owner_user_id: userId,
      })
      .select("id, url")
      .single();

    if (artworkErr) throw artworkErr;

    return artworkRow.url;
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
        const url = await uploadArtwork(
          form.artwork_file,
          form.artwork_hash,
          user.value.id,
        );
        // Fetch the artwork id by url to store as FK
        const { data: artworkRow } = await supabase
          .from("artworks")
          .select("id")
          .eq("url", url)
          .maybeSingle();
        if (artworkRow) artworkId = artworkRow.id;
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
    const mapping = sortColumnMap[criteria] ?? {
      column: "created_at",
      foreignTable: undefined,
    };
    const { data } = await supabase
      .from("collections")
      .select("*, release:releases(*, artwork:artworks(*))")
      .order(mapping.column, {
        ascending,
        referencedTable: mapping.foreignTable,
      });
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
    uploadArtwork,
  };
}
