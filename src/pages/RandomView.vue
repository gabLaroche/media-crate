<script setup>
import { ref } from "vue";
import { useMediaItems } from "@/composables/useMediaItems";

const { getRandomMediaItem } = useMediaItems();
const current = ref(null);

const pick = async () => (current.value = await getRandomMediaItem());
</script>

<template>
    <div>
        <h1>Random Pick</h1>
        <button @click="pick">Pick Media item</button>

        <div v-if="current">
            <h2>{{ current.album_name }}</h2>
            <p>{{ current.artist }}</p>
        </div>
    </div>
</template>
