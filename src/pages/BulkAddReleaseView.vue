<script setup>
import ReleaseForm from "@/components/ReleaseForm.vue";
</script>

<template>
    <div class="page">
        <h1>Bulk Add Releases</h1>
        <p class="page-subtitle">
            Search for an artist and select multiple releases to add at
            once.
        </p>
        <ReleaseForm :bulk="true" />
    </div>
</template>

<style lang="scss" scoped>
.page-subtitle {
    color: $text-muted;
    margin: -0.75rem 0 1.5rem;
}
</style>
