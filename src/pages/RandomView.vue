<script setup>
import { ref } from "vue";
import { useMediaItems } from "@/composables/useMediaItems";
import MediaItemCard from "@/components/MediaItemCard.vue";

const { getRandomMediaItem } = useMediaItems();
const current = ref(null);

const pick = async () => (current.value = await getRandomMediaItem());
</script>

<template>
    <div>
        <h1>Random Pick</h1>
        <button @click="pick">Pick Media item</button>

        <MediaItemCard
            v-if="current"
            :media-item="current"
            :show-buttons="false"
        />
    </div>
</template>
