import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const sources = ref([]);
const { user } = useAuth();

export function useSources() {
  const fetchSources = async () => {
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    sources.value = data;
  };

  const getOrCreateSource = async (name) => {
    if (!name?.trim()) return null;

    const trimmed = name.trim();

    // Check if already loaded locally
    const existingLocal = sources.value.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existingLocal) return existingLocal.id;

    // Double-check in DB (safety)
    const { data: existingDb } = await supabase
      .from("sources")
      .select("*")
      .ilike("name", trimmed)
      .maybeSingle();

    if (existingDb) {
      sources.value.push(existingDb);
      return existingDb.id;
    }

    // Create new source
    const { data: newSource, error } = await supabase
      .from("sources")
      .insert([
        {
          name: trimmed,
          user_id: user.value.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    sources.value.push(newSource);
    return newSource.id;
  };

  return {
    sources,
    fetchSources,
    getOrCreateSource,
  };
}
