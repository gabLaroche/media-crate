<script setup>
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
const router = useRouter();
const { logout } = useAuth();

const onLogout = async () => {
    await logout();
    router.push({ path: "/login" });
};
</script>

<template>
    <nav class="navbar">
        <router-link to="/">Collection</router-link>
        <router-link to="/random">Random</router-link>
        <router-link to="/add">Add Media item</router-link>

        <button @click="onLogout">Logout</button>
    </nav>
</template>

<style>
.navbar {
    display: flex;
    gap: 20px;
    padding: 12px;
    border-bottom: 1px solid #ddd;
}
</style>
