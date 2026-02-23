import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const mediaItems = ref([]);

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
    sortMediaItems,
  };
}
