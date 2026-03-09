<script setup>
import AccountMenu from "@/components/AccountMenu.vue";
</script>

<template>
    <nav class="navbar">
        <router-link to="/">Collection</router-link>
        <router-link to="/add">Add</router-link>
        <router-link to="/bulk-add">Bulk Add</router-link>
        <router-link to="/random">Random</router-link>
        <AccountMenu />
    </nav>
</template>

<style lang="scss" scoped>
.navbar {
    align-items: center;
    display: flex;
    gap: 2rem;
    padding: 1.2rem;
    border-bottom: 1px solid #ddd;

    a {
        font-weight: bold;
    }
}
</style>
