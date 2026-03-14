<script setup>
import AppNavbar from "@/components/AppNavbar.vue";
</script>

<template>
    <div class="main-layout">
        <AppNavbar />
        <main class="content">
            <router-view />
        </main>
    </div>
</template>
