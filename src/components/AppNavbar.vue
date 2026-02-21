<script setup>
import { useAuth } from "@/composables/useAuth";
const { logout } = useAuth();
</script>

<template>
    <nav class="navbar">
        <router-link to="/">Collection</router-link>
        <router-link to="/random">Random</router-link>
        <router-link to="/add">Add CD</router-link>

        <button @click="logout">Logout</button>
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
