import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const user = ref(null);

export function useAuth() {
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("upload_quota_mb, used_bytes, is_public, slug")
      .eq("id", userId)
      .single();
    return data ?? {};
  };

  const setUser = async (authUser) => {
    if (!authUser) {
      user.value = null;
      return;
    }
    const profile = await fetchProfile(authUser.id);
    user.value = {
      ...authUser,
      ...profile,
      display_name: authUser.user_metadata?.display_name ?? null,
    };
  };

  const init = async () => {
    const { data } = await supabase.auth.getSession();
    await setUser(data.session?.user ?? null);

    supabase.auth.onAuthStateChange(async (_, session) => {
      await setUser(session?.user ?? null);
    });
  };

  const signUp = (email, password, displayName) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const logout = () => supabase.auth.signOut();

  const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email);

  const updatePassword = (password) => supabase.auth.updateUser({ password });

  const updateProfile = async ({ display_name, is_public }) => {
    if (!user.value) return { error: "Not authenticated" };

    // Capture the ID immediately — before any async calls that
    // might trigger onAuthStateChange and reassign user.value
    const userId = user.value.id;

    try {
      const errors = [];

      if (
        display_name !== undefined &&
        user.value?.user_metadata?.display_name !== display_name
      ) {
        const { error } = await supabase.auth.updateUser({
          data: { display_name },
        });
        if (error) errors.push(error.message);
      }

      if (is_public !== undefined) {
        const { error } = await supabase
          .from("profiles")
          .update({ is_public })
          .eq("id", userId);
        if (error) errors.push(error.message);
      }

      if (errors.length) return { error: errors.join(". ") };

      const { data } = await supabase.auth.getUser();
      if (data?.user) await setUser(data.user);

      return { error: null };
    } catch (e) {
      return { error: e.message ?? "An unexpected error occurred" };
    }
  };

  return {
    user,
    init,
    signUp,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
  };
}
