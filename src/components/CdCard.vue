<script setup>
defineProps(["cd"]);
</script>

<template>
    <div class="card">
        <h3>{{ cd.album_name }}</h3>
        <p>{{ cd.artist }}</p>
        <small>{{ cd.release_date }}</small>
        <p>{{ cd.notes }}</p>
    </div>
</template>
