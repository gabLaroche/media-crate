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
        {
          path: "",
          component: () => import("@/pages/LoginView.vue"),
          meta: {
            title: "Login | My music collection",
          },
        },
      ],
    },
    {
      path: "/",
      component: MainLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: "",
          component: () => import("@/pages/CollectionView.vue"),
          meta: {
            title: "My music collection",
          },
        },
        {
          path: "add",
          component: () => import("@/pages/AddMediaItemView.vue"),
          meta: {
            title: "Add media item | My music collection",
          },
        },
        {
          path: "random",
          component: () => import("@/pages/RandomView.vue"),
          meta: {
            title: "Random media item | My music collection",
          },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  document.title = to.meta.title || "My music collection";

  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  if (to.meta.requiresAuth && !loggedIn) return "/login";
  if (loggedIn && to.path === "/login") return "/";
});

export default router;
