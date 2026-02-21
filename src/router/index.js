import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "@/lib/supabase";

import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      component: AuthLayout,
      children: [
        { path: "", component: () => import("@/pages/LoginView.vue") },
      ],
    },
    {
      path: "/",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", component: () => import("@/pages/CollectionView.vue") },
        { path: "add", component: () => import("@/pages/AddCdView.vue") },
        { path: "random", component: () => import("@/pages/RandomView.vue") },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  if (to.meta.requiresAuth && !loggedIn) return "/login";
  if (loggedIn && to.path === "/login") return "/";
});

export default router;
