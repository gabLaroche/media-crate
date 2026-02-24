<script setup>
import { ref, onMounted } from "vue";
import { useMediaItems } from "@/composables/useMediaItems";
import MediaItemCard from "@/components/MediaItemCard.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const { fetchRandomAlbum, updateRecencyWindow } = useMediaItems();
const current = ref(null);
const isFetching = ref(false);

onMounted(async () => {
    await updateRecencyWindow();
});

const pick = async () => {
    isFetching.value = true;
    const album = await fetchRandomAlbum();
    if (album) {
        current.value = album;
    }
    isFetching.value = false;
};
</script>

<template>
    <div>
        <h1>Random Pick</h1>
        <button @click="pick">Pick Media item</button>

        <LoadingSpinner v-if="isFetching" />

        <div class="media-item-container">
            <MediaItemCard
                v-if="current"
                :media-item="current"
                :show-buttons="false"
            />
        </div>
    </div>
</template>

<style scoped>
.media-item-container {
    margin-top: 20px;
}
</style>
