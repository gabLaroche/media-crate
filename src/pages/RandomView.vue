<script setup>
import { ref } from "vue";
import { RiLoader4Line } from "@remixicon/vue";
import { useMediaItems } from "@/composables/useMediaItems";
import MediaItemCard from "@/components/MediaItemCard.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const { getRandomMediaItem } = useMediaItems();
const current = ref(null);
const isFetching = ref(false);

const pick = async () => {
    isFetching.value = true;
    current.value = await getRandomMediaItem().finally(() => {
        isFetching.value = false;
    });
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
