<script setup>
import ReleaseForm from "@/components/ReleaseForm.vue";
</script>

<template>
    <div class="page">
        <h1>Add Release</h1>
        <p class="page-subtitle">
            Search Discogs for a release or fill in the details manually.
        </p>
        <ReleaseForm />
    </div>
</template>

<style lang="scss" scoped>
.page-subtitle {
    color: $text-muted;
    margin: -0.75rem 0 1.5rem;
}
</style>
