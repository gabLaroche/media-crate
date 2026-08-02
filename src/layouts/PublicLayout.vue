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

<style scoped>
.main-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
}
</style>
