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
            title: "Login | MediaCrate",
          },
        },
      ],
    },
    {
      path: "/confirm-sign-up",
      component: AuthLayout,
      children: [
        {
          path: "",
          component: () => import("@/pages/ConfirmSignUpView.vue"),
          meta: {
            title: "Confirm Sign Up | MediaCrate",
          },
        },
      ],
    },
    {
      path: "/check-email",
      component: AuthLayout,
      children: [
        {
          path: "",
          component: () => import("@/pages/CheckEmailView.vue"),
          meta: {
            title: "Reset Password | MediaCrate",
          },
        },
      ],
    },
    {
      path: "/create-account",
      component: AuthLayout,
      children: [
        {
          path: "",
          component: () => import("@/pages/CreateAccountView.vue"),
          meta: {
            title: "Create Account | MediaCrate",
          },
        },
      ],
    },
    {
      path: "/reset-password",
      component: AuthLayout,
      children: [
        {
          path: "",
          component: () => import("@/pages/ResetPasswordView.vue"),
          meta: {
            title: "Reset Password | MediaCrate",
          },
        },
      ],
    },
    {
      path: "/update-password",
      component: AuthLayout,
      children: [
        {
          path: "",
          component: () => import("@/pages/UpdatePasswordView.vue"),
          meta: {
            title: "Update Password | MediaCrate",
          },
        },
      ],
    },
    {
      path: "/account",
      component: MainLayout,
      children: [
        {
          path: "",
          component: () => import("@/pages/AccountView.vue"),
          meta: {
            title: "My account | MediaCrate",
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
          name: "collection",
          component: () => import("@/pages/CollectionView.vue"),
          meta: {
            title: "MediaCrate",
          },
        },
        {
          path: "add",
          name: "add",
          component: () => import("@/pages/AddReleaseView.vue"),
          meta: {
            title: "Add release | MediaCrate",
          },
        },
        {
          path: "bulk-add",
          name: "bulk-add",
          component: () => import("@/pages/BulkAddReleaseView.vue"),
          meta: {
            title: "Bulk add releases | MediaCrate",
          },
        },
        {
          path: "edit/:id",
          name: "edit",
          component: () => import("@/pages/EditReleaseView.vue"),
          props: true,
          meta: {
            title: "Edit release | MediaCrate",
          },
        },
        {
          path: "random",
          name: "random",
          component: () => import("@/pages/RandomView.vue"),
          meta: {
            title: "Random release | MediaCrate",
          },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  document.title = to.meta.title || "MediaCrate";

  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  if (to.meta.requiresAuth && !loggedIn) return "/login";
  if (loggedIn && to.path === "/login") return "/";
});

export default router;
