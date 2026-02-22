<script setup>
defineProps(["cd"]);
</script>

<template>
    <div class="card">
        <img v-if="cd.artwork_url" :src="cd.artwork_url" width="80" />
        <img v-else src="/No_Image_Available.jpg" width="80" />

        <div>
            <strong>{{ cd.artist }}</strong>
            <div>{{ cd.album_name }}</div>
            <div>{{ cd.release_date }}</div>
        </div>
    </div>
</template>

<style>
.card {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid #eee;
}
</style>
