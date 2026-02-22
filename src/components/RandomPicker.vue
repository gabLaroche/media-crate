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
        <img
            v-if="current.artwork_url"
            :src="current.artwork_url"
            width="200"
        />
        <img v-else src="/No_Image_Available.jpg" width="200" />
        <h2>{{ current.album_name }}</h2>
        <p>{{ current.artist }}</p>
    </div>
</template>
