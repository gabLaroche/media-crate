<script setup>
const { mediaItem } = defineProps(["mediaItem"]);

const acquiredDate = new Date(mediaItem.acquired_date).toLocaleDateString(
    "en-CA",
    {
        year: "numeric",
        month: "short",
        day: "numeric",
    },
);
</script>

<template>
    <div class="card">
        <img
            v-if="mediaItem.artwork_url"
            :src="mediaItem.artwork_url"
            width="80"
            height="80"
        />
        <img v-else src="/No_Image_Available.jpg" width="80" height="80" />

        <div>
            <strong>{{ mediaItem.artist }}</strong>
            <div>{{ mediaItem.album_name }}</div>
            <div>{{ mediaItem.release_date }}</div>
            <div>
                Acquired:
                {{ acquiredDate }}
            </div>
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
