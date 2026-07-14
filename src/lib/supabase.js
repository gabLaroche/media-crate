import { createClient } from "@supabase/supabase-js";
import router from "@/router";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export async function handleUnauthorized() {
  if (router.currentRoute.value.path === "/login") return;

  try {
    await supabase.auth.signOut();
  } catch {
    // Session is already invalid server-side; nothing left to clean up.
  }

  router.push({ path: "/login", query: { reason: "session-expired" } });
}

async function authAwareFetch(input, init) {
  const res = await fetch(input, init);
  if (res.status === 401) await handleUnauthorized();
  return res;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: authAwareFetch },
});
