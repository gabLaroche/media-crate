import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const user = ref(null);

export function useAuth() {
  const init = async () => {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user || null;

    supabase.auth.onAuthStateChange((_, session) => {
      user.value = session?.user || null;
    });
  };

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const logout = () => supabase.auth.signOut();

  const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email);

  const updatePassword = (password) => supabase.auth.updateUser({ password });

  return { user, init, login, logout, resetPassword, updatePassword };
}
