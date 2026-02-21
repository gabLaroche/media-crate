import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const cds = ref([]);

export function useCds() {
  const fetchAll = async () => {
    const { data } = await supabase.from("cds").select("*").order("artist");
    cds.value = data || [];
  };

  const addCd = (cd) => supabase.from("cds").insert(cd);

  const updateCd = (id, updates) =>
    supabase.from("cds").update(updates).eq("id", id);

  const deleteCd = (id) => supabase.from("cds").delete().eq("id", id);

  const getRandomCd = async () => {
    const { data } = await supabase.rpc("get_random_cd");
    return data?.[0];
  };

  return { cds, fetchAll, addCd, updateCd, deleteCd, getRandomCd };
}
