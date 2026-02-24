import { ref, watch } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const mediaItems = ref([]);
const STORAGE_KEY = "shuffle_recent_ids";

export function useMediaItems() {
  const fetchAll = async () => {
    const { data } = await supabase
      .from("media_items")
      .select("*")
      .order("acquired_date", { ascending: true });
    mediaItems.value = data || [];
  };

  const fetchOne = async (id) => {
    const { data } = await supabase
      .from("media_items")
      .select("*")
      .eq("id", id)
      .single();

    console.log(data);
    return data;
  };

  const addMediaItem = (mediaItem) =>
    supabase.from("media_items").insert(mediaItem);

  const sortMediaItems = async (criteria, ascending = true) => {
    const { data } = await supabase
      .from("media_items")
      .select("*")
      .order(criteria, { ascending });
    mediaItems.value = data || [];
  };

  const updateMediaItem = (id, updates) =>
    supabase.from("media_items").update(updates).eq("id", id);

  const deleteMediaItem = (id) =>
    supabase.from("media_items").delete().eq("id", id);

  const recentIds = ref([]);
  const recencyWindow = ref(3);

  if (localStorage.getItem(STORAGE_KEY)) {
    try {
      recentIds.value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      recentIds.value = [];
    }
  }

  watch(
    recentIds,
    (newVal) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
    },
    { deep: true },
  );

  const updateRecencyWindow = async () => {
    const { count } = await supabase
      .from("media_items")
      .select("*", { count: "exact", head: true })
      .eq("excluded_from_randomizer", false);

    if (count) {
      recencyWindow.value = Math.max(3, Math.floor(count * 0.1));
    }
  };

  const fetchRandomAlbum = async () => {
    const { user } = useAuth();
    if (!user) return null;

    const { data: album, error } = await supabase.rpc(
      "get_weighted_random_album",
      {
        p_user_id: user.value.id,
        p_recent_ids: recentIds.value.length > 0 ? recentIds.value : null,
      },
    );

    if (error) {
      console.error(error);
      return null;
    }

    const selected = album?.[0] ?? null;
    if (!selected) return null;

    // Update recentIds and persist automatically via watch
    recentIds.value.unshift(selected.id);
    if (recentIds.value.length > recencyWindow.value) {
      recentIds.value.pop();
    }

    return selected;
  };

  const getRandomMediaItem = async () => {
    const { data } = await supabase.rpc("get_random_media_item");
    return data?.[0];
  };

  return {
    mediaItems,
    fetchAll,
    fetchOne,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
    getRandomMediaItem,
    fetchRandomAlbum,
    updateRecencyWindow,
    sortMediaItems,
  };
}
