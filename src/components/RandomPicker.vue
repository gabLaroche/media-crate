<script setup>
import { ref } from "vue";
import { useCds } from "@/composables/useCds";

const { getSmartRandomCd, markPlayed } = useCds();
const current = ref(null);

const pick = async () => {
    current.value = await getSmartRandomCd();
};

const played = async () => {
    await markPlayed(current.value);
};
</script>

<template>
    <button @click="pick">Pick a CD</button>

    <div v-if="current">
        <h2>{{ current.album_name }}</h2>
        <p>{{ current.artist }}</p>
        <button @click="played">Mark Played</button>
    </div>
</template>
